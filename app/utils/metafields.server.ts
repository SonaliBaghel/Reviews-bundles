import db from "../db.server";
import { appConfig } from "../config/app.config";
import logger from "./logger.server";

/**
 * Invalidates Shopify's product cache by triggering a lightweight product update.
 * This ensures that metafield changes are immediately reflected on the storefront.
 * 
 * @param productGid The product GID (e.g., "gid://shopify/Product/123456789")
 * @param admin The Shopify Admin API client
 * @returns Object with success status
 */
async function invalidateProductCache(
    productGid: string,
    admin: any
): Promise<{ success: boolean; error?: string }> {
    try {
        logger.info(`[Cache Invalidation] Triggering cache invalidation for product ${productGid}`);

        // Trigger a lightweight product update to invalidate cache
        // We'll update the product's tags and immediately set them back
        const getTagsResponse = await admin.graphql(`
            query GetProductTags($id: ID!) {
                product(id: $id) {
                    id
                    tags
                }
            }
        `, {
            variables: { id: productGid }
        });

        const tagsData = await getTagsResponse.json();
        const currentTags = tagsData.data?.product?.tags || [];

        // Update product with same tags to trigger cache invalidation
        const updateResponse = await admin.graphql(`
            mutation UpdateProduct($input: ProductInput!) {
                productUpdate(input: $input) {
                    product {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `, {
            variables: {
                input: {
                    id: productGid,
                    tags: currentTags
                }
            }
        });

        const updateResult = await updateResponse.json();

        if (updateResult.errors || updateResult.data?.productUpdate?.userErrors?.length) {
            logger.error(`[Cache Invalidation] ❌ FAILED for product ${productGid}:`, updateResult.errors || updateResult.data.productUpdate.userErrors);
            return { success: false, error: 'Cache invalidation failed' };
        }

        logger.info(`[Cache Invalidation] ✅ SUCCESS for product ${productGid}`);
        return { success: true };

    } catch (error) {
        logger.error(`[Cache Invalidation] ❌ EXCEPTION for product ${productGid}:`, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Verifies that metafields were actually set by querying them back from Shopify.
 * 
 * @param productGid The product GID
 * @param admin The Shopify Admin API client
 * @param expectedRating The expected rating value
 * @param expectedCount The expected count value
 * @returns Object with verification status
 */
async function verifyMetafieldValues(
    productGid: string,
    admin: any,
    expectedRating: string,
    expectedCount: number
): Promise<{ verified: boolean; actualRating?: string; actualCount?: string }> {
    try {
        logger.info(`[Metafield Verification] Verifying metafields for product ${productGid}`);

        const response = await admin.graphql(`
            query GetProductMetafields($id: ID!, $namespace: String!, $countKey: String!) {
                product(id: $id) {
                    id
                    rating: metafield(namespace: $namespace, key: "rating") {
                        value
                    }
                    reviewCount: metafield(namespace: $namespace, key: $countKey) {
                        value
                    }
                }
            }
        `, {
            variables: {
                id: productGid,
                namespace: appConfig.metafields.namespace,
                countKey: appConfig.metafields.countKey
            }
        });

        const result = await response.json();
        const actualRating = result.data?.product?.rating?.value;
        const actualCount = result.data?.product?.reviewCount?.value;

        logger.info(`[Metafield Verification] Expected: Rating=${expectedRating}, Count=${expectedCount}`);
        logger.info(`[Metafield Verification] Actual: Rating=${actualRating}, Count=${actualCount}`);

        const verified = actualRating === expectedRating && actualCount === expectedCount.toString();

        if (verified) {
            logger.info(`[Metafield Verification] ✅ VERIFIED for product ${productGid}`);
        } else {
            logger.warn(`[Metafield Verification] ⚠️ MISMATCH for product ${productGid}`);
        }

        return { verified, actualRating, actualCount };

    } catch (error) {
        logger.error(`[Metafield Verification] ❌ EXCEPTION for product ${productGid}:`, error);
        return { verified: false };
    }
}

/**
 * Calculates and updates Shopify product metafields for review rating and count.
 * Handles both direct and syndicated reviews.
 * 
 * @param productNumericId The numeric ID of the product (e.g., "123456789")
 * @param admin The Shopify Admin API client
 * @param shop The shop domain (e.g., "store.myshopify.com")
 * @returns Object with success status and optional error message
 */
export async function calculateAndUpdateProductMetafields(
    productNumericId: string,
    admin: any,
    shop: string
): Promise<{ success: boolean; error?: string; rating?: string; count?: number }> {
    try {
        logger.info(`[Metafield Update] Starting update for product ${productNumericId} on shop ${shop}`);

        // 1. Fetch all approved reviews for this product (direct + syndicated)
        const approvedReviews = await (db.productReview as any).findMany({
            where: {
                shop,
                productId: productNumericId,
                status: 'approved',
            },
            select: { id: true, rating: true },
        });

        logger.info(`[Metafield Update] Found ${approvedReviews.length} approved reviews for product ${productNumericId}`);

        // 2. Calculate final stats
        const finalReviewCount = approvedReviews.length;
        const totalRatingSum = approvedReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        const finalAverageRating = finalReviewCount > 0 ? (totalRatingSum / finalReviewCount) : 0;

        const productGid = `gid://shopify/Product/${productNumericId}`;

        logger.info(`[Metafield Update] Calculated stats for product ${productNumericId}: Rating=${finalAverageRating.toFixed(1)}, Count=${finalReviewCount}`);
        logger.info(`[Metafield Update] Sending mutation to Shopify for product GID: ${productGid}`);

        // 5. Update Shopify Metafields
        const response = await admin.graphql(`
      mutation UpdateProductMetafields($input: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $input) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors { field message }
        }
      }`,
            {
                variables: {
                    input: [
                        {
                            ownerId: productGid,
                            namespace: appConfig.metafields.namespace,
                            key: appConfig.metafields.ratingKey,
                            value: finalReviewCount > 0 ? finalAverageRating.toFixed(1) : null,
                            type: "number_decimal"
                        },
                        {
                            ownerId: productGid,
                            namespace: appConfig.metafields.namespace,
                            key: appConfig.metafields.countKey,
                            value: finalReviewCount > 0 ? finalReviewCount.toString() : null,
                            type: "number_integer"
                        }
                    ]
                }
            }
        );

        const result = await response.json();

        logger.info(`[Metafield Update] GraphQL Response for product ${productNumericId}:`, JSON.stringify(result, null, 2));

        if (result.errors || result.data?.metafieldsSet?.userErrors?.length) {
            const errorDetails = result.errors || result.data.metafieldsSet.userErrors;
            logger.error(`[Metafield Update] ❌ FAILED for product ${productNumericId}:`, errorDetails);
            return {
                success: false,
                error: JSON.stringify(errorDetails),
                rating: finalAverageRating.toFixed(1),
                count: finalReviewCount
            };
        }

        logger.info(`[Metafield Update] ✅ SUCCESS for product ${productNumericId}: Rating=${finalAverageRating.toFixed(1)}, Count=${finalReviewCount}`);

        // Log the actual metafield values that were set
        if (result.data?.metafieldsSet?.metafields) {
            logger.info(`[Metafield Update] Updated metafields:`, result.data.metafieldsSet.metafields);
        }

        // 6. Invalidate product cache to ensure storefront updates immediately
        const cacheInvalidation = await invalidateProductCache(productGid, admin);
        if (!cacheInvalidation.success) {
            logger.warn(`[Metafield Update] ⚠️ Cache invalidation failed for product ${productNumericId}, but metafields were updated`);
        }

        // 7. Verify metafield values were actually set (especially important for zero values)
        const verification = await verifyMetafieldValues(
            productGid,
            admin,
            finalAverageRating.toFixed(1),
            finalReviewCount
        );

        if (!verification.verified) {
            logger.error(`[Metafield Update] ⚠️ Metafield verification failed for product ${productNumericId}`);
            logger.error(`[Metafield Update] Expected: Rating=${finalAverageRating.toFixed(1)}, Count=${finalReviewCount}`);
            logger.error(`[Metafield Update] Actual: Rating=${verification.actualRating}, Count=${verification.actualCount}`);
        }

        return {
            success: true,
            rating: finalAverageRating.toFixed(1),
            count: finalReviewCount
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Metafield Update] ❌ EXCEPTION for product ${productNumericId}:`, error);
        return {
            success: false,
            error: errorMessage
        };
    }
}

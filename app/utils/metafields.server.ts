import db from "../db.server";
import { appConfig } from "../config/app.config";
import logger from "./logger.server";

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

        // 1. Fetch direct approved reviews
        const directApprovedReviews = await (db.productReview as any).findMany({
            where: {
                shop,
                productId: productNumericId,
                status: 'approved',
                isBundleReview: false,
            },
            select: { id: true, rating: true },
        });

        logger.info(`[Metafield Update] Found ${directApprovedReviews.length} direct approved reviews for product ${productNumericId}`);

        // 2. Fetch syndicated approved reviews
        const syndicatedReviews = await (db.bundleReview as any).findMany({
            where: {
                productId: productNumericId,
                review: {
                    shop,
                    status: 'approved',
                }
            },
            select: {
                reviewId: true,
                review: { select: { rating: true } },
                bundleProductId: true
            }
        });

        logger.info(`[Metafield Update] Found ${syndicatedReviews.length} syndicated approved reviews for product ${productNumericId}`);

        // 3. Consolidate into a unique map to avoid double counting
        const ratingMap = new Map<string, number>();

        directApprovedReviews.forEach((review: any) => {
            ratingMap.set(`direct-${review.id}`, review.rating);
        });

        syndicatedReviews.forEach((bundleReview: any) => {
            ratingMap.set(`syndicated-${bundleReview.bundleProductId}-${bundleReview.reviewId}`,
                bundleReview.review.rating);
        });

        // 4. Calculate final stats
        const finalReviewCount = ratingMap.size;
        const totalRatingSum = Array.from(ratingMap.values()).reduce((sum, rating) => sum + rating, 0);
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
                            value: finalAverageRating.toFixed(1),
                            type: "number_decimal"
                        },
                        {
                            ownerId: productGid,
                            namespace: appConfig.metafields.namespace,
                            key: appConfig.metafields.countKey,
                            value: finalReviewCount.toString(),
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
        } else {
            logger.info(`[Metafield Update] ✅ SUCCESS for product ${productNumericId}: Rating=${finalAverageRating.toFixed(1)}, Count=${finalReviewCount}`);

            // Log the actual metafield values that were set
            if (result.data?.metafieldsSet?.metafields) {
                logger.info(`[Metafield Update] Updated metafields:`, result.data.metafieldsSet.metafields);
            }

            return {
                success: true,
                rating: finalAverageRating.toFixed(1),
                count: finalReviewCount
            };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[Metafield Update] ❌ EXCEPTION for product ${productNumericId}:`, error);
        return {
            success: false,
            error: errorMessage
        };
    }
}

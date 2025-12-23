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
 */
export async function calculateAndUpdateProductMetafields(productNumericId: string, admin: any, shop: string) {
    try {
        logger.info(`Updating metafields for product ${productNumericId} on shop ${shop}`);

        // 1. Fetch direct approved reviews
        const directApprovedReviews = await db.productReview.findMany({
            where: {
                shop,
                productId: productNumericId,
                status: 'approved',
                isBundleReview: false,
            },
            select: { id: true, rating: true },
        });

        // 2. Fetch syndicated approved reviews
        const syndicatedReviews = await db.bundleReview.findMany({
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

        // 5. Update Shopify Metafields
        const response = await admin.graphql(`
      mutation UpdateProductMetafields($input: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $input) {
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
        if (result.errors || result.data?.metafieldsSet?.userErrors?.length) {
            logger.error(`Metafield update errors for product ${productNumericId}:`, result.errors || result.data.metafieldsSet.userErrors);
        } else {
            logger.info(`Successfully updated metafields for product ${productNumericId}: Rating=${finalAverageRating.toFixed(1)}, Count=${finalReviewCount}`);
        }

    } catch (error) {
        logger.error(`Failed to update metafields for product ${productNumericId}:`, error);
    }
}

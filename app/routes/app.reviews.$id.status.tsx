import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server"; 
import { 
  removeSyndicatedReviews, 
  syndicateReviewToBundle, 
  removeSyndicatedReviewForProduct, 
  updateSyndicatedReviewsStatus,
  isReviewInBundle,
  isFirstApproval
} from "../utils/reviewSyndication.server"; 

const getNumericProductId = (gid: string): string => {
    const parts = gid.split('/');
    return parts[parts.length - 1];
};

async function calculateAndUpdateProductMetafields(db: any, productNumericId: string, admin: any) {
  try {
    const directApprovedReviews = await db.productReview.findMany({
      where: {
        productId: productNumericId,
        status: 'approved',
        isBundleReview: false,
      },
      select: { id: true, rating: true },
    });

    const syndicatedReviews = await db.bundleReview.findMany({
      where: {
        productId: productNumericId,
        review: {
          status: 'approved',
        }
      },
      select: { 
        reviewId: true, 
        review: { select: { rating: true } },
        bundleProductId: true 
      }
    });

    const ratingMap = new Map();
    
    directApprovedReviews.forEach(review => {
      ratingMap.set(`direct-${review.id}`, review.rating);
    });

    syndicatedReviews.forEach(bundleReview => {
      ratingMap.set(`syndicated-${bundleReview.bundleProductId}-${bundleReview.reviewId}`, 
                   bundleReview.review.rating);
    });

    const finalReviewCount = ratingMap.size;
    const totalRatingSum = Array.from(ratingMap.values()).reduce((sum, rating) => sum + rating, 0);
    const finalAverageRating = finalReviewCount > 0 ? (totalRatingSum / finalReviewCount) : 0;

    console.log(`Product ${productNumericId}: ${finalReviewCount} reviews, avg: ${finalAverageRating.toFixed(1)}`);

    const productGid = `gid://shopify/Product/${productNumericId}`;
    
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
              namespace: "reviews",
              key: "rating",
              value: finalAverageRating.toFixed(1),
              type: "number_decimal"
            },
            {
              ownerId: productGid,
              namespace: "reviews",
              key: "count",
              value: finalReviewCount.toString(),
              type: "number_integer"
            }
          ]
        }
      }
    );

    const result = await response.json();
    if (result.errors || result.data?.metafieldsSet?.userErrors?.length) {
      console.error("Metafield update errors:", result.errors || result.data.metafieldsSet.userErrors);
    }

  } catch (error) {
    console.error(`Failed to update metafields for ${productNumericId}:`, error);
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request); 
  const reviewId = params.id;
  const formData = await request.formData();
  const status = formData.get("status"); 
  const actionSource = formData.get("actionSource") as string;
  
  console.log(`STATUS UPDATE: Review ${reviewId}, Status: ${status}, Action Source: ${actionSource}`);
  
  if (!reviewId || typeof status !== "string" || !["pending", "approved", "rejected"].includes(status)) {
    return json({ error: "Invalid request data." }, { status: 400 });
  }

  try {
    const currentReview = await db.productReview.findUnique({
      where: { id: reviewId },
      select: { 
        productId: true, 
        isBundleReview: true, 
        bundleContext: true, 
        status: true 
      }, 
    });

    if (!currentReview || !currentReview.productId) {
      return json({ message: "Review not found." }, { status: 404 });
    }

    const productNumericId = getNumericProductId(currentReview.productId);
    
    let productsToUpdateMetafields: string[] = [productNumericId];

    const bundleInfo = await isReviewInBundle(reviewId);
    let bundleConfig = null;
    
    if (bundleInfo.inBundle && bundleInfo.bundleId) {
        bundleConfig = await (db as any).reviewBundle.findUnique({
            where: { id: bundleInfo.bundleId }
        });
        
        if (bundleConfig) {
            const bundleProductIds = bundleConfig.productIds.split(',');
            
            if (actionSource === 'bundle') {
                productsToUpdateMetafields.push(...bundleProductIds);
            }
        }
    }

    console.log(`Bundle Info:`, bundleInfo);
    console.log(`Products to update:`, productsToUpdateMetafields);

    if (actionSource === 'bundle' && bundleConfig) {
        console.log(`Bundle Tab Action: ${status} for ALL bundle products`);
        
        if (status === 'approved') {
            const isFirstTimeApproval = await isFirstApproval(reviewId);
            
            if (isFirstTimeApproval) {
                const syndicationResult = await syndicateReviewToBundle(reviewId, bundleConfig.id);
                console.log(`First approval - Syndicated to ${syndicationResult.syndicatedCount} products`);
            } else {
                const statusUpdateResult = await updateSyndicatedReviewsStatus(reviewId, 'approved');
                console.log(`Subsequent approval - Updated ${statusUpdateResult.updatedCount} existing copies`);
            }
            
            await db.productReview.update({
                where: { id: reviewId },
                data: { status: 'approved' }
            });
        } 
        else if (status === 'rejected') {
            console.log(`Bundle Tab: Rejecting review ${reviewId} from ALL bundle products`);
            
            await db.productReview.update({
                where: { id: reviewId },
                data: { status: 'rejected' }
            });
            
            const originalReviewId = bundleInfo.isSyndicated ? await findOriginalReviewId(reviewId) : reviewId;
            if (originalReviewId) {
                const statusUpdateResult = await updateSyndicatedReviewsStatus(originalReviewId, 'rejected');
                console.log(` Rejected ${statusUpdateResult.updatedCount} syndicated copies`);
            } else {
                console.log(`Could not find original review for syndicated copy ${reviewId}`);
            }
        } 
        else if (status === 'pending') {
            await db.productReview.update({
                where: { id: reviewId },
                data: { status: 'pending' }
            });
            
            const originalReviewId = bundleInfo.isSyndicated ? await findOriginalReviewId(reviewId) : reviewId;
            if (originalReviewId) {
                const statusUpdateResult = await updateSyndicatedReviewsStatus(originalReviewId, 'pending');
                console.log(`Pending - Updated ${statusUpdateResult.updatedCount} copies to pending`);
            }
        }
    } 
    else if (actionSource === 'individual') {
        console.log(` Product Tab Action: ${status} affects ONLY product ${productNumericId}`);
        
        await db.productReview.update({
            where: { id: reviewId },
            data: { status: status }
        });
        
        if (bundleInfo.isSyndicated) {
            console.log(` Updated syndicated copy status to ${status}`);
        } else {
            console.log(` Original review - ${status} only for product ${productNumericId}`);
            
            productsToUpdateMetafields = [productNumericId];
        }
    }
    else {
        console.log(`⚡ Default action: Updating review ${reviewId} to ${status}`);
        await db.productReview.update({
            where: { id: reviewId },
            data: { status: status }
        });
    }

    const uniqueProductsToUpdate = Array.from(new Set(productsToUpdateMetafields)).filter(id => id && id !== 'undefined');
    
    console.log(` Updating metafields for ${uniqueProductsToUpdate.length} products:`, uniqueProductsToUpdate);
    
    for (const productId of uniqueProductsToUpdate) {
        await calculateAndUpdateProductMetafields(db, productId, admin);
    }
    
    return json({ success: true, message: `Review status updated to ${status}.` });

  } catch (error) {
    console.error(` Failed to update review status for ID ${reviewId}:`, error);
    return json({ error: "Failed to update review status." }, { status: 500 });
  }
}

async function findOriginalReviewId(syndicatedReviewId: string): Promise<string | null> {
  try {
    const syndicationEntry = await (db as any).reviewSyndication.findFirst({
      where: {
        syndicatedReviewId: syndicatedReviewId
      },
      select: { originalReviewId: true }
    });
    
    return syndicationEntry ? syndicationEntry.originalReviewId : null;
  } catch (error) {
    console.error("Error finding original review:", error);
    return null;
  }
}

export async function loader() {
  throw redirect("/app"); 
}
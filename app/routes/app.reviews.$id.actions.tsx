import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { 
  removeSyndicatedReviews, 
  removeSyndicatedReviewForProduct, 
  isReviewInBundle,
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
  
  if (!reviewId) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent"); 
  const actionSource = formData.get("actionSource") as string;

  try {
    const currentReview = await db.productReview.findUnique({
      where: { id: reviewId },
      select: { productId: true, isBundleReview: true, bundleContext: true, status: true },
    });

    if (!currentReview) {
      return json({ error: "Review not found" }, { status: 404 });
    }

    let productNumericId = getNumericProductId(currentReview.productId);
    let productsToUpdateMetafields: string[] = [productNumericId];
    
    const bundleInfo = await isReviewInBundle(reviewId);
    
    if (bundleInfo.inBundle && bundleInfo.bundleId) {
      const bundleConfig = await (db as any).reviewBundle.findUnique({
        where: { id: bundleInfo.bundleId }
      });
      
      if (bundleConfig) {
        const bundleProductIds = bundleConfig.productIds.split(',');
        productsToUpdateMetafields.push(...bundleProductIds);
      }
    }
    
    switch (intent) {
      case "delete":
        return await handleDeleteReview(reviewId, productsToUpdateMetafields, admin, currentReview, bundleInfo, actionSource);
      
      case "edit":
        return await handleEditReview(reviewId, formData, productsToUpdateMetafields, admin, actionSource, currentReview, bundleInfo);
      
      default:
        return json({ error: "Invalid intent" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing action:", error);
    return json({ 
      error: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

async function handleDeleteReview(reviewId: string, productsToUpdate: string[], admin: any, currentReview: any, bundleInfo: any, actionSource: string) {
  let productsToRecalculate: string[] = [...productsToUpdate];


  if (bundleInfo.inBundle) {
    if (actionSource === 'bundle') {
     
      
      const originalId = bundleInfo.isSyndicated 
        ? await findOriginalReviewId(reviewId) 
        : reviewId;
      
      if (originalId) {
        const removalResult = await removeSyndicatedReviews(originalId);
        console.log(` Bundle Tab: Removed ${removalResult.syndicatedCount} syndicated copies for original ${originalId}`);
        reviewId = originalId; 
      }
    } else if (actionSource === 'individual') {
      if (bundleInfo.isSyndicated) {
    
        const originalId = await findOriginalReviewId(reviewId);
        if (originalId) {
          await removeSyndicatedReviewForProduct(originalId, getNumericProductId(currentReview.productId));
          console.log(`Individual Tab: Removed syndication link for product ${getNumericProductId(currentReview.productId)}`);
        }
      } else {
     
        const removalResult = await removeSyndicatedReviews(reviewId);
        console.log(`Individual Tab: Also removed ${removalResult.syndicatedCount} syndicated copies as the original was deleted.`);
      }
    }
  }


  await db.productReview.delete({ where: { id: reviewId } });
  console.log(`Deleted productReview record ${reviewId}`);
  
 
  const uniqueProductsToUpdate = Array.from(new Set(productsToRecalculate)).filter(id => id && id !== 'undefined');
  
  console.log(`Updating metafields for ${uniqueProductsToUpdate.length} products after deletion`);
  
  for (const id of uniqueProductsToUpdate) {
      await calculateAndUpdateProductMetafields(db, id, admin);
  }

  return json({ 
    success: true, 
    message: "Review deleted successfully"
  });
}

async function handleEditReview(reviewId: string, formData: FormData, productsToUpdate: string[], admin: any, actionSource: string, currentReview: any, bundleInfo: any) {
  const title = formData.get("title")?.toString();
  const content = formData.get("content")?.toString();
  const rating = formData.get("rating")?.toString();
  const author = formData.get("author")?.toString();
  const email = formData.get("email")?.toString();
  const status = formData.get("status")?.toString();
  const imagesToRemove = formData.getAll("imagesToRemove[]") as string[];

  if (!title || !content || !rating || !author) {
    return json({ error: "All required fields must be filled out" }, { status: 400 });
  }

  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return json({ error: "Rating must be a number between 1 and 5" }, { status: 400 });
  }

  try {

    if (imagesToRemove.length > 0) {
      await db.reviewImage.deleteMany({ 
        where: { 
          id: { in: imagesToRemove }, 
          reviewId: reviewId 
        } 
      });
    }


    const updatedReview = await db.productReview.update({
      where: { id: reviewId },
      data: {
        title, content, rating: parsedRating, author, email: email || null,
        status: status || "pending",
      },
      include: { images: { select: { id: true, url: true, altText: true, order: true } } }
    });
    

    if (bundleInfo.inBundle) {
      if (actionSource === 'bundle' && !bundleInfo.isSyndicated) {
        
        console.log(`Bundle Tab: Propagating edits to syndicated copies for review ${reviewId}`);
        
       
        const syndicatedCopies = await (db as any).reviewSyndication.findMany({
            where: { originalReviewId: reviewId },
            select: { syndicatedReviewId: true }
        });
        
        const copyIds = syndicatedCopies.map(c => c.syndicatedReviewId);
        
        if (copyIds.length > 0) {
            await db.productReview.updateMany({
                where: { id: { in: copyIds } },
                data: {
                    title, 
                    content, 
                    rating: parsedRating, 
                    author, 
                    email: email || null,
                    status: status || "pending",
                }
            });
            console.log(`Propagated all fields to ${copyIds.length} syndicated copies.`);
        }
      } else {
     
        console.log(`Only updated product ${getNumericProductId(currentReview.productId)}`);
      }
    }

  
    const uniqueProductsToUpdate = Array.from(new Set(productsToUpdate)).filter(id => id && id !== 'undefined');
    
    console.log(`Updating metafields for ${uniqueProductsToUpdate.length} products after edit`);
    
    for (const id of uniqueProductsToUpdate) {
        await calculateAndUpdateProductMetafields(db, id, admin);
    }

    return json({ success: true, message: "Review updated successfully", review: updatedReview });

  } catch (error) {
    console.error("Error in edit transaction:", error);
    return json({ error: `Failed to update review: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
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
  return redirect("/app"); 
}
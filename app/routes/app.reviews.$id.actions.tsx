import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import {
  removeSyndicatedReviews,
  removeSyndicatedReviewForProduct,
  isReviewInBundle,
} from "../utils/reviewSyndication.server";

import { getNumericProductId } from "../utils/shopify.helpers";
import { calculateAndUpdateProductMetafields } from "../utils/metafields.server";


export async function action({ request, params }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const reviewId = params.id;

  if (!reviewId) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  const actionSource = formData.get("actionSource") as string;

  try {
    const currentReview = await db.productReview.findFirst({
      where: { id: reviewId, shop },
      select: { productId: true, isBundleReview: true, bundleContext: true, status: true },
    });

    if (!currentReview) {
      return json({ error: "Review not found" }, { status: 404 });
    }

    let productNumericId = getNumericProductId(currentReview.productId);
    let productsToUpdateMetafields: string[] = [productNumericId];

    const bundleInfo = await isReviewInBundle(reviewId, shop);

    if (bundleInfo.inBundle && bundleInfo.bundleId) {
      const bundleConfig = await (db as any).reviewBundle.findUnique({
        where: { id: bundleInfo.bundleId, shop }
      });

      if (bundleConfig) {
        const bundleProductIds = bundleConfig.productIds.split(',');
        productsToUpdateMetafields.push(...bundleProductIds);
      }
    }

    switch (intent) {
      case "delete":
        return await handleDeleteReview(reviewId, productsToUpdateMetafields, admin, shop, currentReview, bundleInfo, actionSource);

      case "edit":
        return await handleEditReview(reviewId, formData, productsToUpdateMetafields, admin, shop, actionSource, currentReview, bundleInfo);

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

async function handleDeleteReview(
  reviewId: string,
  productsToUpdate: string[],
  admin: any,
  shop: string,
  currentReview: { productId: string; isBundleReview: boolean; bundleContext: string | null; status: string },
  bundleInfo: { inBundle: boolean; bundleId?: string; isSyndicated?: boolean },
  actionSource: string
) {
  let productsToRecalculate: string[] = [...productsToUpdate];


  if (bundleInfo.inBundle) {
    if (actionSource === 'bundle') {
      const originalId = bundleInfo.isSyndicated
        ? await findOriginalReviewId(reviewId)
        : reviewId;

      if (originalId) {
        await removeSyndicatedReviews(originalId);
        reviewId = originalId;
      }
    } else if (actionSource === 'individual') {
      if (bundleInfo.isSyndicated) {
        const originalId = await findOriginalReviewId(reviewId);
        if (originalId) {
          await removeSyndicatedReviewForProduct(originalId, getNumericProductId(currentReview.productId));
        }
      } else {
        await removeSyndicatedReviews(reviewId);
      }
    }
  }


  await db.productReview.delete({ where: { id: reviewId } });

  const uniqueProductsToUpdate = Array.from(new Set(productsToRecalculate)).filter(id => id && id !== 'undefined');

  for (const id of uniqueProductsToUpdate) {
    await calculateAndUpdateProductMetafields(id, admin, shop);
  }

  return json({
    success: true,
    message: "Review deleted successfully"
  });
}

async function handleEditReview(
  reviewId: string,
  formData: FormData,
  productsToUpdate: string[],
  admin: any,
  shop: string,
  actionSource: string,
  currentReview: { productId: string; isBundleReview: boolean; bundleContext: string | null; status: string },
  bundleInfo: { inBundle: boolean; bundleId?: string; isSyndicated?: boolean }
) {
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
        title, content, rating: parsedRating, author, email: email || undefined,
        status: (status || "pending") as 'pending' | 'approved' | 'rejected',
      },
      include: { images: { select: { id: true, url: true, altText: true, order: true } } }
    });


    if (bundleInfo.inBundle) {
      if (actionSource === 'bundle' && !bundleInfo.isSyndicated) {
        const syndicatedCopies = await (db as any).reviewSyndication.findMany({
          where: { originalReviewId: reviewId },
          select: { syndicatedReviewId: true }
        });

        const copyIds = syndicatedCopies.map((c: any) => c.syndicatedReviewId);

        if (copyIds.length > 0) {
          await db.productReview.updateMany({
            where: { id: { in: copyIds } },
            data: {
              title,
              content,
              rating: parsedRating,
              author,
              email: email || undefined,
              status: (status || "pending") as 'pending' | 'approved' | 'rejected',
            }
          });
        }
      }
    }


    const uniqueProductsToUpdate = Array.from(new Set(productsToUpdate)).filter(id => id && id !== 'undefined');

    for (const id of uniqueProductsToUpdate) {
      await calculateAndUpdateProductMetafields(id, admin, shop);
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
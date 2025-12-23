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

import { getNumericProductId } from "../utils/shopify.helpers";
import { calculateAndUpdateProductMetafields } from "../utils/metafields.server";


export async function action({ request, params }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const reviewId = params.id;
  const formData = await request.formData();
  const status = formData.get("status");
  const actionSource = formData.get("actionSource") as string;

  if (!reviewId || typeof status !== "string" || !["pending", "approved", "rejected"].includes(status)) {
    return json({ error: "Invalid request data." }, { status: 400 });
  }

  try {
    const currentReview = await db.productReview.findFirst({
      where: { id: reviewId, shop },
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

    const bundleInfo = await isReviewInBundle(reviewId, shop);
    let bundleConfig = null;

    if (bundleInfo.inBundle && bundleInfo.bundleId) {
      bundleConfig = await (db as any).reviewBundle.findUnique({
        where: { id: bundleInfo.bundleId, shop }
      });

      if (bundleConfig) {
        const bundleProductIds = bundleConfig.productIds.split(',');

        if (actionSource === 'bundle') {
          productsToUpdateMetafields.push(...bundleProductIds);
        }
      }
    }

    if (actionSource === 'bundle' && bundleConfig) {
      if (status === 'approved') {
        const isFirstTimeApproval = await isFirstApproval(reviewId);

        if (isFirstTimeApproval) {
          await syndicateReviewToBundle(reviewId, bundleConfig.id, shop);
        } else {
          await updateSyndicatedReviewsStatus(reviewId, 'approved');
        }

        await db.productReview.update({
          where: { id: reviewId },
          data: { status: 'approved' }
        });
      }
      else if (status === 'rejected') {
        await db.productReview.update({
          where: { id: reviewId },
          data: { status: 'rejected' }
        });

        const originalReviewId = bundleInfo.isSyndicated ? await findOriginalReviewId(reviewId) : reviewId;
        if (originalReviewId) {
          await updateSyndicatedReviewsStatus(originalReviewId, 'rejected');
        }
      }
      else if (status === 'pending') {
        await db.productReview.update({
          where: { id: reviewId },
          data: { status: 'pending' }
        });

        const originalReviewId = bundleInfo.isSyndicated ? await findOriginalReviewId(reviewId) : reviewId;
        if (originalReviewId) {
          await updateSyndicatedReviewsStatus(originalReviewId, 'pending');
        }
      }
    }
    else if (actionSource === 'individual') {
      await db.productReview.update({
        where: { id: reviewId },
        data: { status: status as 'pending' | 'approved' | 'rejected' }
      });

      if (!bundleInfo.isSyndicated) {
        productsToUpdateMetafields = [productNumericId];
      }
    }
    else {
      await db.productReview.update({
        where: { id: reviewId },
        data: { status: status }
      });
    }

    const uniqueProductsToUpdate = Array.from(new Set(productsToUpdateMetafields)).filter(id => id && id !== 'undefined');

    for (const productId of uniqueProductsToUpdate) {
      await calculateAndUpdateProductMetafields(productId, admin, shop);
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
import db from "../db.server";
import { getNumericProductId } from "./shopify.helpers";

export async function isReviewInBundle(reviewId: string, shop: string): Promise<{ inBundle: boolean; bundleId?: string; isSyndicated?: boolean }> {
  try {
    const originalReview = await (db.productReview as any).findFirst({
      where: { id: reviewId, shop },
      select: { productId: true, isBundleReview: true }
    });

    if (!originalReview) {
      return { inBundle: false };
    }

    const productNumericId = getNumericProductId(originalReview.productId);

    const bundleConfig = await (db as any).reviewBundle.findFirst({
      where: {
        shop,
        productIds: { contains: productNumericId }
      }
    });

    if (bundleConfig) {
      return {
        inBundle: true,
        bundleId: bundleConfig.id,
        isSyndicated: originalReview.isBundleReview
      };
    }

    return { inBundle: false };
  } catch (error) {
    return { inBundle: false };
  }
}

export async function isFirstApproval(reviewId: string): Promise<boolean> {
  try {
    const existingSyndications = await (db as any).reviewSyndication.count({
      where: { originalReviewId: reviewId }
    });

    return existingSyndications === 0;
  } catch (error) {
    return true;
  }
}

export async function removeSyndicatedReviewForProduct(originalReviewId: string, targetProductId: string) {
  try {
    const syndicationEntry = await (db as any).reviewSyndication.findFirst({
      where: {
        originalReviewId: originalReviewId,
        productId: targetProductId
      }
    });

    if (syndicationEntry) {
      await db.productReview.deleteMany({
        where: {
          id: syndicationEntry.syndicatedReviewId
        }
      });

      await db.bundleReview.deleteMany({
        where: {
          reviewId: originalReviewId,
          productId: targetProductId
        }
      });

      await (db as any).reviewSyndication.delete({
        where: { id: syndicationEntry.id }
      });

      return { success: true, removedCount: 1 };
    } else {
      return { success: true, removedCount: 0 };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syndicateReviewToBundle(reviewId: string, bundleId: string, shop: string) {
  try {
    const bundle = await (db as any).reviewBundle.findFirst({
      where: { id: bundleId, shop }
    });

    if (!bundle) {
      return { success: false, error: "Bundle not found" };
    }

    const originalReview = await (db.productReview as any).findFirst({
      where: { id: reviewId, shop },
      include: { images: true }
    }) as any;

    if (!originalReview) {
      return { success: false, error: "Original review not found" };
    }

    const bundleProductIds = bundle.productIds.split(',');
    const originalProductNumericId = getNumericProductId(originalReview.productId);
    let syndicatedCount = 0;

    for (const targetProductId of bundleProductIds) {
      if (targetProductId === originalProductNumericId) {
        continue;
      }

      const existingSyndication = await (db as any).reviewSyndication.findFirst({
        where: {
          originalReviewId: reviewId,
          productId: targetProductId
        }
      });

      if (existingSyndication) {
        await db.productReview.update({
          where: { id: existingSyndication.syndicatedReviewId },
          data: {
            rating: originalReview.rating,
            author: originalReview.author,
            email: originalReview.email,
            title: originalReview.title,
            content: originalReview.content,
            status: 'approved',
            images: {
              deleteMany: {},
              create: originalReview.images.map((img: any) => ({
                url: img.url,
                altText: img.altText,
                order: img.order,
              }))
            }
          }
        });

        syndicatedCount++;
        continue;
      }

      const syndicatedReview = await (db.productReview as any).create({
        data: {
          shop,
          productId: targetProductId,
          rating: originalReview.rating,
          author: originalReview.author,
          email: originalReview.email,
          title: originalReview.title,
          content: originalReview.content,
          status: 'approved',
          isBundleReview: true,
          bundleContext: `Syndicated from ${bundle.name} (Original: ${reviewId})`,
          images: {
            create: originalReview.images.map((img: any) => ({
              url: img.url,
              altText: img.altText,
              order: img.order,
            }))
          }
        }
      });

      await db.bundleReview.create({
        data: {
          bundleProductId: bundle.bundleProductId,
          reviewId: reviewId,
          productId: targetProductId
        }
      });

      await (db as any).reviewSyndication.create({
        data: {
          originalReviewId: reviewId,
          syndicatedReviewId: syndicatedReview.id,
          bundleId: bundleId,
          productId: targetProductId
        }
      });

      syndicatedCount++;
    }

    return { success: true, syndicatedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeSyndicatedReviews(originalReviewId: string) {
  try {
    const syndicationEntries = await (db as any).reviewSyndication.findMany({
      where: { originalReviewId: originalReviewId }
    });

    let deletedCount = 0;

    for (const entry of syndicationEntries) {
      try {
        await db.productReview.deleteMany({
          where: {
            id: entry.syndicatedReviewId
          }
        });

        await db.bundleReview.deleteMany({
          where: {
            reviewId: originalReviewId,
            productId: entry.productId
          }
        });

        await (db as any).reviewSyndication.delete({
          where: { id: entry.id }
        });

        deletedCount++;
      } catch (entryError: any) {
        // Continue processing other entries
      }
    }

    return { success: true, syndicatedCount: deletedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSyndicatedReviewsStatus(originalReviewId: string, status: string) {
  try {
    const syndicationEntries = await (db as any).reviewSyndication.findMany({
      where: { originalReviewId: originalReviewId }
    });

    let updatedCount = 0;

    for (const entry of syndicationEntries) {
      try {
        await db.productReview.update({
          where: { id: entry.syndicatedReviewId },
          data: { status: status }
        });

        updatedCount++;
      } catch (entryError: any) {
        // Continue processing other entries
      }
    }

    return { success: true, updatedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
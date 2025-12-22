import db from "../db.server";

function getNumericProductId(gid: string): string {
    const parts = gid.split('/');
    return parts[parts.length - 1];
}

export async function isReviewInBundle(reviewId: string): Promise<{ inBundle: boolean; bundleId?: string; isSyndicated?: boolean }> {
  try {
    const originalReview = await db.productReview.findUnique({
      where: { id: reviewId },
      select: { productId: true, isBundleReview: true }
    });

    if (!originalReview) {
      return { inBundle: false };
    }

    const productNumericId = getNumericProductId(originalReview.productId);
    
    const bundleConfig = await (db as any).reviewBundle.findFirst({
      where: { productIds: { contains: productNumericId } }
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
    console.error("Error checking if review is in bundle:", error);
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
    console.error("Error checking first approval:", error);
    return true;
  }
}

export async function removeSyndicatedReviewForProduct(originalReviewId: string, targetProductId: string) {
  try {
    console.log(`🗑️ Removing syndicated copy for review ${originalReviewId} from product ${targetProductId}`);
    
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
      
      console.log(`✅ Removed syndicated copy from product ${targetProductId}`);
      return { success: true, removedCount: 1 };
    } else {
      console.log(`ℹ️ No syndicated copy found for product ${targetProductId}`);
      return { success: true, removedCount: 0 };
    }
  } catch (error: any) {
    console.error("❌ Error removing syndicated review for product:", error);
    return { success: false, error: error.message };
  }
}

export async function syndicateReviewToBundle(reviewId: string, bundleId: string) {
  try {
    console.log(`🔄 STARTING SYNDICATION for review ${reviewId} in bundle ${bundleId}`);
    
    const bundle = await (db as any).reviewBundle.findUnique({
      where: { id: bundleId }
    });

    if (!bundle) {
      console.log(`❌ Bundle ${bundleId} not found`);
      return { success: false, error: "Bundle not found" };
    }

    console.log(`📦 Bundle found: ${bundle.name}, products: ${bundle.productIds}`);

    const originalReview = await db.productReview.findUnique({
      where: { id: reviewId },
      include: { images: true }
    });

    if (!originalReview) {
      console.log(`❌ Original review ${reviewId} not found`);
      return { success: false, error: "Original review not found" };
    }

    console.log(`📝 Original review: ${originalReview.title}, product: ${originalReview.productId}`);
    
    const bundleProductIds = bundle.productIds.split(',');
    const originalProductNumericId = getNumericProductId(originalReview.productId);
    let syndicatedCount = 0;

    console.log(`🎯 Processing ${bundleProductIds.length} bundle products`);

    for (const targetProductId of bundleProductIds) {
      console.log(`🔍 Processing product ${targetProductId}`);
      
      if (targetProductId === originalProductNumericId) {
        console.log(`⏭️ Skipping original product ${targetProductId}`);
        continue;
      }

      const existingSyndication = await (db as any).reviewSyndication.findFirst({
        where: {
          originalReviewId: reviewId,
          productId: targetProductId
        }
      });

      if (existingSyndication) {
        console.log(`🔄 Updating existing syndicated copy for product ${targetProductId}`);
        
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
              create: originalReview.images.map(img => ({
                url: img.url,
                altText: img.altText,
                order: img.order,
              }))
            }
          }
        });
        
        console.log(`✅ Updated existing syndicated review: ${existingSyndication.syndicatedReviewId}`);
        syndicatedCount++;
        continue;
      }

      console.log(`➕ Creating new syndication for product ${targetProductId}`);

      const syndicatedReview = await db.productReview.create({
        data: {
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
            create: originalReview.images.map(img => ({
              url: img.url,
              altText: img.altText,
              order: img.order,
            }))
          }
        }
      });

      console.log(`✅ Created ProductReview: ${syndicatedReview.id}`);

      const bundleReview = await db.bundleReview.create({
        data: {
          bundleProductId: bundle.bundleProductId,
          reviewId: reviewId,
          productId: targetProductId
        }
      });

      console.log(`✅ Created BundleReview: ${bundleReview.id}`);

      const syndicationEntry = await (db as any).reviewSyndication.create({
        data: {
          originalReviewId: reviewId,
          syndicatedReviewId: syndicatedReview.id,
          bundleId: bundleId,
          productId: targetProductId
        }
      });

      console.log(`✅ Created ReviewSyndication: ${syndicationEntry.id}`);

      syndicatedCount++;
      console.log(`🎉 Completed syndication for product ${targetProductId}`);
    }

    console.log(`🏁 Syndication finished: ${syndicatedCount} copies created/updated`);
    return { success: true, syndicatedCount };
  } catch (error: any) {
    console.error("❌ SYNDICATION ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function removeSyndicatedReviews(originalReviewId: string) {
  try {
    console.log(`🗑️ STARTING REMOVAL for original review ${originalReviewId}`);
    
    const syndicationEntries = await (db as any).reviewSyndication.findMany({
      where: { originalReviewId: originalReviewId }
    });

    console.log(`📋 Found ${syndicationEntries.length} syndication entries for review ${originalReviewId}`);

    let deletedCount = 0;

    for (const entry of syndicationEntries) {
      console.log(`🗑️ Processing entry ${entry.id} for product ${entry.productId}`);
      
      try {
        const deleteReviewResult = await db.productReview.deleteMany({
          where: { 
            id: entry.syndicatedReviewId
          }
        });
        
        console.log(`✅ Deleted ${deleteReviewResult.count} ProductReview(s)`);

        const deleteBundleResult = await db.bundleReview.deleteMany({
          where: {
            reviewId: originalReviewId,
            productId: entry.productId
          }
        });
        
        console.log(`✅ Deleted ${deleteBundleResult.count} BundleReview(s)`);

        await (db as any).reviewSyndication.delete({
          where: { id: entry.id }
        });
        
        console.log(`✅ Deleted ReviewSyndication ${entry.id}`);

        deletedCount++;
      } catch (entryError: any) {
        console.error(`❌ Error deleting entry ${entry.id}:`, entryError.message);
      }
    }

    console.log(`🏁 Removal completed: ${deletedCount} syndicated reviews removed`);
    return { success: true, syndicatedCount: deletedCount };
  } catch (error: any) {
    console.error("❌ REMOVAL ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSyndicatedReviewsStatus(originalReviewId: string, status: string) {
  try {
    console.log(`🔄 Updating syndicated reviews status for ORIGINAL ${originalReviewId} to ${status}`);
    
    const syndicationEntries = await (db as any).reviewSyndication.findMany({
      where: { originalReviewId: originalReviewId }
    });

    console.log(`📋 Found ${syndicationEntries.length} syndication entries to update`);

    let updatedCount = 0;

    for (const entry of syndicationEntries) {
      try {
        await db.productReview.update({
          where: { id: entry.syndicatedReviewId },
          data: { status: status }
        });
        
        console.log(`✅ Updated syndicated copy ${entry.syndicatedReviewId} to ${status}`);
        updatedCount++;
      } catch (entryError: any) {
        console.error(`❌ Error updating entry ${entry.id}:`, entryError.message);
      }
    }

    console.log(`🏁 Status update completed: ${updatedCount} syndicated reviews updated`);
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error("❌ STATUS UPDATE ERROR:", error);
    return { success: false, error: error.message };
  }
}
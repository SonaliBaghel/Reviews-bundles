// app/utils/updateMetafields.ts
import db from "../db.server";
import shopify from "../shopify.server";

export async function updateAllProductMetafields(shopDomain: string) {
  const { admin } = await shopify.unauthenticated.admin(shopDomain);
  
  // Get all products with reviews
  const productsWithReviews = await db.productReview.groupBy({
    by: ['productId'],
  });

  for (const product of productsWithReviews) {
    const productNumericId = getNumericProductId(product.productId);
    await calculateAndUpdateProductMetafields(db, productNumericId, admin);
  }
}
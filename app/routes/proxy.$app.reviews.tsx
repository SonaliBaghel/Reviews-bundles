import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("product_id");

    if (!productId) {
      return json([], {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60",
        }
      });
    }

    let numericProductId = productId;
    if (productId.startsWith('gid://shopify/Product/')) {
      numericProductId = productId.split('/').pop() || productId;
    }

    // --- 1. Fetch Direct Approved Reviews (Only originals) ---
    const directReviews = await db.productReview.findMany({
      where: {
        status: 'approved',
        productId: numericProductId,
        isBundleReview: false,
      },
      include: {
        images: true,
      },
    });

    // --- 2. Fetch Syndicated Approved Reviews ---
    const syndicatedBundleReviews = await db.bundleReview.findMany({
      where: {
        productId: numericProductId,
        review: {
          status: 'approved',
        }
      },
      include: {
        review: {
          include: {
            images: true,
          }
        }
      }
    });

    // --- 3. Consolidate and Deduplicate Reviews ---
    const uniqueReviewsMap = new Map();

    directReviews.forEach(review => {
      uniqueReviewsMap.set(`direct-${review.id}`, {
        ...review,
        isSyndicated: false
      });
    });

    syndicatedBundleReviews.forEach(bundleEntry => {
      const uniqueKey = `syndicated-${bundleEntry.bundleProductId}-${bundleEntry.reviewId}`;

      if (!uniqueReviewsMap.has(uniqueKey)) {
        const syndicatedReview = bundleEntry.review;
        const syndicatedReviewForOutput = {
          ...syndicatedReview,
          productId: numericProductId,
          isSyndicated: true,
        };

        uniqueReviewsMap.set(uniqueKey, syndicatedReviewForOutput);
      }
    });

    const allApprovedReviews = Array.from(uniqueReviewsMap.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // --- 4. Final Serialization ---
    const serializableReviews = allApprovedReviews.map((review: any) => ({
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      author: review.author,
      email: review.email,
      title: review.title,
      content: review.content,
      status: review.status,
      isSyndicated: review.isSyndicated || false,
      bundleContext: review.bundleContext || null,
      imageUrl: review.images.length > 0 ? review.images[0].url : null,
      images: review.images.map((image: any) => ({
        id: image.id,
        url: image.url,
        altText: image.altText,
        order: image.order,
        createdAt: (image.createdAt instanceof Date ? image.createdAt.toISOString() : image.createdAt),
        updatedAt: (image.updatedAt instanceof Date ? image.updatedAt.toISOString() : image.updatedAt),
      })),
      createdAt: (review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt),
      updatedAt: (review.updatedAt instanceof Date ? review.updatedAt.toISOString() : review.updatedAt),
    }));

    return json(serializableReviews, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {
    return json([], {
      status: 500,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
}
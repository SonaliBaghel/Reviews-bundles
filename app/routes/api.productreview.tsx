import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";
import shopify from "../shopify.server";

interface FileCreateResponse {
  data?: {
    stagedUploadsCreate?: {
      stagedTargets: Array<{
        url: string;
        resourceUrl: string;
        parameters: Array<{
          name: string;
          value: string;
        }>;
      }>;
      userErrors: Array<{ field: string[]; message: string }>;
    };
    fileCreate?: {
      files: Array<{
        fileStatus: string;
        image?: { originalSrc: string; url: string };
        id?: string;
      }>;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  };
  errors?: Array<{ message: string }>;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadImageToShopify(base64ImageData: string, shopDomain: string): Promise<string | null> {
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 2000;

  try {
    const { admin } = await shopify.unauthenticated.admin(shopDomain);
    
    const matches = base64ImageData.match(/^data:(image\/(png|jpe?g|gif));base64,(.+)$/i);
    if (!matches) {
      console.log("Invalid base64 image format");
      return null;
    }

    const contentType = matches[1];
    const fileExtension = matches[2];
    const imageData = matches[3];
    const imageBuffer = Buffer.from(imageData, 'base64');

    if (imageBuffer.length > 20 * 1024 * 1024) {
      console.log("Image too large:", imageBuffer.length);
      return null;
    }

    console.log("Starting Shopify image upload...");
    const stagedResponse = await admin.graphql(
      `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: [{
            resource: "FILE", 
            filename: `review-${Date.now()}.${fileExtension}`,
            mimeType: contentType,
            httpMethod: "POST"
          }]
        }
      }
    );

    const stagedResult: FileCreateResponse = await stagedResponse.json();
    
    if (stagedResult.errors?.length || stagedResult.data?.stagedUploadsCreate?.userErrors?.length) {
      console.log("Staged upload errors:", stagedResult.errors || stagedResult.data?.stagedUploadsCreate?.userErrors);
      return null;
    }

    const target = stagedResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!target) {
      console.log("No target returned from staged upload");
      return null;
    }

    const formData = new FormData();
    target.parameters.forEach(({ name, value }) => {
      formData.append(name, value);
    });
    formData.append('file', new Blob([imageBuffer], { type: contentType }), `review-${Date.now()}.${fileExtension}`);

    console.log("Uploading to Shopify CDN...");
    const uploadResponse = await fetch(target.url, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      console.log("CDN upload failed:", uploadResponse.status);
      return null;
    }

    console.log("Creating file in Shopify...");
    const fileCreateResponse = await admin.graphql(
      `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            fileStatus
            id
            ... on MediaImage {
              image {
                originalSrc
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          files: [{
            alt: "Product review image",
            contentType: "IMAGE", 
            originalSource: target.resourceUrl 
          }]
        }
      }
    );

    const fileCreateResult: FileCreateResponse = await fileCreateResponse.json();

    if (fileCreateResult.errors?.length || fileCreateResult.data?.fileCreate?.userErrors?.length) {
      console.log("File create errors:", fileCreateResult.errors || fileCreateResult.data?.fileCreate?.userErrors);
      return null;
    }

    let file = fileCreateResult.data?.fileCreate?.files?.[0];
    if (!file || !file.id) {
      console.log("No file returned from file create");
      return null;
    }

    console.log("Waiting for file to be ready...");
    for (let i = 0; i < MAX_RETRIES; i++) {
      await sleep(RETRY_DELAY_MS);

      const fileStatusResponse = await admin.graphql(`
          #graphql
          query getFileStatus($id: ID!) {
              node(id: $id) {
                  ... on MediaImage {
                      id
                      fileStatus
                      image {
                          originalSrc
                          url
                      }
                  }
              }
          }
      `, {
          variables: { id: file.id }
      });

      const statusResult = await fileStatusResponse.json() as { data?: { node?: { fileStatus: string, image?: { originalSrc: string, url: string } } }, errors?: any[] };

      if (statusResult.errors?.length) {
        console.log("File status check errors:", statusResult.errors);
        break;
      }

      const updatedFile = statusResult.data?.node;
      if (updatedFile && updatedFile.fileStatus === 'READY' && updatedFile.image?.originalSrc) {
        console.log("Image uploaded successfully:", updatedFile.image.originalSrc);
        return updatedFile.image.originalSrc;
      } else if (updatedFile && (updatedFile.fileStatus === 'FAILED' || updatedFile.fileStatus === 'ERROR')) {
        console.log("File processing failed:", updatedFile.fileStatus);
        return null;
      }
    }

    console.log("File processing timeout");
    return null;

  } catch (error: any) {
    console.error("Image upload error:", error);
    return null;
  }
}

interface ProductReviewWithImages {
  id: string;
  productId: string;
  rating: number;
  author: string;
  email: string;
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  isBundleReview: boolean;
  images: {
    id: string;
    url: string;
    altText: string | null;
    order: number | null;
  }[];
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("=== STARTING REVIEW SUBMISSION ===");
  
  if (request.method !== "POST") {
    console.log("Method not allowed:", request.method);
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405 }
    );
  }

  try {
    const requestBody = await request.json();
    console.log("Request body received:", JSON.stringify({
      productId: requestBody.productId,
      rating: requestBody.rating,
      author: requestBody.author,
      email: requestBody.email,
      title: requestBody.title,
      contentLength: requestBody.content?.length,
      imagesCount: requestBody.images?.length || 0
    }, null, 2));

    let { productId, rating, author, content, email, title, images: base64Images } = requestBody; 

    if (!productId || !rating || !author || !content || !email) {
      console.log("Missing required fields:", {
        productId: !!productId,
        rating: !!rating,
        author: !!author,
        content: !!content,
        email: !!email
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields (productId, rating, author, content, email)" }),
        { status: 400 }
      );
    }

    if (typeof productId === 'string' && productId.startsWith('gid://shopify/Product/')) {
        productId = productId.split('/').pop() || '';
    }

    if (!/^\d+$/.test(productId)) {
      console.log("Invalid product ID format:", productId);
      return new Response(
          JSON.stringify({ error: "Invalid Product ID format. Must be a numeric string or Shopify GID." }),
          { status: 400 }
      );
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      console.log("Invalid rating:", rating);
      return new Response(
        JSON.stringify({ error: "Invalid rating value. Must be a number between 1 and 5." }),
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format." }),
        { status: 400 }
      );
    }

    console.log("All validations passed");

    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 200) {
      console.log("Content too long:", wordCount, "words");
      return new Response(
        JSON.stringify({ error: "Review content must be 200 words or less." }),
        { status: 400 }
      );
    }

    console.log("Content validation passed:", wordCount, "words");

    const shopDomain = new URL(request.url).searchParams.get("shop");
    const imagesToCreate: { url: string; altText?: string; order?: number }[] = []; 

    const MAX_IMAGES = 5;
    const imagesToProcess = Array.isArray(base64Images) ? base64Images.slice(0, MAX_IMAGES) : [];

    console.log("Processing images:", imagesToProcess.length);
    if (imagesToProcess.length > 0) {
      if (!shopDomain) {
        console.warn("Shop domain missing - skipping image uploads");
      } else {
        for (let i = 0; i < imagesToProcess.length; i++) {
          const base64Image = imagesToProcess[i];
          if (typeof base64Image === 'string') {
            console.log(`Uploading image ${i + 1}...`);
            const imageUrl = await uploadImageToShopify(base64Image, shopDomain);
            if (imageUrl) {
              imagesToCreate.push({ url: imageUrl, altText: `Review image ${i + 1}`, order: i }); 
              console.log(`Image ${i + 1} uploaded successfully`);
            } else {
              console.warn(`Failed to upload image ${i + 1}`);
            }
          }
        }
      }
    }

    console.log("Creating review in database...");
    const review = await prisma.productReview.create({
      data: {
        productId,
        rating: parsedRating,
        author,
        content,
        email: email,
        title: title || null,
        status: "pending",
        isBundleReview: false,
        images: {
            create: imagesToCreate, 
        },
      },
      include: {
        images: {
          select: { id: true, url: true, altText: true, order: true }
        }
      }
    });

    console.log("Review created successfully:", review.id);

    try {
      const url = new URL(request.url);
      const shopDomainForMetafield = url.searchParams.get("shop");

      if (!shopDomainForMetafield) {
        console.warn("Shop domain missing - skipping metafield update");
      } else {
        console.log("Updating Shopify metafields...");
        const { admin } = await shopify.unauthenticated.admin(shopDomainForMetafield);

        const directApprovedReviews = await prisma.productReview.findMany({
          where: {
            productId: productId,
            status: 'approved',
            isBundleReview: false,
          },
          select: { rating: true, id: true },
        });

        const syndicatedReviews = await prisma.bundleReview.findMany({
          where: {
            productId: productId,
            review: {
              status: 'approved',
            }
          },
          select: { 
            reviewId: true, 
            review: { select: { rating: true, id: true } },
            bundleProductId: true 
          }
        });

        const ratingMap = new Map<string, number>();
        
        directApprovedReviews.forEach(review => {
          ratingMap.set(`direct-${review.id}`, review.rating);
        });

        syndicatedReviews.forEach(bundleReview => {
          ratingMap.set(`syndicated-${bundleReview.bundleProductId}-${bundleReview.reviewId}`, 
                       bundleReview.review.rating);
        });

        const finalReviewCount = ratingMap.size;
        const totalRatingSum = Array.from(ratingMap.values()).reduce((sum, rating) => sum + rating, 0);
        const newApprovedAverageRating = finalReviewCount > 0 ? (totalRatingSum / finalReviewCount) : 0;

        const productGidForMetafield = `gid://shopify/Product/${productId}`;

        console.log("Calculated metafield values:", {
          averageRating: newApprovedAverageRating.toFixed(1),
          reviewCount: finalReviewCount
        });

        const httpResponse = await admin.graphql(`
          mutation UpdateProductMetafields($input: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $input) {
              metafields {
                id
                namespace
                key
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              input: [
                {
                  ownerId: productGidForMetafield,
                  namespace: "reviews",
                  key: "rating",
                  value: newApprovedAverageRating.toFixed(1),
                  type: "number_decimal"
                },
                {
                  ownerId: productGidForMetafield,
                  namespace: "reviews",
                  key: "count",
                  value: finalReviewCount.toString(),
                  type: "number_integer"
                }
              ]
            }
          }
        );

        const responseBody: any = await httpResponse.json();
        console.log("Metafield update response:", JSON.stringify(responseBody, null, 2));

        if (responseBody.errors?.length > 0) {
          console.error("GraphQL API errors:", responseBody.errors);
        }

        if (responseBody.data?.metafieldsSet?.userErrors?.length > 0) {
          console.error("Metafield update user errors:", responseBody.data.metafieldsSet.userErrors);
        } else {
          console.log("Metafields updated successfully");
        }
      }
    } catch (metafieldError: any) {
      console.error("Metafield update failed (non-critical):", metafieldError.message);
    }

    console.log("Review submission completed successfully");
    return new Response(
      JSON.stringify({
        success: true,
        review: {
          ...review,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString()
        },
        message: "Review submitted successfully"
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("=== CRITICAL ERROR IN REVIEW SUBMISSION ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    
    if (error.code) {
      console.error("Database error code:", error.code);
      console.error("Database error meta:", error.meta);
    }
    
    return new Response(
      JSON.stringify({
        error: "Failed to submit review. Please try again."
      }),
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    let productId = url.searchParams.get("productId");
    
    if (productId) {
        if (typeof productId === 'string' && productId.startsWith('gid://shopify/Product/')) {
            productId = productId.split('/').pop() || '';
        }

        if (!/^\d+$/.test(productId)) {
            return json({ error: "Invalid Product ID format" }, { status: 400 });
        }

        const directReviews = await prisma.productReview.findMany({
            where: { 
              productId, 
              status: "approved",
              isBundleReview: false
            },
            orderBy: { createdAt: "desc" },
            include: {
                images: {
                    select: { id: true, url: true, altText: true, order: true },
                    orderBy: { order: 'asc' }
                }
            }
        });

        const syndicatedReviews = await prisma.bundleReview.findMany({
            where: {
                productId: productId,
                review: {
                    status: "approved",
                }
            },
            include: {
                review: {
                    include: {
                        images: {
                            select: { id: true, url: true, altText: true, order: true },
                            orderBy: { order: 'asc' }
                        }
                    }
                }
            }
        });

        const uniqueReviewsMap = new Map();
        
        directReviews.forEach(review => {
            uniqueReviewsMap.set(`direct-${review.id}`, {
                ...review,
                isSyndicated: false
            });
        });

        syndicatedReviews.forEach(bundleEntry => {
            const uniqueKey = `syndicated-${bundleEntry.bundleProductId}-${bundleEntry.reviewId}`;
            
            if (!uniqueReviewsMap.has(uniqueKey)) {
                const syndicatedReview = bundleEntry.review;
                uniqueReviewsMap.set(uniqueKey, {
                    ...syndicatedReview,
                    productId: productId,
                    isSyndicated: true,
                });
            }
        });

        const allReviews = Array.from(uniqueReviewsMap.values());
        const serializableReviews = allReviews.map((review: any) => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
            images: review.images.map((image: any) => ({
                ...image,
            }))
        }));

        return json(serializableReviews, { status: 200 });

    } else {
        const directReviews = await prisma.productReview.findMany({
            where: { 
              status: "approved",
              isBundleReview: false
            },
            orderBy: { createdAt: "desc" },
            include: {
                images: {
                    select: { id: true, url: true, altText: true, order: true },
                    orderBy: { order: 'asc' }
                }
            }
        });

        let totalRating = 0;
        directReviews.forEach(review => {
            totalRating += review.rating;
        });
        const averageRating = directReviews.length > 0 ? (totalRating / directReviews.length) : 0;
        const totalReviews = directReviews.length;

        const serializableReviews = directReviews.map(review => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
            images: review.images.map(image => ({
                ...image,
            }))
        }));

        return json({
            reviews: serializableReviews,
            averageRating: averageRating.toFixed(1),
            totalReviews: totalReviews
        }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Loader error:", error);
    return json(
      { error: error.message || "Failed to load reviews" },
      { status: 500 }
    );
  }
}
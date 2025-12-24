import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";
import shopify from "../shopify.server";
import { appConfig } from "../config/app.config";
import { calculateAndUpdateProductMetafields } from "../utils/metafields.server";

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
  const { uploadRetries, retryDelayMs, maxSize } = appConfig.images;

  try {
    const { admin } = await shopify.unauthenticated.admin(shopDomain);

    const matches = base64ImageData.match(/^data:(image\/(png|jpe?g|gif));base64,(.+)$/i);
    if (!matches) {
      console.error("Image upload failed: Invalid base64 format");
      return null;
    }

    const contentType = matches[1];
    const fileExtension = matches[2];
    const imageData = matches[3];
    const imageBuffer = Buffer.from(imageData, 'base64');

    if (imageBuffer.length > maxSize) {
      console.error(`Image upload failed: File size ${imageBuffer.length} exceeds max size ${maxSize}`);
      return null;
    }

    const filename = `review-image-${Date.now()}.${fileExtension}`;

    // 1. Request staged upload targets
    const stagedUploadsResponse = await admin.graphql(`
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
      }
    `, {
      variables: {
        input: [{
          filename,
          mimeType: contentType,
          resource: 'FILE',
          fileSize: imageBuffer.length.toString(),
        }]
      }
    });

    const stagedUploadsResult = await stagedUploadsResponse.json() as FileCreateResponse;

    if (stagedUploadsResult.errors) {
      console.error("GraphQL errors in stagedUploadsCreate:", stagedUploadsResult.errors);
    }

    const target = stagedUploadsResult.data?.stagedUploadsCreate?.stagedTargets[0];

    if (!target) {
      console.error("Image upload failed: Could not create staged upload target", JSON.stringify(stagedUploadsResult.data?.stagedUploadsCreate?.userErrors));
      return null;
    }

    // 2. Upload the image buffer to the provided URL
    // Logic for GCS vs S3/Other:
    // If the URL has a query string (like X-Goog-Signature), it's a signed URL for PUT.
    // Otherwise, use POST with parameters in FormData.
    const isSignedUrl = target.url.includes('?');

    if (isSignedUrl) {
      const uploadResponse = await fetch(target.url, {
        method: 'PUT',
        body: imageBuffer,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`Image upload failed: Could not upload to staged target (PUT). Status: ${uploadResponse.status}, Error: ${errorText}`);
        return null;
      }
    } else {
      const formData = new FormData();

      target.parameters.forEach(({ name, value }) => {
        formData.append(name, value);
      });

      const blob = new Blob([imageBuffer], { type: contentType });
      formData.append('file', blob, filename);

      const uploadResponse = await fetch(target.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`Image upload failed: Could not upload to staged target (POST). Status: ${uploadResponse.status}, Error: ${errorText}`);
        return null;
      }
    }

    // 3. Create the file in Shopify
    const fileCreateResponse = await admin.graphql(`
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        files: [{
          alt: "Review Image",
          contentType: 'IMAGE',
          originalSource: target.resourceUrl,
        }]
      }
    });

    const fileCreateResult = await fileCreateResponse.json() as FileCreateResponse;
    const file = fileCreateResult.data?.fileCreate?.files[0];

    if (!file || !file.id) {
      console.error("Image upload failed: Could not create file in Shopify", JSON.stringify(fileCreateResult.data?.fileCreate?.userErrors));
      return null;
    }

    // 4. Poll for the file status
    for (let i = 0; i < uploadRetries; i++) {
      await sleep(retryDelayMs);

      const fileStatusResponse = await admin.graphql(`
        query getFileStatus($id: ID!) {
          node(id: $id) {
            ... on GenericFile {
              fileStatus
              url
            }
            ... on MediaImage {
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

      const statusResult = await fileStatusResponse.json() as { data?: { node?: { fileStatus: string, image?: { originalSrc: string, url: string }, url?: string } }, errors?: any[] };

      if (statusResult.errors?.length) {
        console.error("Image upload failed: Error polling file status", JSON.stringify(statusResult.errors));
        break;
      }

      const updatedFile = statusResult.data?.node;

      if (updatedFile && updatedFile.fileStatus === 'READY') {
        const finalUrl = updatedFile.image?.originalSrc || updatedFile.url || null;
        return finalUrl;
      } else if (updatedFile && (updatedFile.fileStatus === 'FAILED' || updatedFile.fileStatus === 'ERROR')) {
        console.error("Image upload failed: File status is FAILED or ERROR");
        return null;
      }
    }

    console.error("Image upload failed: Polling timed out");
    return null;

  } catch (error: any) {
    console.error("Image upload failed: Unexpected error", error);
    return null;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405 }
    );
  }

  try {
    const requestBody = await request.json();
    let { productId, rating, author, content, email, title, images: base64Images } = requestBody;

    if (!productId || !rating || !author || !content || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (productId, rating, author, content, email)" }),
        { status: 400 }
      );
    }

    if (typeof productId === 'string' && productId.startsWith('gid://shopify/Product/')) {
      productId = productId.split('/').pop() || '';
    }

    if (!/^\d+$/.test(productId)) {
      return new Response(
        JSON.stringify({ error: "Invalid Product ID format. Must be a numeric string or Shopify GID." }),
        { status: 400 }
      );
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return new Response(
        JSON.stringify({ error: "Invalid rating value. Must be a number between 1 and 5." }),
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format." }),
        { status: 400 }
      );
    }

    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > appConfig.reviews.maxWordCount) {
      return new Response(
        JSON.stringify({ error: `Review content must be ${appConfig.reviews.maxWordCount} words or less.` }),
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const shopDomain = url.searchParams.get("shop");

    if (!shopDomain) {
      return new Response(
        JSON.stringify({ error: "Missing shop parameter" }),
        { status: 400 }
      );
    }

    const imagesToCreate: { url: string; altText?: string; order?: number }[] = [];
    const imagesToProcess = Array.isArray(base64Images) ? base64Images.slice(0, appConfig.images.maxCount) : [];

    if (imagesToProcess.length > 0) {
      for (let i = 0; i < imagesToProcess.length; i++) {
        const base64Image = imagesToProcess[i];
        if (typeof base64Image === 'string') {
          const imageUrl = await uploadImageToShopify(base64Image, shopDomain);
          if (imageUrl) {
            imagesToCreate.push({ url: imageUrl, altText: `Review image ${i + 1}`, order: i });
          }
        }
      }
    }

    const review = await (prisma.productReview as any).create({
      data: {
        shop: shopDomain,
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

    try {
      const { admin } = await shopify.unauthenticated.admin(shopDomain);
      await calculateAndUpdateProductMetafields(productId, admin, shopDomain);
    } catch (metafieldError: any) {
      console.error("Metafield update failed:", metafieldError);
    }

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
    console.error("Action failed:", error);
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
    const shop = url.searchParams.get("shop");
    let productId = url.searchParams.get("productId");

    if (!shop) {
      return json({ error: "Missing shop parameter" }, { status: 400 });
    }

    if (productId) {
      if (typeof productId === 'string' && productId.startsWith('gid://shopify/Product/')) {
        productId = productId.split('/').pop() || '';
      }

      const allApprovedReviews = await (prisma.productReview as any).findMany({
        where: {
          shop,
          productId,
          status: "approved",
        },
        orderBy: [
          { rating: "desc" },
          { createdAt: "desc" }
        ],
        include: {
          images: {
            select: { id: true, url: true, altText: true, order: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      const serializableReviews = allApprovedReviews.map((review: any) => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        isSyndicated: review.isBundleReview || false,
        images: review.images.map((image: any) => ({
          ...image,
        }))
      }));

      return json(serializableReviews, { status: 200 });

    } else {
      const directReviews = await (prisma.productReview as any).findMany({
        where: {
          shop,
          status: "approved",
          isBundleReview: false
        },
        orderBy: [
          { rating: "desc" },
          { createdAt: "desc" }
        ],
        include: {
          images: {
            select: { id: true, url: true, altText: true, order: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      let totalRating = 0;
      directReviews.forEach((review: any) => {
        totalRating += review.rating;
      });
      const averageRating = directReviews.length > 0 ? (totalRating / directReviews.length) : 0;
      const totalReviews = directReviews.length;

      const serializableReviews = directReviews.map((review: any) => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        images: review.images.map((image: any) => ({
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
    return json(
      { error: error.message || "Failed to load reviews" },
      { status: 500 }
    );
  }
}
// app/routes/api.reviews.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server"; 
import { authenticate } from "../shopify.server"; 

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const { session } = await authenticate.admin(request); 

    if (!session || !session.shop) {
      return json({ error: "Shop session not found. Please log in." }, { status: 401 });
    }

    const formData = await request.formData();

    const title = formData.get("title")?.toString();
    const content = formData.get("content")?.toString();
    const rating = formData.get("rating")?.toString();
    const author = formData.get("author")?.toString();
    const email = formData.get("email")?.toString();
    const productId = formData.get("productId")?.toString();
    const productName = formData.get("productName")?.toString();

    if (!title || !content || !rating || !author || !productId || !productName) {
      return json({ error: "All required fields must be filled out." }, { status: 400 });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return json({ error: "Rating must be a number between 1 and 5." }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
       
        shopId: session.shop, 
        title,
        content,
        rating: parsedRating,
        author,
        email: email || null,
        productId,
        productName,
        date: new Date(),
        status: 'pending',
      },
    });

    return json({ message: "Review submitted successfully!", review }, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    if (error instanceof Response) {
      throw error;
    }
    return json({ error: "Failed to submit review. Please try again." }, { status: 500 });
  }
}



export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session || !session.shop) {
      return json({ error: "Authentication required or session invalid." }, { status: 401 });
    }

    const reviews = await db.review.findMany({
      where: {
     
        shopId: session.shop, 
      },
      orderBy: {

        date: 'desc' 
      }
    });

    return json(reviews); 
  } catch (error: any) {
    console.error("Error in /api/reviews loader:", error);

    if (error instanceof Response) {
      throw error;
    }

    return json({ error: "Failed to load reviews due to an unexpected server error." }, { status: 500 });
  }
}

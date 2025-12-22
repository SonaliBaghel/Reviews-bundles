// /home/gwl/Documents/GWL/app/routes/api.reviews.export.tsx
import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticate } from '../shopify.server'; 
import db from '../db.server';

function reviewsToCSV(reviews: any[]): string {
  if (reviews.length === 0) return '';

  const headers = [
    'id', 
    'productId', 
    'rating', 
    'author', 
    'email', 
    'title', 
    'content', 
    'status', 
    'createdAt'
  ];
  
  const csvRows = [headers.join(',')];

  for (const review of reviews) {
    const values = headers.map(header => {
      let value = review[header] !== undefined && review[header] !== null ? review[header] : '';
      
     
      if (typeof value === 'string') {
        
          value = value.replace(/(\r\n|\n|\r)/gm, " "); 
          
          if (value.includes(',') || value.includes('"')) {
            value = value.replace(/"/g, '""');
            value = `"${value}"`;
          }
      } else if (value instanceof Date) {
        value = value.toISOString();
      }
      
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function loader({ request }: LoaderFunctionArgs) {
 
  await authenticate.admin(request); 

  try {
   
    const reviews = await db.productReview.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        rating: true,
        author: true,
        email: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
      }
    });

    const csvData = reviewsToCSV(reviews);

    
    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="product_reviews_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });

  } catch (error) {
    console.error("Error exporting reviews:", error);
    return new Response("An error occurred while exporting reviews.", { status: 500 });
  }
}

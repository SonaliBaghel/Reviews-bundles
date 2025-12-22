// app/routes/app.products-reviews.tsx
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  Divider,
  Box,
  InlineStack,
  Icon,
  Badge,
  Select
} from "@shopify/polaris";
import { StarFilledIcon, ProductIcon, SortIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData, json } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useState, useCallback } from 'react';

import db from "../db.server";
import { authenticate } from "../shopify.server";

import ReviewList, { Review, ReviewImage } from "../components/ReviewList";
import ProductOverviewTable, { ProductSummary } from "../components/ProductOverviewTable";


interface ProductReviewRecord {
  id: string;
  productId: string;
  rating: number;
  author: string;
  email: string;
  title: string | null;
  content: string;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    order: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}


interface LoaderData {
  productSummaries: ProductSummary[];
}


const ensureShopifyGid = (productId: string): string => {
  if (productId.startsWith('gid://shopify/Product/')) {
    return productId;
  }
  return `gid://shopify/Product/${productId}`;
};

// Helper to extract numeric ID from gid://shopify/Product/12345
const getNumericProductId = (gid: string): string => {
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin } = await authenticate.admin(request);

    const allProductReviews: ProductReviewRecord[] = await db.productReview.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        images: true,
      },
    });

    console.log("1. All Product Reviews from Prisma DB (with images):", allProductReviews);

    const productMap = new Map<string, { totalRating: number; count: number; reviews: ProductReviewRecord[] }>();
    const uniqueProductGids = new Set<string>();

    allProductReviews.forEach(review => {
      const productGid = ensureShopifyGid(review.productId);
      uniqueProductGids.add(productGid);

      if (!productMap.has(productGid)) {
        productMap.set(productGid, { totalRating: 0, count: 0, reviews: [] });
      }
      const productData = productMap.get(productGid)!;
      productData.totalRating += review.rating;
      productData.count++;
      productData.reviews.push(review);
    });

    console.log("2. Unique Product GIDs identified (after conversion):", Array.from(uniqueProductGids));

    const productsData: Record<string, { title: string; imageUrl: string | null }> = {};

    if (uniqueProductGids.size > 0) {
      const idsToFetch = Array.from(uniqueProductGids);

      const query = `
        query ProductsByIds($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
            }
          }
        }
      `;

      try {
        console.log("3. Calling Shopify GraphQL API with GIDs:", idsToFetch);
        const response = await admin.graphql(query, { variables: { ids: idsToFetch } });
        const data = await response.json();
        console.log("4. Shopify GraphQL API Response:", JSON.stringify(data, null, 2));

        if (data.data && data.data.nodes) {
          data.data.nodes.forEach((node: any) => {
            if (node && node.id && node.title) {
              const imageUrl = node.images && node.images.edges.length > 0
                ? node.images.edges[0].node.url
                : null;
              productsData[node.id] = {
                title: node.title,
                imageUrl: imageUrl,
              };
            }
          });
          console.log("5. Parsed productsData from Shopify response:", productsData);
        } else if ((data as any).errors) {
          console.error("Shopify GraphQL Errors:", JSON.stringify((data as any).errors, null, 2));
        }
      } catch (graphQLError) {
        console.error("Error fetching product data from Shopify (catch block):", graphQLError);
      }
    } else {
      console.log("No unique product GIDs found to fetch from Shopify.");
    }

    const productSummaries: ProductSummary[] = Array.from(productMap.entries()).map(([productIdGid, data]) => ({
      productId: productIdGid,
      productName: productsData[productIdGid]?.title || `Product ${getNumericProductId(productIdGid)}`,
      productImageUrl: productsData[productIdGid]?.imageUrl || null,
      averageRating: (data.totalRating / data.count).toFixed(1),
      totalReviews: data.count,
      individualReviews: data.reviews.map(r => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        author: r.author,
        email: r.email,
        title: r.title,
        content: r.content,
        images: r.images.map(img => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          order: img.order,
          createdAt: img.createdAt.toISOString(),
          updatedAt: img.updatedAt.toISOString(),
        })),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        status: r.status,
      })),
    }));

    productSummaries.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));

    console.log("6. Final Product Summaries to be returned by loader (with images):", productSummaries);

    return json({ productSummaries: productSummaries });

  } catch (error) {
    console.error("Error in loader's main try-catch block:", error);
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    return json({ productSummaries: [] });
  }
}

export default function ProductsReviewsPage() {
  const { productSummaries } = useLoaderData<LoaderData>();
  const [sortOption, setSortOption] = useState('highest-rating');
  
  const totalProducts = productSummaries.length;
  const totalReviews = productSummaries.reduce((sum: number, product: ProductSummary) => sum + product.totalReviews, 0);
  const averageRating = totalProducts > 0 
    ? (productSummaries.reduce((sum: number, product: ProductSummary) => sum + parseFloat(product.averageRating), 0) / totalProducts).toFixed(1)
    : "0.0";

 
  const highRatedProductsCount = productSummaries.filter((p: ProductSummary) => parseFloat(p.averageRating) >= 4).length;
  const popularProductsCount = productSummaries.filter((p: ProductSummary) => p.totalReviews >= 5).length;

  
  const sortedProductSummaries = [...productSummaries].sort((a, b) => {
    switch (sortOption) {
      case 'highest-rating':
        return parseFloat(b.averageRating) - parseFloat(a.averageRating);
      case 'lowest-rating':
        return parseFloat(a.averageRating) - parseFloat(b.averageRating);
      case 'most-reviews':
        return b.totalReviews - a.totalReviews;
      case 'least-reviews':
        return a.totalReviews - b.totalReviews;
      case 'name-asc':
        return a.productName.localeCompare(b.productName);
      case 'name-desc':
        return b.productName.localeCompare(a.productName);
      default:
        return 0;
    }
  });

  const handleSortChange = useCallback((value: string) => {
    setSortOption(value);
  }, []);

  const sortOptions = [
    { label: 'Highest Rating', value: 'highest-rating' },
    { label: 'Lowest Rating', value: 'lowest-rating' },
    { label: 'Most Reviews', value: 'most-reviews' },
    { label: 'Least Reviews', value: 'least-reviews' },
    { label: 'Name A-Z', value: 'name-asc' },
    { label: 'Name Z-A', value: 'name-desc' },
  ];

  const getSortLabel = (value: string) => {
    return sortOptions.find(option => option.value === value)?.label || 'Highest Rating';
  };

  return (
    <Page fullWidth>
      <TitleBar title="Products Reviews Overview" />

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
          

            {/* Products List Card */}
            <Card padding="0">
              <Box padding="400">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="400" align="center">
                      <Text as="h2" variant="headingLg" fontWeight="semibold">
                        Product Ratings Overview
                      </Text>
                      {totalProducts > 0 && (
                        <InlineStack gap="200" align="center">
                          <Text as="span" variant="bodyMd" tone="subdued">
                            Sorted by
                          </Text>
                          <Select
                            label="Sort products"
                            labelHidden
                            options={sortOptions}
                            value={sortOption}
                            onChange={handleSortChange}
                            size="slim"
                          />
                        </InlineStack>
                      )}
                    </InlineStack>
                    
                    {totalProducts > 0 && (
                      <Badge tone="info">
                        {totalProducts} product{totalProducts !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </InlineStack>
                  <Divider />
                </BlockStack>
              </Box>
              
              {sortedProductSummaries.length > 0 ? (
                <ProductOverviewTable productSummaries={sortedProductSummaries} />
              ) : (
                <Box padding="600">
                  <BlockStack gap="400" align="center">
                    <div style={{ 
                      background: 'var(--p-color-bg-fill-tertiary)', 
                      borderRadius: 'var(--p-border-radius-400)',
                      padding: 'var(--p-space-500)',
                      marginBottom: 'var(--p-space-200)'
                    }}>
                      <Icon source={ProductIcon} tone="subdued" />
                    </div>
                    <BlockStack gap="200" align="center">
                      <Text as="h3" variant="headingMd" alignment="center">
                        No products with reviews yet
                      </Text>
                      <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                        Customer reviews will appear here once they start coming in. 
                        Share your products to collect valuable feedback.
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </Box>
              )}
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
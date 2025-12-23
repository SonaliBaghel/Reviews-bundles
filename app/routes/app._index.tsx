import {
  Page, Layout, BlockStack, Toast
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

import db from "../db.server";
import { Review } from "../components/ReviewList";
import StatsCard from "../components/StatsCard";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import { BulkManagementSection } from "../components/home/BulkManagementSection";
import { ReviewTabsSection } from "../components/home/ReviewTabsSection";
import { getNumericProductId, getGidProductId } from "../utils/product.helpers";
import { checkProductExists, fetchProductSummaries, ProductReviewRecord } from "../utils/review.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const reviewsPerPage = 10;
  const currentPage = parseInt(pageParam || "1", 10);
  const skip = (currentPage - 1) * reviewsPerPage;
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const totalReviews = await (db.productReview as any).count({ where: { shop } });
    const allProductReviews = await (db.productReview as any).findMany({
      where: { shop },
      orderBy: { createdAt: 'desc' },
      skip: skip, take: reviewsPerPage, include: { images: true }
    }) as ProductReviewRecord[];

    const sumAllRatings = await (db.productReview as any).aggregate({
      where: { shop },
      _sum: { rating: true }
    });
    const totalRatingSum = sumAllRatings?._sum?.rating || 0;
    const averageAppRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : "0.0";

    const serializableAllReviews: Review[] = allProductReviews.map(review => ({
      ...review,
      createdAt: (review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt),
      updatedAt: (review.updatedAt instanceof Date ? review.updatedAt.toISOString() : review.updatedAt),
      images: review.images.map(image => ({
        ...image,
        createdAt: (image.createdAt instanceof Date ? image.createdAt.toISOString() : image.createdAt),
        updatedAt: (image.updatedAt instanceof Date ? image.updatedAt.toISOString() : image.updatedAt)
      }))
    }));

    const productGql = `
      query getProducts {
        products(first: 250) {
          edges {
            node {
              id
              title
              handle
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
      }
    `;

    const shopifyResponse = await admin.graphql(productGql);
    const data = await shopifyResponse.json();
    const shopifyProducts = (data.data?.products?.edges || []).map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      imageUrl: edge.node.images?.edges?.[0]?.node?.url || null,
      numericId: getNumericProductId(edge.node.id)
    }));

    const productSummaries = await fetchProductSummaries(admin, shop);

    const bundles = await (db as any).reviewBundle.findMany({
      where: { shop },
      orderBy: { createdAt: 'desc' },
    });

    const serializableBundles = bundles.map((b: any) => ({
      ...b,
      productIds: b.productIds.split(','),
    }));

    return json({
      reviews: serializableAllReviews,
      totalReviews: totalReviews,
      averageRating: averageAppRating,
      currentPage: currentPage,
      reviewsPerPage: reviewsPerPage,
      productSummaries: productSummaries,
      bundles: serializableBundles,
      shopifyProducts: shopifyProducts,
    });

  } catch (error) {
    console.error("Error fetching data in GWL Hub loader:", error);
    return json({
      reviews: [],
      totalReviews: 0,
      averageRating: "0.0",
      currentPage: 1,
      reviewsPerPage: reviewsPerPage,
      productSummaries: [],
      bundles: [],
      shopifyProducts: []
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;

  if (actionType === 'export_csv') {
    try {
      const reviews = await (db.productReview as any).findMany({
        where: { shop },
        orderBy: { createdAt: 'desc' },
        include: { images: true },
      }) as ProductReviewRecord[];

      const csvHeaders = 'Product ID,Rating,Author,Email,Title,Content,Status,Created At\n';
      const csvRows = reviews.map(review => {
        const escapedContent = review.content ? `"${review.content.replace(/"/g, '""')}"` : '';
        const escapedTitle = review.title ? `"${review.title.replace(/"/g, '""')}"` : '';
        return [
          review.productId,
          review.rating,
          review.author || '',
          review.email || '',
          escapedTitle,
          escapedContent,
          review.status,
          (review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt)
        ].join(',');
      }).join('\n');

      const csvData = csvHeaders + csvRows;

      return json({
        success: true,
        csvData: csvData,
        fileName: `reviews-export-${new Date().toISOString().split('T')[0]}.csv`
      });
    } catch (error) {
      console.error('Export error:', error);
      return json({ success: false, error: 'Failed to export reviews' }, { status: 500 });
    }
  }

  if (actionType === 'download_sample_csv') {
    const sampleData = `Product ID,Rating,Author,Email,Title,Content,Status,Created At
gid://shopify/Product/123456789,5,John Doe,john@example.com,"Great product!","This product is amazing and works perfectly.",approved,2024-01-15T10:30:00.000Z
gid://shopify/Product/123456789,4,Jane Smith,jane@example.com,"Good quality","Pretty good but could be improved in some areas.",pending,2024-01-16T14:20:00.000Z
gid://shopify/Product/987654321,3,Bob Wilson,bob@example.com,"Average product","It's okay for the price, but not exceptional.",rejected,2024-01-17T09:15:00.000Z`;

    return json({
      success: true,
      csvData: sampleData,
      fileName: 'reviews-sample-template.csv'
    });
  }

  if (actionType === 'import_csv') {
    try {
      const csvFile = formData.get('csvFile') as File;
      if (!csvFile) {
        return json({ success: false, error: 'No CSV file provided' }, { status: 400 });
      }

      const csvText = await csvFile.text();
      const lines = csvText.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return json({ success: false, error: 'CSV file is empty or invalid' }, { status: 400 });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['Product ID', 'Rating', 'Author', 'Email', 'Title', 'Content', 'Status', 'Created At'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        return json({
          success: false,
          error: `Missing required headers: ${missingHeaders.join(', ')}`
        }, { status: 400 });
      }

      const importedReviews = [];
      const skippedProducts = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const reviewData: any = {};
        headers.forEach((header, index) => {
          let value = values[index];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          reviewData[header.toLowerCase().replace(' ', '_')] = value;
        });

        const productId = reviewData.product_id;
        const productExists = await checkProductExists(getNumericProductId(productId), admin);

        if (!productExists) {
          skippedProducts.push(getNumericProductId(productId));
          continue;
        }

        try {
          const newReview = await (db.productReview as any).create({
            data: {
              shop,
              productId: getNumericProductId(reviewData.product_id),
              rating: parseInt(reviewData.rating),
              author: reviewData.author,
              email: reviewData.email,
              title: reviewData.title,
              content: reviewData.content,
              status: reviewData.status as 'pending' | 'approved' | 'rejected',
              createdAt: new Date(reviewData.created_at),
              updatedAt: new Date(),
            }
          });
          importedReviews.push(newReview);
        } catch (error) {
          console.error(`Failed to import review on line ${i + 1}:`, error);
        }
      }

      let message = `Successfully imported ${importedReviews.length} reviews.`;
      if (skippedProducts.length > 0) {
        const uniqueSkipped = [...new Set(skippedProducts)];
        message += ` Skipped ${skippedProducts.length} reviews for non-existent products: ${uniqueSkipped.join(', ')}`;
      }

      return json({
        success: true,
        message: message,
        invalidProducts: skippedProducts.length > 0 ? [...new Set(skippedProducts)] : undefined
      });

    } catch (error) {
      console.error('Import error:', error);
      return json({ success: false, error: 'Failed to import CSV file' }, { status: 500 });
    }
  }

  return json({ success: false, error: "Unknown action type" });
}

export default function HomePage() {
  const {
    reviews, totalReviews, averageRating, currentPage,
    productSummaries, bundles, shopifyProducts,
    csvFile, activeToast, toastMessage, toastError,
    selectedTab, selectedBundleId, selectedProductId, sortOption,
    isSubmitting, pageCount, hasNext, hasPrevious,
    handlePageChange, handleFileChange, handleRemoveFile, toggleActiveToast,
    handleExportCSV, handleDownloadSampleCSV, handleImportCSV,
    handleTabChange, handleSortChange,
    setSelectedBundleId, setSelectedProductId, setActiveToast
  } = useHomeDashboard();

  const getProductTitleFromNumericId = (numericId: string) => {
    const product = shopifyProducts.find(p => p.numericId === numericId);
    return product?.title || `Product ${numericId}`;
  }

  const getProductImageFromNumericId = (numericId: string) => {
    const product = shopifyProducts.find(p => p.numericId === numericId);
    return product?.imageUrl || null;
  }

  const sortOptions = [
    { label: 'Highest Rating', value: 'highest-rating' }, { label: 'Lowest Rating', value: 'lowest-rating' },
    { label: 'Most Reviews', value: 'most-reviews' }, { label: 'Least Reviews', value: 'least-reviews' },
  ];

  const toastMarkup = activeToast ? (
    <Toast content={toastMessage} onDismiss={() => setActiveToast(false)} error={toastError} />
  ) : null;

  return (
    <Page fullWidth>
      <TitleBar title="GWL - Reviews Management Hub" />

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <StatsCard totalReviews={totalReviews} averageRating={averageRating} />
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <BulkManagementSection
            isSubmitting={isSubmitting}
            handleExportCSV={handleExportCSV}
            csvFile={csvFile}
            handleFileChange={handleFileChange}
            handleRemoveFile={handleRemoveFile}
            handleImportCSV={handleImportCSV}
            handleDownloadSampleCSV={handleDownloadSampleCSV}
          />
        </Layout.Section>

        <Layout.Section>
          <ReviewTabsSection
            selectedTab={selectedTab}
            handleTabChange={handleTabChange}
            totalReviews={totalReviews}
            reviews={reviews}
            pageCount={pageCount}
            currentPage={currentPage}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            handlePageChange={handlePageChange}
            productSummaries={productSummaries}
            sortOptions={sortOptions}
            sortOption={sortOption}
            handleSortChange={handleSortChange}
            bundles={bundles}
            selectedBundleId={selectedBundleId}
            setSelectedBundleId={setSelectedBundleId}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            shopifyProducts={shopifyProducts}
            getNumericProductId={getNumericProductId}
            getGidProductId={getGidProductId}
            getProductTitleFromNumericId={getProductTitleFromNumericId}
            getProductImageFromNumericId={getProductImageFromNumericId}
          />
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Page>
  );
}
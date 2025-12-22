import { useState, useCallback, useEffect } from 'react';

import { 
  Page, Layout, Card, Text, BlockStack, Box, Divider, 
  Pagination, InlineStack, Button, Banner, Toast, Badge,
  Tabs, ResourceList, ResourceItem, Icon, Link as PolarisLink,
  Thumbnail, InlineGrid, Select, List
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { 
  ExportIcon, ImportIcon, FolderIcon, ProductIcon, StarFilledIcon 
} from '@shopify/polaris-icons';
import { useLoaderData, json, useSearchParams, useNavigate, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

import db from "../db.server";
import ReviewList, { Review } from "../components/ReviewList"; 
import StatsCard from "../components/StatsCard";
import ProductOverviewTable, { ProductSummary } from "../components/ProductOverviewTable"; 

interface ReviewBundle {
  id: string; name: string; bundleProductId: string; productIds: string[]; 
}
interface ProductReviewRecord extends Review {
  isBundleReview?: boolean; bundleContext?: string | null;
}
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  numericId: string;
}
interface LoaderData {
  reviews: Review[]; totalReviews: number; averageRating: string;
  currentPage: number; reviewsPerPage: number;
  productSummaries: ProductSummary[]; bundles: ReviewBundle[];
  shopifyProducts: ShopifyProduct[];
}
interface ActionData {
  success?: boolean; message?: string; error?: string;
  csvData?: string; fileName?: string; invalidProducts?: string[];
}

const getGidProductId = (numericId: string): string => { return `gid://shopify/Product/${numericId}`; };
const getNumericProductId = (gid: string): string => {
    const parts = gid.split('/'); return parts[parts.length - 1];
};
const ensureShopifyGid = (productId: string): string => {
    if (productId.startsWith('gid://shopify/Product/')) { return productId; }
    return `gid://shopify/Product/${productId}`;
};

async function checkProductExists(productId: string, admin: any): Promise<boolean> {
  try {
    const gid = `gid://shopify/Product/${productId}`;
    const response = await admin.graphql(`
      query productExists($id: ID!) {
        product(id: $id) { id title }
      }`, { variables: { id: gid } });
    const data = await response.json();
    return !!data.data?.product;
  } catch (error) {
    console.error(`Error checking product ${productId}:`, error);
    return false;
  }
}

async function fetchProductSummaries(admin: any) {
    const allProductReviews: ProductReviewRecord[] = await db.productReview.findMany({
        orderBy: { createdAt: 'desc' },
        include: { images: true },
    });

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

    const productsData: Record<string, { title: string; imageUrl: string | null }> = {};
    if (uniqueProductGids.size > 0) {
        const idsToFetch = Array.from(uniqueProductGids);
        const query = `query ProductsByIds($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id title images(first: 1) { edges { node { url } } } } } }`;
        const response = await admin.graphql(query, { variables: { ids: idsToFetch } });
        const data = await response.json();
        if (data.data?.nodes) {
            data.data.nodes.forEach((node: any) => {
                if (node && node.id && node.title) {
                    productsData[node.id] = {
                        title: node.title,
                        imageUrl: node.images?.edges[0]?.node?.url || null,
                    };
                }
            });
        }
    }
    
    const productSummaries: ProductSummary[] = Array.from(productMap.entries()).map(([productIdGid, data]) => ({
        productId: productIdGid,
        productName: productsData[productIdGid]?.title || `Product ${getNumericProductId(productIdGid)}`,
        productImageUrl: productsData[productIdGid]?.imageUrl || null,
        averageRating: (data.totalRating / data.count).toFixed(1),
        totalReviews: data.count,
        individualReviews: data.reviews.map(r => ({
            id: r.id, productId: r.productId, rating: r.rating, author: r.author, email: r.email,
            title: r.title, content: r.content, status: r.status,
            createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
            images: r.images.map(img => ({ 
              id: img.id, url: img.url, altText: img.altText, order: img.order,
              createdAt: (img.createdAt as any).toISOString(), updatedAt: (img.updatedAt as any).toISOString()
            }))
        })),
    }));

    productSummaries.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
    return productSummaries;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const reviewsPerPage = 10;
  const currentPage = parseInt(pageParam || "1", 10);
  const skip = (currentPage - 1) * reviewsPerPage;
  const { admin } = await authenticate.admin(request); 

  try {
    const totalReviews = await db.productReview.count();
    const allProductReviews: ProductReviewRecord[] = await db.productReview.findMany({
      orderBy: { createdAt: 'desc' },
      skip: skip, take: reviewsPerPage, include: { images: true }
    });

    const sumAllRatings = await db.productReview.aggregate({ _sum: { rating: true } });
    const totalRatingSum = sumAllRatings._sum.rating || 0;
    const averageAppRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : "0.0";

    const serializableAllReviews: Review[] = allProductReviews.map(review => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      images: review.images.map(image => ({
        ...image,
        createdAt: (image.createdAt as any).toISOString(), updatedAt: (image.updatedAt as any).toISOString()
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
    const shopifyProducts: ShopifyProduct[] = (data.data?.products?.edges || []).map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      imageUrl: edge.node.images?.edges?.[0]?.node?.url || null,
      numericId: getNumericProductId(edge.node.id)
    }));

    const productSummaries = await fetchProductSummaries(admin);

    const bundles = await (db as any).reviewBundle.findMany({
        orderBy: { createdAt: 'desc' },
    });
    
    const serializableBundles: ReviewBundle[] = bundles.map((b: any) => ({
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
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;

  if (actionType === 'export_csv') { 
    try {
      const reviews = await db.productReview.findMany({
        orderBy: { createdAt: 'desc' },
        include: { images: true },
      });

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
          review.createdAt.toISOString()
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
          const newReview = await db.productReview.create({
            data: {
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
    reviews, totalReviews, averageRating, currentPage, reviewsPerPage, 
    productSummaries, bundles, shopifyProducts 
  } = useLoaderData<LoaderData>();
  
  const actionData = useActionData<ActionData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeToast, setActiveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  
  const [selectedTab, setSelectedTab] = useState(0); 
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('highest-rating'); 
  
  const isSubmitting = navigation.state === 'submitting';
  
  const pageCount = Math.ceil(totalReviews / reviewsPerPage);
  const hasNext = currentPage < pageCount;
  const hasPrevious = currentPage > 1;

  const handlePageChange = (newPage: number) => {
    searchParams.set("page", String(newPage));
    navigate(`?${searchParams.toString()}`);
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setCsvFile(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setCsvFile(null);
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);

  const handleExportCSV = useCallback(() => {
    const formData = new FormData();
    formData.append('actionType', 'export_csv');
    submit(formData, { method: 'post' });
  }, [submit]);

  const handleDownloadSampleCSV = useCallback(() => {
    const formData = new FormData();
    formData.append('actionType', 'download_sample_csv');
    submit(formData, { method: 'post' });
  }, [submit]);

  const handleImportCSV = useCallback(() => {
    if (!csvFile) {
      setToastMessage('Please select a CSV file to import');
      setToastError(true);
      setActiveToast(true);
      return;
    }
    const formData = new FormData();
    formData.append('actionType', 'import_csv');
    formData.append('csvFile', csvFile);
    
    submit(formData, { 
      method: 'post',
      encType: 'multipart/form-data'
    });
  }, [csvFile, submit]);
  
  useEffect(() => {
    if (actionData?.csvData && actionData.fileName) {
      const blob = new Blob([actionData.csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = actionData.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData && !actionData.csvData) {
      setToastMessage(actionData.message || actionData.error || 'Action completed.');
      setToastError(!actionData.success);
      setActiveToast(true);
      
      if (actionData.success) {
        setCsvFile(null);
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  }, [actionData]);

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
    setSelectedBundleId(null);
    setSelectedProductId(null);
  }, []);
  
  const handleSortChange = useCallback((value: string) => {
    setSortOption(value);
  }, []);
  
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
  const sortedProductSummaries = [...productSummaries].sort((a, b) => {
    switch (sortOption) {
      case 'highest-rating': return parseFloat(b.averageRating) - parseFloat(a.averageRating);
      case 'lowest-rating': return parseFloat(a.averageRating) - parseFloat(b.averageRating);
      case 'most-reviews': return b.totalReviews - a.totalReviews;
      case 'least-reviews': return a.totalReviews - b.totalReviews;
      default: return 0;
    }
  });

  const tabs = [
    { id: 'all-reviews', content: 'All Reviews', panelID: 'all-reviews-panel', badge: totalReviews > 0 ? String(totalReviews) : undefined },
    { id: 'product-summary', content: 'Product Ratings Overview', panelID: 'product-summary-panel', badge: productSummaries.length > 0 ? String(productSummaries.length) : undefined },
    { id: 'bundle-reviews', content: 'Bundle Review Approvals', panelID: 'bundle-reviews-panel', badge: bundles.length > 0 ? String(bundles.length) : undefined },
  ];
  
  const renderTabContent = () => {
    switch (selectedTab) {
        case 0:
            return (
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg" fontWeight="semibold">All Customer Reviews</Text>
                <Divider />
                <Box padding="500">
                    {reviews.length > 0 ? (
                        <>
                       <ReviewList reviews={reviews} actionSource="individual" />
                            {pageCount > 1 && (
                              <Box paddingBlockStart="400" paddingBlockEnd="200">
                                <InlineStack align="center">
                                  <Pagination
                                    hasPrevious={hasPrevious}
                                    onPrevious={() => handlePageChange(currentPage - 1)}
                                    hasNext={hasNext}
                                    onNext={() => handlePageChange(currentPage + 1)}
                                    label={`Page ${currentPage} of ${pageCount}`}
                                  />
                                </InlineStack>
                              </Box>
                            )}
                        </>
                    ) : (<Text as="p">No reviews yet.</Text>)}
                </Box>
            </BlockStack>
            );
        case 1:
            return (
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg" fontWeight="semibold">Product Ratings Overview (Individual Approvals)</Text>
                    <Select label="Sort products" labelHidden options={sortOptions} value={sortOption} onChange={handleSortChange} size="slim"/>
                </InlineStack>
                <Divider />
                <Box padding="500">
                    {sortedProductSummaries.length > 0 ? (
                        <ProductOverviewTable productSummaries={sortedProductSummaries} actionSource="individual" />
                    ) : (<Text as="p">No products with reviews yet.</Text>)}
                </Box>
            </BlockStack>
            );
        case 2:
            const currentBundle = bundles.find(b => b.id === selectedBundleId);
            const currentProductSummary = productSummaries.find(p => getNumericProductId(p.productId) === selectedProductId);
            
            if (currentProductSummary && selectedProductId && currentBundle) {
                 const allReviewsForProduct = currentProductSummary.individualReviews;
                 
                 return (
                    <BlockStack gap="400">
                         <Box padding="400" background="bg-fill-info-secondary" borderRadius="200">
                            <InlineStack align="start" blockAlign="center" gap="400">
                                <Button onClick={() => setSelectedProductId(null)} size="slim">← Back to Bundle Products</Button>
                                <BlockStack gap="100">
                                    <Text as="h2" variant="headingLg" fontWeight="semibold">{currentProductSummary.productName}</Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">Part of Bundle: {currentBundle.name}</Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                      Status: {allReviewsForProduct.filter(r => r.status === 'pending').length} Pending, 
                                      {allReviewsForProduct.filter(r => r.status === 'approved').length} Approved, 
                                      {allReviewsForProduct.filter(r => r.status === 'rejected').length} Rejected
                                    </Text>
                                </BlockStack>
                            </InlineStack>
                        </Box>
                        <Text as="h3" variant="headingMd" fontWeight="medium">All Reviews for Syndication ({allReviewsForProduct.length})</Text>
                        <Divider />
                        <Box padding="500">
                            {allReviewsForProduct.length > 0 ? ( 
                              <ReviewList reviews={allReviewsForProduct} actionSource="bundle" />
                            ) : (<Text as="p">No reviews found for this product.</Text>)}
                        </Box>
                    </BlockStack>
                );
            }
            
            if (currentBundle && selectedBundleId) {
                const productsInBundle = currentBundle.productIds;
                return (
                    <BlockStack gap="400">
                        <Box padding="400" background="bg-fill-info-secondary" borderRadius="200">
                            <InlineStack align="start" blockAlign="center" gap="400">
                                <Button onClick={() => setSelectedBundleId(null)} size="slim">← Back to Bundles List</Button>
                                <BlockStack gap="100">
                                    <Text as="h2" variant="headingLg" fontWeight="semibold">Bundle: {currentBundle.name}</Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">Products: {productsInBundle.length}</Text>
                                </BlockStack>
                            </InlineStack>
                        </Box>
                        <Text as="h3" variant="headingMd" fontWeight="medium">Products in Bundle</Text>
                        <Divider />
                        <Box padding="500">
                             <ResourceList
                                resourceName={{ singular: 'product', plural: 'products' }}
                                items={productsInBundle}
                                renderItem={(numericId) => {
                                    const productTitle = getProductTitleFromNumericId(numericId);
                                    const productImage = getProductImageFromNumericId(numericId);
                                    const productSummary = productSummaries.find(p => getNumericProductId(p.productId) === numericId);
                                    const totalReviewsCount = productSummary?.individualReviews.length || 0;
                                    const pendingCount = productSummary?.individualReviews.filter(r => r.status === 'pending').length || 0;
                                    const approvedCount = productSummary?.individualReviews.filter(r => r.status === 'approved').length || 0;
                                    const productGid = getGidProductId(numericId);
                                    
                                    return (
                                        <ResourceItem
                                            id={productGid}
                                            url="#"
                                            media={ 
                                              <Thumbnail 
                                                source={productImage || 'https://via.placeholder.com/80'} 
                                                alt={productTitle} 
                                                size="small"
                                              /> 
                                            }
                                            accessibilityLabel={`View reviews for ${productTitle}`}
                                            onClick={() => setSelectedProductId(numericId)}
                                        >
                                            <BlockStack gap="100">
                                                <Text as="h3" variant="bodyLg" fontWeight="semibold">{productTitle}</Text>
                                                <InlineStack gap="200" blockAlign="center">
                                                    {numericId === currentBundle.bundleProductId && (
                                                        <Badge tone="success" size="small">Main</Badge>
                                                    )}
                                                    <Badge tone="info" size="small">{totalReviewsCount} Total Review{totalReviewsCount !== 1 ? 's' : ''}</Badge>
                                                    {pendingCount > 0 && <Badge tone="attention" size="small">{pendingCount} Pending</Badge>}
                                                    {approvedCount > 0 && <Badge tone="success" size="small">{approvedCount} Approved</Badge>}
                                                    <Badge size="small">ID: {numericId}</Badge>
                                                </InlineStack>
                                            </BlockStack>
                                        </ResourceItem>
                                    );
                                }}
                            />
                        </Box>
                    </BlockStack>
                );
            }

            return (
                <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingLg" fontWeight="semibold">Select Bundle for Approval</Text>
                        <Badge tone="info" size="large">{bundles.length} bundles created</Badge>
                    </InlineStack>
                    <Divider />
                    <Box padding="500">
                        {bundles.length > 0 ? (
                            <ResourceList
                                resourceName={{ singular: 'bundle', plural: 'bundles' }}
                                items={bundles}
                                renderItem={(bundle) => {
                                    const productsInBundleCount = bundle.productIds.length;
                                    const mainProductTitle = getProductTitleFromNumericId(bundle.bundleProductId);
                                    return (
                                        <ResourceItem
                                            id={bundle.id}
                                            url="#"
                                            media={ <Icon source={FolderIcon} tone="base" /> }
                                            accessibilityLabel={`View bundle ${bundle.name}`}
                                            onClick={() => setSelectedBundleId(bundle.id)}
                                        >
                                            <BlockStack gap="100">
                                                <Text as="h3" variant="bodyLg" fontWeight="semibold">{bundle.name}</Text>
                                                <InlineStack gap="100" blockAlign="center" wrap={false}>
                                                    <Badge size="small" tone="success">Main: {mainProductTitle}</Badge>
                                                    <Badge size="small">+{productsInBundleCount - 1} {productsInBundleCount - 1 === 1 ? 'Product' : 'Products'}</Badge>
                                                </InlineStack>
                                            </BlockStack>
                                        </ResourceItem>
                                    );
                                }}
                            />
                        ) : (
                            <BlockStack gap="200" align="center">
                                <Text as="p" alignment="center">No Review Bundles configured yet.</Text>
                                <PolarisLink url="/app/create-bundle">Create your first bundle now.</PolarisLink>
                            </BlockStack>
                        )}
                    </Box>
                </BlockStack>
            );
        default: return null;
    }
  };

  const toastMarkup = activeToast ? (
    <Toast content={toastMessage} onDismiss={toggleActiveToast} error={toastError} />
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
          <Card>
            <BlockStack gap="600">
              <Text as="h2" variant="headingXl" fontWeight="bold">
                Bulk Review Management
              </Text>
              
              <Banner tone="info">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyLg">
                    Export your reviews to CSV for backup or analysis, or import reviews from a CSV file.
                    Download the sample template to see the required format.
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    <strong>Important:</strong> When importing, reviews for existing products will be imported successfully. 
                    Reviews for non-existent products will be skipped with a warning message.
                  </Text>
                </BlockStack>
              </Banner>

              <Divider />

              <InlineStack gap="800" align="start" blockAlign="center">
                <Box flex="1">
                  <BlockStack gap="400">
                    <Button 
                      variant="primary" 
                      onClick={handleExportCSV} 
                      disabled={isSubmitting}
                      icon={ExportIcon}
                      fullWidth
                      size="large"
                    >
                      {isSubmitting ? "Exporting..." : "Download CSV"}
                    </Button>
                    <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                      Export all reviews as CSV file
                    </Text>
                  </BlockStack>
                </Box>

                <Divider vertical />

                <Box flex="1">
                  <BlockStack gap="400">
                    {!csvFile ? (
                      <Box width="100%">
                        <input
                          id="csv-file-input"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          style={{ 
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #c4cdd5',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}
                        />
                      </Box>
                    ) : (
                      <Box width="100%">
                        <Box 
                          background="bg-fill-success-secondary" 
                          borderRadius="300" 
                          padding="400"
                          border="divider"
                        >
                          <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                              <Box background="bg-fill-success" borderRadius="200" padding="200">
                                <Text variant="bodyLg" fontWeight="bold" tone="text-inverse">
                                  ✓
                                </Text>
                              </Box>
                              <BlockStack gap="100">
                                <Text variant="bodyLg" fontWeight="bold">
                                  {csvFile.name}
                                </Text>
                                <Text variant="bodyMd" tone="subdued">
                                  {(csvFile.size / 1024).toFixed(1)} KB
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            <Button 
                              variant="plain" 
                              onClick={handleRemoveFile}
                              tone="critical"
                              size="large"
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        </Box>
                      </Box>
                    )}

                    <Button 
                      variant="secondary" 
                      onClick={handleImportCSV} 
                      disabled={isSubmitting || !csvFile}
                      icon={ImportIcon}
                      fullWidth
                      size="large"
                    >
                      {isSubmitting ? "Importing..." : "Import CSV"}
                    </Button>
                  </BlockStack>
                </Box>

                <Divider vertical />

                <Box flex="1">
                  <BlockStack gap="400">
                    <Button 
                      variant="plain" 
                      onClick={handleDownloadSampleCSV} 
                      disabled={isSubmitting}
                      fullWidth
                      size="large"
                    >
                      {isSubmitting ? "Downloading..." : "Download Sample"}
                    </Button>
                    <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                      Get CSV template with examples
                    </Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Box padding="500"> {renderTabContent()} </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Page>
  );
}
import {
    BlockStack, Box, Divider, Text, Select, Tabs, ResourceList, ResourceItem, Thumbnail, Badge, Button, InlineStack, Pagination, Link as PolarisLink
} from "@shopify/polaris";
import { FolderIcon } from '@shopify/polaris-icons';
import { Icon } from "@shopify/polaris";
import ReviewList, { Review } from "../ReviewList";
import ProductOverviewTable, { ProductSummary } from "../ProductOverviewTable";

interface ReviewBundle {
    id: string; name: string; bundleProductId: string; productIds: string[];
}

interface ShopifyProduct {
    id: string; title: string; handle: string; imageUrl: string | null; numericId: string;
}

interface ReviewTabsSectionProps {
    selectedTab: number;
    handleTabChange: (index: number) => void;
    totalReviews: number;
    reviews: Review[];
    pageCount: number;
    currentPage: number;
    hasPrevious: boolean;
    hasNext: boolean;
    handlePageChange: (page: number) => void;
    productSummaries: ProductSummary[];
    sortOptions: { label: string; value: string }[];
    sortOption: string;
    handleSortChange: (value: string) => void;
    bundles: ReviewBundle[];
    selectedBundleId: string | null;
    setSelectedBundleId: (id: string | null) => void;
    selectedProductId: string | null;
    setSelectedProductId: (id: string | null) => void;
    shopifyProducts: ShopifyProduct[];
    getNumericProductId: (gid: string) => string;
    getGidProductId: (numericId: string) => string;
    getProductTitleFromNumericId: (numericId: string) => string;
    getProductImageFromNumericId: (numericId: string) => string | null;
}

export function ReviewTabsSection({
    selectedTab,
    handleTabChange,
    totalReviews,
    reviews,
    pageCount,
    currentPage,
    hasPrevious,
    hasNext,
    handlePageChange,
    productSummaries,
    sortOptions,
    sortOption,
    handleSortChange,
    bundles,
    selectedBundleId,
    setSelectedBundleId,
    selectedProductId,
    setSelectedProductId,
    shopifyProducts,
    getNumericProductId,
    getGidProductId,
    getProductTitleFromNumericId,
    getProductImageFromNumericId
}: ReviewTabsSectionProps) {
    const tabs = [
        { id: 'all-reviews', content: 'All Reviews', panelID: 'all-reviews-panel', badge: totalReviews > 0 ? String(totalReviews) : undefined },
        { id: 'product-summary', content: 'Product Ratings Overview', panelID: 'product-summary-panel', badge: productSummaries.length > 0 ? String(productSummaries.length) : undefined },
        { id: 'bundle-reviews', content: 'Bundle Review Approvals', panelID: 'bundle-reviews-panel', badge: bundles.length > 0 ? String(bundles.length) : undefined },
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
                            <Select label="Sort products" labelHidden options={sortOptions} value={sortOption} onChange={handleSortChange} />
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
                                    renderItem={(numericId: any) => {
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
                                                        <Badge tone="info" size="small">{`${totalReviewsCount} Total Review${totalReviewsCount !== 1 ? 's' : ''}`}</Badge>
                                                        {pendingCount > 0 && <Badge tone="attention" size="small">{`${pendingCount} Pending`}</Badge>}
                                                        {approvedCount > 0 && <Badge tone="success" size="small">{`${approvedCount} Approved`}</Badge>}
                                                        <Badge size="small">{`ID: ${numericId}`}</Badge>
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
                            <Badge tone="info" size="large">{`${bundles.length} bundles created`}</Badge>
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
                                                media={<Icon source={FolderIcon} tone="base" />}
                                                accessibilityLabel={`View bundle ${bundle.name}`}
                                                onClick={() => setSelectedBundleId(bundle.id)}
                                            >
                                                <BlockStack gap="100">
                                                    <Text as="h3" variant="bodyLg" fontWeight="semibold">{bundle.name}</Text>
                                                    <InlineStack gap="100" blockAlign="center" wrap={false}>
                                                        <Badge size="small" tone="success">{`Main: ${mainProductTitle}`}</Badge>
                                                        <Badge size="small">{`+${productsInBundleCount - 1} ${productsInBundleCount - 1 === 1 ? 'Product' : 'Products'}`}</Badge>
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

    return (
        <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
            <Box paddingBlockStart="400">
                {renderTabContent()}
            </Box>
        </Tabs>
    );
}

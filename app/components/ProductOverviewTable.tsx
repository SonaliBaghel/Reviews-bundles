import {
  Card,
  Text,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Modal,
  BlockStack,
  Box,
  InlineStack,
  Badge,
  InlineGrid,
  Icon,
} from '@shopify/polaris';
import { useCallback, useState } from 'react';
import { StarFilledIcon } from "@shopify/polaris-icons";
import { useSubmit } from '@remix-run/react';

import ReviewList, { Review } from './ReviewList';

export interface ProductSummary {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  averageRating: string;
  totalReviews: number;
  individualReviews: Review[];
}

interface ProductOverviewTableProps {
  productSummaries: ProductSummary[];
  actionSource?: 'bundle' | 'individual';
}

export default function ProductOverviewTable({ 
  productSummaries, 
  actionSource = 'individual'
}: ProductOverviewTableProps) {
  const [activeModal, setActiveModal] = useState(false);
  const [selectedProductReviews, setSelectedProductReviews] = useState<Review[]>([]);
  const [selectedProductName, setSelectedProductName] = useState('');
  const submit = useSubmit();

  const handleViewReviews = useCallback((product: ProductSummary) => {
    setSelectedProductReviews(product.individualReviews);
    setSelectedProductName(product.productName);
    setActiveModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setActiveModal(false);
    setSelectedProductReviews([]);
    setSelectedProductName('');
  }, []);

  const defaultPlaceholderImageUrl = (text: string) => 
    `https://placehold.co/80x80/f6f6f7/6d7175?text=${encodeURIComponent(text)}`;

  const getRatingTone = (rating: string) => {
    const numRating = parseFloat(rating);
    if (numRating >= 4.5) return "success";
    if (numRating >= 4.0) return "success";
    if (numRating >= 3.0) return "warning";
    if (numRating >= 2.0) return "critical";
    return "critical";
  };

  const getPendingReviewsCount = (reviews: Review[]) => {
    return reviews.filter(review => review.status === 'pending').length;
  };

  return (
    <BlockStack gap="400">
      {productSummaries.length > 0 ? (
        <Card padding="0">
          <ResourceList
            resourceName={{ singular: 'product', plural: 'products' }}
            items={productSummaries}
            renderItem={(item) => {
              const { productId, productName, productImageUrl, averageRating, totalReviews, individualReviews } = item;
              const pendingReviewsCount = getPendingReviewsCount(individualReviews);

              return (
                <ResourceItem
                  id={productId}
                  url="#"
                  media={
                    <Box paddingInlineEnd="200">
                      <Thumbnail
                        source={productImageUrl || defaultPlaceholderImageUrl(productName.split(' ')[0])}
                        alt={`Image of ${productName}`}
                        size="medium"
                      />
                    </Box>
                  }
                  accessibilityLabel={`View reviews for ${productName}`}
                  onClick={() => handleViewReviews(item)}
                >
                  <InlineGrid columns="1fr auto" gap="400" alignItems="center">
                    <BlockStack gap="200">
                      <Text as="h3" variant="bodyLg" fontWeight="semibold">
                        {productName}
                      </Text>
                      <InlineStack gap="300" align="start" blockAlign="center">
                        <InlineStack gap="100" align="center">
                          <Icon source={StarFilledIcon} tone="warning" />
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {averageRating}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">
                            /5
                          </Text>
                        </InlineStack>
                        <Text as="span" variant="bodyMd" tone="subdued">
                          •
                        </Text>
                        <Text as="span" variant="bodyMd" tone="subdued">
                          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                        </Text>
                        {pendingReviewsCount > 0 && (
                          <>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              •
                            </Text>
                            <Badge tone="attention" size="small">
                              {pendingReviewsCount} pending
                            </Badge>
                          </>
                        )}
                      </InlineStack>
                    </BlockStack>
                    
                    <Badge 
                      tone={getRatingTone(averageRating)}
                      size="large"
                    >
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={StarFilledIcon} />
                        <Text as="span" variant="bodyMd">
                          {averageRating}
                        </Text>
                      </InlineStack>
                    </Badge>
                  </InlineGrid>
                </ResourceItem>
              );
            }}
          />
        </Card>
      ) : (
        <Card padding="600">
          <Box paddingBlockStart="400" paddingBlockEnd="400">
            <BlockStack gap="400" align="center">
              <div style={{ 
                background: 'var(--p-color-bg-fill-tertiary)', 
                borderRadius: 'var(--p-border-radius-400)',
                padding: 'var(--p-space-400)',
                marginBottom: 'var(--p-space-200)'
              }}>
                <Icon source={StarFilledIcon} tone="subdued" />
              </div>
              <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                No products with reviews yet.
              </Text>
              <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                Customer reviews will appear here once they start coming in.
              </Text>
            </BlockStack>
          </Box>
        </Card>
      )}

      <Modal
        activator={<div style={{ display: 'none' }} />}
        open={activeModal}
        onClose={handleModalClose}
        title={
          <InlineStack align="space-between" blockAlign="center" gap="400">
            <InlineStack gap="200" align="center">
              <Text as="h2" variant="headingLg">
                {selectedProductName}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                • Customer Reviews ({selectedProductReviews.length})
              </Text>
            </InlineStack>
            {selectedProductReviews.length > 0 && (
              <Badge tone="attention">
                {getPendingReviewsCount(selectedProductReviews)} pending
              </Badge>
            )}
          </InlineStack>
        }
        size="large"
        primaryAction={{
          content: 'Close',
          onAction: handleModalClose,
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {selectedProductReviews.length > 0 ? (
              <ReviewList 
                reviews={selectedProductReviews} 
                externalSubmit={submit}
                onReviewsUpdate={handleModalClose}
                actionSource={actionSource}
              />
            ) : (
              <Card padding="600">
                <Box paddingBlockStart="400" paddingBlockEnd="400">
                  <BlockStack gap="400" align="center">
                    <div style={{ 
                      background: 'var(--p-color-bg-fill-tertiary)', 
                      borderRadius: 'var(--p-border-radius-400)',
                      padding: 'var(--p-space-400)',
                      marginBottom: 'var(--p-space-200)'
                    }}>
                      <Icon source={StarFilledIcon} tone="subdued" />
                    </div>
                    <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                      No reviews available for this product.
                    </Text>
                    <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                      Check back later for customer feedback.
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}
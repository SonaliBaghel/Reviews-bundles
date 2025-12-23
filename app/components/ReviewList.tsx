import { Box, BlockStack, InlineError, Text } from "@shopify/polaris";
import { useSubmit, useFetcher } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
import EditReviewModal from "./EditReviewModal";
import DeleteReviewModal from "./DeleteReviewModal";
import ReviewCard from "./ReviewCard";

export interface ReviewImage {
  id: string;
  url: string;
  altText: string | null;
  order: number | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  author: string;
  email: string;
  title: string | null;
  content: string;
  images: ReviewImage[];
  createdAt: string | Date;
  updatedAt: string | Date;
  status: string;
  isBundleReview?: boolean;
  bundleContext?: string | null;
}

interface ReviewListProps {
  reviews: Review[];
  externalSubmit?: ReturnType<typeof useSubmit>;
  onReviewsUpdate?: () => void;
  actionSource?: 'bundle' | 'individual';
}

export default function ReviewList({
  reviews,
  externalSubmit,
  onReviewsUpdate,
  actionSource = 'individual',
}: ReviewListProps) {
  const localSubmit = useSubmit();
  const actualSubmit = externalSubmit || localSubmit;
  const fetcher = useFetcher();

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = fetcher.data as any;
    if (fetcher.state === "idle" && data) {
      if (data.success) {
        setError(null);

        if (editingReview) {
          setEditingReview(null);
        }
        if (deletingReview) {
          setDeletingReview(null);
        }
        if (onReviewsUpdate) {
          setTimeout(onReviewsUpdate, 100);
        }
      } else if (data.error) {
        setError(data.error);
      }
    }
  }, [fetcher.state, fetcher.data, editingReview, deletingReview, onReviewsUpdate]);

  const handleChangeStatus = useCallback((reviewId: string, newStatus: string) => {
    const formData = new FormData();
    formData.append("status", newStatus);
    formData.append("actionSource", actionSource);

    actualSubmit(formData, {
      method: "post",
      action: `/app/reviews/${reviewId}/status`,
    });
  }, [actionSource, actualSubmit]);

  const handleEdit = useCallback((review: Review) => {
    setEditingReview(review);
    setError(null);
  }, []);

  const handleDelete = useCallback((review: Review) => {
    setDeletingReview(review);
    setError(null);
  }, []);

  const handleEditSubmit = useCallback((formData: FormData) => {
    if (!editingReview) return;

    formData.append("actionSource", actionSource);

    fetcher.submit(formData, {
      method: "post",
      action: `/app/reviews/${editingReview.id}/actions`,
    });
  }, [editingReview, fetcher, actionSource]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingReview) return;

    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("actionSource", actionSource);

    fetcher.submit(formData, {
      method: "post",
      action: `/app/reviews/${deletingReview.id}/actions`,
    });
  }, [deletingReview, fetcher, actionSource]);

  const handleEditModalClose = useCallback(() => {
    setEditingReview(null);
    setError(null);
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setDeletingReview(null);
    setError(null);
  }, []);

  return (
    <BlockStack gap="600">
      {error && (
        <Box padding="400">
          <InlineError message={error} fieldID="review-error" />
        </Box>
      )}

      <EditReviewModal
        review={editingReview}
        isOpen={!!editingReview}
        isSubmitting={fetcher.state === "submitting"}
        onClose={handleEditModalClose}
        onSubmit={handleEditSubmit}
      />

      <DeleteReviewModal
        review={deletingReview}
        isOpen={!!deletingReview}
        isSubmitting={fetcher.state === "submitting"}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
      />

      {reviews && reviews.length > 0 ? (
        <BlockStack gap="500">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isSubmitting={fetcher.state === "submitting"}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onChangeStatus={handleChangeStatus}
            />
          ))}
        </BlockStack>
      ) : (
        <div
          style={{
            padding: "var(--p-space-1200)",
            background: "var(--p-color-bg-surface)",
            borderRadius: "var(--p-border-radius-400)",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--p-color-border-subdued)",
          }}
        >
          <p style={{ paddingInline: "var(--p-space-400)", textAlign: "center" }}>
            <Text as="span" variant="bodyLg" fontWeight="medium" tone="subdued">
              No reviews yet. Be the first to review!
            </Text>
          </p>
        </div>
      )}
    </BlockStack>
  );
}
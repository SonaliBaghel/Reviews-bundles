import {
  Box,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Icon,
  Button,
  ButtonGroup,
  Modal,
  TextField,
  Select,
  InlineGrid,
  InlineError,
} from "@shopify/polaris";
import { StarFilledIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useSubmit, useFetcher } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";

export interface ReviewImage {
  createdAt: any;
  id: string;
  url: string;
  altText: string | null;
  order: number | null;
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
  createdAt: string;
  updatedAt: string;
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
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    rating: "5",
    author: "",
    email: "",
    status: "pending",
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [currentImages, setCurrentImages] = useState<ReviewImage[]>([]);

  useEffect(() => {
    if (editingReview) {
      setEditFormData({
        title: editingReview.title || "",
        content: editingReview.content,
        rating: editingReview.rating.toString(),
        author: editingReview.author,
        email: editingReview.email || "",
        status: editingReview.status,
      });
      setSelectedStatus(editingReview.status);
      setCurrentImages(editingReview.images || []);
      setImagesToRemove([]);
      setError(null);
    }
  }, [editingReview]);

  useEffect(() => {
    if (fetcher.state === "idle") {
      console.log("Fetcher state idle, data:", fetcher.data);

      if (fetcher.data?.success) {
        console.log("Operation successful:", fetcher.data.message);
        setError(null);

        if (editingReview) {
          setEditingReview(null);
        }
        if (deletingReview) {
          setDeletingReview(null);
        }
        if (onReviewsUpdate) {
          console.log("Calling onReviewsUpdate callback");
          setTimeout(onReviewsUpdate, 100);
        }
      } else if (fetcher.data?.error) {
        console.error("Operation failed:", fetcher.data.error);
        setError(fetcher.data.error);
      }
    }
  }, [fetcher.state, fetcher.data, editingReview, deletingReview, onReviewsUpdate]);

  const handleChangeStatus = useCallback((reviewId: string, newStatus: string) => {
    console.log("Changing status for review:", reviewId, "to:", newStatus, "from:", actionSource);
    
    const formData = new FormData();
    formData.append("status", newStatus);
    formData.append("actionSource", actionSource);
    
    console.log("Submitting status change with actionSource:", actionSource);
    
    actualSubmit(formData, {
      method: "post",
      action: `/app/reviews/${reviewId}/status`,
    });
  }, [actionSource, actualSubmit]);

  const handleEdit = useCallback((review: Review) => {
    console.log("Edit clicked for review:", review.id);
    setEditingReview(review);
    setError(null);
  }, []);

  const handleDelete = useCallback((review: Review) => {
    console.log("Delete clicked for review:", review.id);
    setDeletingReview(review);
    setError(null);
  }, []);

  const handleEditSubmit = useCallback(() => {
    if (!editingReview) return;

    console.log("Submitting edit for review:", editingReview.id, "from:", actionSource);
    console.log("Images to remove:", imagesToRemove.length);

    const formData = new FormData();
    formData.append("intent", "edit");
    formData.append("title", editFormData.title);
    formData.append("content", editFormData.content);
    formData.append("rating", editFormData.rating);
    formData.append("author", editFormData.author);
    formData.append("email", editFormData.email);
    formData.append("status", selectedStatus || editFormData.status);
    formData.append("actionSource", actionSource);

    imagesToRemove.forEach((imageId) => {
      formData.append("imagesToRemove[]", imageId);
    });

    console.log("Submitting to:", `/app/reviews/${editingReview.id}/actions`);

    fetcher.submit(formData, {
      method: "post",
      action: `/app/reviews/${editingReview.id}/actions`,
    });
  }, [editingReview, editFormData, selectedStatus, imagesToRemove, fetcher, actionSource]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingReview) return;

    console.log("Confirming delete for review:", deletingReview.id, "from:", actionSource);
    console.log("Submitting to:", `/app/reviews/${deletingReview.id}/actions`);

    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("actionSource", actionSource);

    fetcher.submit(formData, {
      method: "post",
      action: `/app/reviews/${deletingReview.id}/actions`,
    });
  }, [deletingReview, fetcher, actionSource]);

  const getStatusBadgeTone = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "critical";
      case "pending":
      default:
        return "attention";
    }
  };

  const handleEditModalClose = useCallback(() => {
    setEditingReview(null);
    setError(null);
    setImagesToRemove([]);
    setCurrentImages([]);
    setSelectedStatus("");
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setDeletingReview(null);
    setError(null);
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setImagesToRemove((prev) => [...prev, imageId]);
    setCurrentImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  const getStatusOptions = (currentStatus: string) => {
    const allOptions = [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
    ];

    return allOptions.filter((option) => option.value !== currentStatus);
  };

  const handleStatusChange = useCallback((value: string) => {
    console.log("Status changed to:", value);
    setSelectedStatus(value);
  }, []);

  return (
    <BlockStack gap="600">
      {error && (
        <Box padding="400">
          <InlineError message={error} fieldID="review-error" />
        </Box>
      )}

      <Modal
        open={!!editingReview}
        onClose={handleEditModalClose}
        title="Edit Review"
        primaryAction={{
          content: "Save Changes",
          onAction: handleEditSubmit,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleEditModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="500">
            <TextField
              label="Title"
              value={editFormData.title}
              onChange={(value) =>
                setEditFormData((prev) => ({ ...prev, title: value }))
              }
              autoComplete="off"
              disabled={fetcher.state === "submitting"}
            />

            <TextField
              label="Review Content"
              value={editFormData.content}
              onChange={(value) =>
                setEditFormData((prev) => ({ ...prev, content: value }))
              }
              multiline={4}
              autoComplete="off"
              disabled={fetcher.state === "submitting"}
            />

            <InlineGrid columns={2} gap="400">
              <Select
                label="Rating"
                options={[
                  { label: "⭐ 1 Star", value: "1" },
                  { label: "⭐⭐ 2 Stars", value: "2" },
                  { label: "⭐⭐⭐ 3 Stars", value: "3" },
                  { label: "⭐⭐⭐⭐ 4 Stars", value: "4" },
                  { label: "⭐⭐⭐⭐⭐ 5 Stars", value: "5" },
                ]}
                value={editFormData.rating}
                onChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, rating: value }))
                }
                disabled={fetcher.state === "submitting"}
              />

              <Select
                label="Change Status"
                options={getStatusOptions(editFormData.status)}
                value={selectedStatus}
                onChange={handleStatusChange}
                disabled={fetcher.state === "submitting"}
                helpText={`Current status: ${
                  editFormData.status.charAt(0).toUpperCase() +
                  editFormData.status.slice(1)
                }`}
                placeholder={`Select new status`}
              />
            </InlineGrid>

            <InlineGrid columns={2} gap="400">
              <TextField
                label="Author Name"
                value={editFormData.author}
                onChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, author: value }))
                }
                autoComplete="off"
                disabled={fetcher.state === "submitting"}
              />

              <TextField
                label="Email"
                value={editFormData.email}
                onChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, email: value }))
                }
                type="email"
                autoComplete="off"
                disabled={fetcher.state === "submitting"}
              />
            </InlineGrid>

            <Box>
              <Text as="h4" variant="headingSm" fontWeight="medium">
                Review Images
              </Text>
              <BlockStack gap="400">
                {currentImages.length > 0 ? (
                  <Box>
                    <Text
                      as="p"
                      variant="bodySm"
                      fontWeight="medium"
                      tone="subdued"
                    >
                      Images ({currentImages.length})
                      {imagesToRemove.length > 0 && (
                        <Text as="span" variant="bodySm" tone="critical">
                          {" "}
                          ({imagesToRemove.length} marked for removal)
                        </Text>
                      )}
                    </Text>
                    <InlineStack gap="300" wrap>
                      {currentImages.map((image, index) => (
                        <Box
                          key={image.id}
                          position="relative"
                          style={{
                             textAlign: "right",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: imagesToRemove.includes(image.id)
                              ? "3px solid var(--p-color-border-critical)"
                              : "1px solid var(--p-color-border-subdued)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.2s ease-in-out",
                            opacity: imagesToRemove.includes(image.id) ? 0.4 : 1,
                            cursor: "default",
                            "&:hover": !imagesToRemove.includes(image.id) ? {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                transform: 'translateY(-1px)',
                            } : {},
                          }}
                        >
                          <Button
                            size="slim"
                            tone="critical"
                            variant="primary"
                            onClick={() => handleRemoveImage(image.id)}
                            disabled={fetcher.state === "submitting"}
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              minHeight: "24px",
                              height: "24px",
                              width: "24px",
                              padding: "0",
                              borderRadius: "50%",
                              fontSize: "12px",
                              fontWeight: "bold",
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 10,
                              visibility: imagesToRemove.includes(image.id) ? 'hidden' : 'visible'
                            }}
                          >
                            ×
                          </Button>
                           <img
                            src={image.url}
                            alt={image.altText || `Review image ${index + 1}`}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </Box>
                      ))}
                    </InlineStack>
                  </Box>
                ) : (
                  <Box
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <Text
                      as="p"
                      variant="bodySm"
                      tone="subdued"
                      alignment="center"
                    >
                      No images attached to this review.
                    </Text>
                  </Box>
                )}

                <Box padding="200">
                  <Text
                    as="p"
                    variant="bodySm"
                    tone="subdued"
                    alignment="center"
                  >
                   You can only remove existing images from this editor.
                  </Text>
                </Box>
              </BlockStack>
            </Box>

            {fetcher.state === "submitting" && (
              <Box
                padding="300"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <Text
                  as="p"
                  variant="bodySm"
                  tone="subdued"
                  alignment="center"
                >
                  💾 Saving changes...
                </Text>
              </Box>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={!!deletingReview}
        onClose={handleDeleteModalClose}
        title="Delete Review"
        primaryAction={{
          content: "Delete Review",
          onAction: handleDeleteConfirm,
          destructive: true,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleDeleteModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              Are you sure you want to delete this review? This action cannot be
              undone.
            </Text>
            {deletingReview && (
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="200"
              >
                <Text as="p" variant="bodySm" fontWeight="medium">
                  {deletingReview.title || "No Title"}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  by {deletingReview.author} • Rating: {deletingReview.rating}/5
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {deletingReview.content.substring(0, 100)}...
                </Text>
              </Box>
            )}

            {fetcher.state === "submitting" && (
              <Box padding="200">
                <Text
                  as="p"
                  variant="bodySm"
                  tone="subdued"
                  alignment="center"
                >
                  Deleting review...
                </Text>
              </Box>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {reviews && reviews.length > 0 ? (
        <BlockStack gap="500">
          {reviews.map((review) => (
            <Box
              key={review.id}
              padding="600"
              background="bg-surface"
              borderRadius="400"
              onClick={() => handleEdit(review)}
              style={{
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                border: "1px solid var(--p-color-border-subdued)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--p-color-bg-surface-hover)";
                e.currentTarget.style.boxShadow =
                  "0 3px 8px rgba(0, 0, 0, 0.12)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--p-color-bg-surface)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <BlockStack gap="500">
                <InlineStack align="space-between" blockAlign="start">
                  <BlockStack gap="300">
                    <InlineStack
                      gap="300"
                      blockAlign="center"
                      wrap={false}
                    >
                      <Text
                        as="h3"
                        variant="headingMd"
                        fontWeight="semibold"
                      >
                        {review.title || "Untitled Review"}
                      </Text>
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={StarFilledIcon} tone="warning" />
                        <Text as="span" variant="bodyMd" fontWeight="medium">
                          {`${review.rating}/5`}
                        </Text>
                      </InlineStack>
                      <Badge
                        tone={getStatusBadgeTone(review.status)}
                        size="large"
                      >
                        {(review.status || "pending").charAt(0).toUpperCase() +
                          (review.status || "pending").slice(1)}
                      </Badge>
                      {review.isBundleReview && (
                        <Badge tone="info" size="large">
                          Syndicated
                        </Badge>
                      )}
                    </InlineStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      by {review.author} •{" "}
                      {(() => {
                        const dateValue = review.createdAt || "";
                        try {
                          const date = new Date(dateValue);
                          return isNaN(date.getTime())
                            ? ""
                            : date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              });
                        } catch (e) {
                          return "";
                        }
                      })()}
                      {review.email && review.email !== "" && ` • ${review.email}`}
                    </Text>
                  </BlockStack>

                  <ButtonGroup>
                    {((review.status || "pending") === "pending" ||
                      (review.status || "pending") === "rejected") && (
                      <Button
                        size="slim"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeStatus(review.id, "approved");
                        }}
                        disabled={fetcher.state === "submitting"}
                      >
                        Approve
                      </Button>
                    )}

                    {(review.status || "pending") === "approved" && (
                      <Button
                        size="slim"
                        tone="critical"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeStatus(review.id, "rejected");
                        }}
                        disabled={fetcher.state === "submitting"}
                      >
                        Reject
                      </Button>
                    )}

                    <Button
                      icon={DeleteIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(review);
                      }}
                      variant="tertiary"
                      tone="critical"
                      size="slim"
                      disabled={fetcher.state === "submitting"}
                    >
                      Delete
                    </Button>
                  </ButtonGroup>
                </InlineStack>

                <Box paddingBlockStart="200">
                  <Text
                    as="p"
                    variant="bodyLg"
                    tone="subdued"
                    lineHeight="1.6"
                  >
                    {review.content}
                  </Text>
                </Box>

                {review.images && review.images.length > 0 && (
                  <Box paddingBlockStart="400">
                    <Text
                      as="p"
                      variant="bodySm"
                      fontWeight="medium"
                      tone="subdued"
                    >
                      Images ({review.images.length})
                    </Text>
                    <InlineStack gap="300" wrap>
                      {review.images.map((image, index) => (
                        <Box
                          key={image.id || index}
                          style={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            border:
                              "1px solid var(--p-color-border-subdued)",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <img
                            src={image.url}
                            alt={image.altText || `Review image ${index + 1}`}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </Box>
                      ))}
                    </InlineStack>
                  </Box>
                )}
              </BlockStack>
            </Box>
          ))}
        </BlockStack>
      ) : (
        <Box
          padding="1200"
          background="bg-surface"
          borderRadius="400"
          style={{
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--p-color-border-subdued)",
          }}
        >
          <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
            No reviews yet. Be the first to review!
          </Text>
        </Box>
      )}
    </BlockStack>
  );
}
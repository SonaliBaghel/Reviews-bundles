import {
    Box,
    Text,
    BlockStack,
    InlineStack,
    Badge,
    Icon,
    Button,
    ButtonGroup,
} from "@shopify/polaris";
import { StarFilledIcon, DeleteIcon } from "@shopify/polaris-icons";
import { STATUS_BADGE_TONE_MAP } from "../utils/constants";
import type { Review } from "./ReviewList";

interface ReviewCardProps {
    review: Review;
    isSubmitting: boolean;
    onEdit: (review: Review) => void;
    onDelete: (review: Review) => void;
    onChangeStatus: (reviewId: string, newStatus: string) => void;
}

export default function ReviewCard({
    review,
    isSubmitting,
    onEdit,
    onDelete,
    onChangeStatus,
}: ReviewCardProps) {
    const formatDate = (dateValue: string) => {
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
    };

    return (
        <Box
            padding="600"
            background="bg-surface"
            borderRadius="400"
            onClick={() => onEdit(review)}
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
                e.currentTarget.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.12)";
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--p-color-bg-surface)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <BlockStack gap="500">
                <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="300">
                        <InlineStack gap="300" blockAlign="center" wrap={false}>
                            <Text as="h3" variant="headingMd" fontWeight="semibold">
                                {review.title || "Untitled Review"}
                            </Text>
                            <InlineStack gap="100" blockAlign="center">
                                <Icon source={StarFilledIcon} tone="warning" />
                                <Text as="span" variant="bodyMd" fontWeight="medium">
                                    {`${review.rating}/5`}
                                </Text>
                            </InlineStack>
                            <Badge
                                tone={STATUS_BADGE_TONE_MAP[review.status] || "attention"}
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
                            by {review.author} • {formatDate(review.createdAt || "")}
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
                                        onChangeStatus(review.id, "approved");
                                    }}
                                    disabled={isSubmitting}
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
                                    onChangeStatus(review.id, "rejected");
                                }}
                                disabled={isSubmitting}
                            >
                                Reject
                            </Button>
                        )}

                        <Button
                            icon={DeleteIcon}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(review);
                            }}
                            variant="tertiary"
                            tone="critical"
                            size="slim"
                            disabled={isSubmitting}
                        >
                            Delete
                        </Button>
                    </ButtonGroup>
                </InlineStack>

                <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyLg" tone="subdued" lineHeight="1.6">
                        {review.content}
                    </Text>
                </Box>

                {review.images && review.images.length > 0 && (
                    <Box paddingBlockStart="400">
                        <Text as="p" variant="bodySm" fontWeight="medium" tone="subdued">
                            Images ({review.images.length})
                        </Text>
                        <InlineStack gap="300" wrap>
                            {review.images.map((image, index) => (
                                <Box
                                    key={image.id || index}
                                    style={{
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        border: "1px solid var(--p-color-border-subdued)",
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
    );
}

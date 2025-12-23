import {
    Modal,
    BlockStack,
    Box,
    Text,
} from "@shopify/polaris";
import type { Review } from "./ReviewList";

interface DeleteReviewModalProps {
    review: Review | null;
    isOpen: boolean;
    isSubmitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteReviewModal({
    review,
    isOpen,
    isSubmitting,
    onClose,
    onConfirm,
}: DeleteReviewModalProps) {
    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Delete Review"
            primaryAction={{
                content: "Delete Review",
                onAction: onConfirm,
                destructive: true,
                loading: isSubmitting,
            }}
            secondaryActions={[
                {
                    content: "Cancel",
                    onAction: onClose,
                },
            ]}
        >
            <Modal.Section>
                <BlockStack gap="400">
                    <Text as="p" variant="bodyMd">
                        Are you sure you want to delete this review? This action cannot be
                        undone.
                    </Text>
                    {review && (
                        <Box
                            padding="400"
                            background="bg-surface-secondary"
                            borderRadius="200"
                        >
                            <Text as="p" variant="bodySm" fontWeight="medium">
                                {review.title || "No Title"}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                                by {review.author} • Rating: {review.rating}/5
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                                {review.content.substring(0, 100)}...
                            </Text>
                        </Box>
                    )}

                    {isSubmitting && (
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
    );
}

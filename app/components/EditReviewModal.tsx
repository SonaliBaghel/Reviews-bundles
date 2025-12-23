import {
    Modal,
    TextField,
    Select,
    InlineGrid,
    BlockStack,
    Box,
    Text,
    Button,
    InlineStack,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { RATING_OPTIONS, STATUS_OPTIONS } from "../utils/constants";
import type { Review, ReviewImage } from "./ReviewList";

interface EditReviewModalProps {
    review: Review | null;
    isOpen: boolean;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void;
}

export default function EditReviewModal({
    review,
    isOpen,
    isSubmitting,
    onClose,
    onSubmit,
}: EditReviewModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        rating: "5",
        author: "",
        email: "",
        status: "pending",
    });
    const [selectedStatus, setSelectedStatus] = useState("");
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
    const [currentImages, setCurrentImages] = useState<ReviewImage[]>([]);

    useEffect(() => {
        if (review) {
            setFormData({
                title: review.title || "",
                content: review.content,
                rating: review.rating.toString(),
                author: review.author,
                email: review.email || "",
                status: review.status,
            });
            setSelectedStatus(review.status);
            setCurrentImages(review.images || []);
            setImagesToRemove([]);
        }
    }, [review]);

    const handleRemoveImage = useCallback((imageId: string) => {
        setImagesToRemove((prev) => [...prev, imageId]);
        setCurrentImages((prev) => prev.filter((img) => img.id !== imageId));
    }, []);

    const handleSubmit = useCallback(() => {
        if (!review) return;

        const submitData = new FormData();
        submitData.append("intent", "edit");
        submitData.append("title", formData.title);
        submitData.append("content", formData.content);
        submitData.append("rating", formData.rating);
        submitData.append("author", formData.author);
        submitData.append("email", formData.email);
        submitData.append("status", selectedStatus || formData.status);

        imagesToRemove.forEach((imageId) => {
            submitData.append("imagesToRemove[]", imageId);
        });

        onSubmit(submitData);
    }, [review, formData, selectedStatus, imagesToRemove, onSubmit]);

    const getStatusOptions = (currentStatus: string) => {
        return STATUS_OPTIONS.filter((option) => option.value !== currentStatus);
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Edit Review"
            primaryAction={{
                content: "Save Changes",
                onAction: handleSubmit,
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
                <BlockStack gap="500">
                    <TextField
                        label="Title"
                        value={formData.title}
                        onChange={(value) =>
                            setFormData((prev) => ({ ...prev, title: value }))
                        }
                        autoComplete="off"
                        disabled={isSubmitting}
                    />

                    <TextField
                        label="Review Content"
                        value={formData.content}
                        onChange={(value) =>
                            setFormData((prev) => ({ ...prev, content: value }))
                        }
                        multiline={4}
                        autoComplete="off"
                        disabled={isSubmitting}
                    />

                    <InlineGrid columns={2} gap="400">
                        <Select
                            label="Rating"
                            options={RATING_OPTIONS}
                            value={formData.rating}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, rating: value }))
                            }
                            disabled={isSubmitting}
                        />

                        <Select
                            label="Change Status"
                            options={getStatusOptions(formData.status)}
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            disabled={isSubmitting}
                            helpText={`Current status: ${formData.status.charAt(0).toUpperCase() +
                                formData.status.slice(1)
                                }`}
                            placeholder="Select new status"
                        />
                    </InlineGrid>

                    <InlineGrid columns={2} gap="400">
                        <TextField
                            label="Author Name"
                            value={formData.author}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, author: value }))
                            }
                            autoComplete="off"
                            disabled={isSubmitting}
                        />

                        <TextField
                            label="Email"
                            value={formData.email}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, email: value }))
                            }
                            type="email"
                            autoComplete="off"
                            disabled={isSubmitting}
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
                                                }}
                                            >
                                                <Button
                                                    size="slim"
                                                    tone="critical"
                                                    variant="primary"
                                                    onClick={() => handleRemoveImage(image.id)}
                                                    disabled={isSubmitting}
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
                                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        zIndex: 10,
                                                        visibility: imagesToRemove.includes(image.id)
                                                            ? "hidden"
                                                            : "visible",
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

                    {isSubmitting && (
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
    );
}

import {
    Modal, BlockStack, Text, Banner
} from "@shopify/polaris";

interface DeleteBundleModalProps {
    activeModal: boolean;
    modalType: 'create' | 'edit' | 'delete';
    handleModalClose: () => void;
    currentBundleName?: string;
    handleFormSubmit: (intent: string, bundleId?: string) => void;
    currentBundleId?: string;
    isSubmitting: boolean;
}

export function DeleteBundleModal({
    activeModal,
    modalType,
    handleModalClose,
    currentBundleName,
    handleFormSubmit,
    currentBundleId,
    isSubmitting
}: DeleteBundleModalProps) {
    return (
        <Modal
            open={activeModal && modalType === 'delete'}
            onClose={handleModalClose}
            title="Delete Review Bundle"
            primaryAction={{
                content: 'Delete Bundle',
                onAction: () => handleFormSubmit('delete-bundle', currentBundleId),
                destructive: true,
                loading: isSubmitting,
            }}
            secondaryActions={[
                {
                    content: 'Cancel',
                    onAction: handleModalClose,
                },
            ]}
        >
            <Modal.Section>
                <BlockStack gap="400">
                    <Text as="p" variant="bodyLg">
                        Are you sure you want to delete the bundle **{currentBundleName}**?
                    </Text>
                    <Banner tone="warning">
                        This action will **only delete the bundle configuration**. Existing reviews and syndicated links will remain in the database, but no further syndication will occur for these products.
                    </Banner>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}

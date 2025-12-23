import {
    Modal, BlockStack, TextField, Banner, Text, Card, Box, ResourceList, ResourceItem, InlineGrid, Badge, Checkbox, InlineStack, Button, Thumbnail
} from "@shopify/polaris";
import { MinusIcon } from '@shopify/polaris-icons';

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    imageUrl: string | null;
    numericId: string;
}

interface BundleFormModalProps {
    activeModal: boolean;
    modalType: 'create' | 'edit' | 'delete';
    handleModalClose: () => void;
    currentBundleName?: string;
    bundleName: string;
    setBundleName: (name: string) => void;
    handleFormSubmit: (intent: string, bundleId?: string) => void;
    isSubmitting: boolean;
    selectedProductGids: string[];
    productMap: Map<string, ShopifyProduct>;
    productSearchTerm: string;
    setProductSearchTerm: (term: string) => void;
    filteredProducts: ShopifyProduct[];
    handleProductSelection: (id: string) => void;
    currentBundleId?: string;
    getNumericProductId: (gid: string) => string;
}

export function BundleFormModal({
    activeModal,
    modalType,
    handleModalClose,
    currentBundleName,
    bundleName,
    setBundleName,
    handleFormSubmit,
    isSubmitting,
    selectedProductGids,
    productMap,
    productSearchTerm,
    setProductSearchTerm,
    filteredProducts,
    handleProductSelection,
    currentBundleId,
    getNumericProductId
}: BundleFormModalProps) {
    const getProductMedia = (product: ShopifyProduct) => (
        <Box paddingInlineEnd="200">
            <Thumbnail
                source={product.imageUrl || `https://placehold.co/80x80/f6f6f7/6d7175?text=${encodeURIComponent(product.title.split(' ')[0])}`}
                alt={`Image of ${product.title}`}
                size="small"
            />
        </Box>
    );

    return (
        <Modal
            open={activeModal && (modalType === 'create' || modalType === 'edit')}
            onClose={handleModalClose}
            title={modalType === 'create' ? "Create New Review Bundle" : `Edit Bundle: ${currentBundleName}`}
            size="large"
            primaryAction={{
                content: modalType === 'create' ? 'Create Bundle' : 'Save Changes',
                onAction: () => handleFormSubmit(`${modalType}-bundle`, currentBundleId),
                loading: isSubmitting,
                disabled: !bundleName.trim() || selectedProductGids.length < 2 || isSubmitting
            }}
            secondaryActions={[
                {
                    content: 'Cancel',
                    onAction: handleModalClose,
                },
            ]}
        >
            <Modal.Section>
                <BlockStack gap="500">
                    <TextField
                        label="Bundle Name"
                        value={bundleName}
                        onChange={setBundleName}
                        helpText="A unique name for this review group (e.g., 'Summer Collection')"
                        autoComplete="off"
                        disabled={isSubmitting}
                    />

                    <Banner tone="info">
                        <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                                Select the products to be included in this bundle. The **first product selected** will be the default Bundle Product ID. You must select at least **2 products**.
                            </Text>
                            {selectedProductGids.length > 0 && (
                                <Text as="p" variant="bodySm" fontWeight="semibold" tone="success">
                                    Main Product: {productMap.get(selectedProductGids[0])?.title || 'Selecting...'}
                                </Text>
                            )}
                        </BlockStack>
                    </Banner>

                    {/* Product Picker */}
                    <Card padding="0">
                        <Box padding="400">
                            <TextField
                                label="Search Products to Include"
                                value={productSearchTerm}
                                onChange={setProductSearchTerm}
                                autoComplete="off"
                                disabled={isSubmitting}
                                placeholder="Search by title or ID..."
                            />
                        </Box>
                        <ResourceList
                            resourceName={{ singular: 'product', plural: 'products' }}
                            items={filteredProducts}
                            renderItem={(product) => {
                                const isSelected = selectedProductGids.includes(product.id);
                                const isMainProduct = isSelected && selectedProductGids[0] === product.id;

                                return (
                                    <ResourceItem
                                        id={product.id}
                                        media={getProductMedia(product)}
                                        onClick={() => handleProductSelection(product.id)}
                                    >
                                        <InlineGrid columns="1fr auto" gap="400" alignItems="center">
                                            <BlockStack gap="100">
                                                <Text as="h3" variant="bodyLg" fontWeight="semibold">
                                                    {product.title}
                                                </Text>
                                                <Text as="p" variant="bodyMd" tone="subdued">
                                                    ID: {product.numericId}
                                                </Text>
                                            </BlockStack>
                                            <InlineStack gap="200">
                                                {isMainProduct && <Badge tone="info">Main ID</Badge>}
                                                <Checkbox
                                                    label=""
                                                    labelHidden
                                                    checked={isSelected}
                                                    onChange={() => handleProductSelection(product.id)}
                                                />
                                            </InlineStack>
                                        </InlineGrid>
                                    </ResourceItem>
                                );
                            }}
                        />
                    </Card>

                    <Box padding="400" background="bg-fill-secondary" borderRadius="200">
                        <Text as="h4" variant="bodyMd" fontWeight="semibold">
                            Selected Products ({selectedProductGids.length})
                        </Text>
                        <BlockStack gap="100">
                            {selectedProductGids.map(gid => (
                                <InlineStack key={gid} align="space-between" blockAlign="center">
                                    <Text as="span" variant="bodySm">
                                        {productMap.get(gid)?.title || getNumericProductId(gid)}
                                    </Text>
                                    <Button
                                        icon={MinusIcon}
                                        onClick={() => handleProductSelection(gid)}
                                        size="slim"
                                        variant="plain"
                                        tone="critical"
                                    />
                                </InlineStack>
                            ))}
                        </BlockStack>
                    </Box>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}

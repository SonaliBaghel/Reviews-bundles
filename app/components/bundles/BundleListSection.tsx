import {
    Card, Box, InlineStack, Text, Button, Divider, ResourceList, ResourceItem, Icon, Badge, BlockStack
} from "@shopify/polaris";
import { PlusIcon, FolderIcon } from '@shopify/polaris-icons';

interface ReviewBundle {
    id: string;
    name: string;
    bundleProductId: string;
    productIds: string[];
    createdAt: string;
}

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    imageUrl: string | null;
    numericId: string;
}

interface BundleListSectionProps {
    bundles: ReviewBundle[];
    isSubmitting: boolean;
    handleModalOpen: (type: 'create' | 'edit' | 'delete', bundle: ReviewBundle | null) => void;
    getProductsForBundle: (bundle: ReviewBundle) => ShopifyProduct[];
}

export function BundleListSection({
    bundles,
    isSubmitting,
    handleModalOpen,
    getProductsForBundle
}: BundleListSectionProps) {
    return (
        <Card padding="0">
            <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg" fontWeight="semibold">
                        Existing Review Bundles ({bundles.length})
                    </Text>
                    <Button
                        variant="primary"
                        icon={PlusIcon}
                        onClick={() => handleModalOpen('create', null)}
                        disabled={isSubmitting}
                    >
                        Create New Bundle
                    </Button>
                </InlineStack>
                <Box paddingBlockStart="400">
                    <Divider />
                </Box>
            </Box>

            {bundles.length > 0 ? (
                <ResourceList
                    resourceName={{ singular: 'bundle', plural: 'bundles' }}
                    items={bundles}
                    renderItem={(bundle) => {
                        const productsInBundle = getProductsForBundle(bundle);
                        const mainProduct = productsInBundle.find(p => p.numericId === bundle.bundleProductId);
                        const otherProductsCount = productsInBundle.length - 1;

                        return (
                            <ResourceItem
                                id={bundle.id}
                                url="#"
                                media={
                                    <Box background="bg-fill-tertiary" borderRadius="300" padding="300">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon source={FolderIcon} tone="base" />
                                        </div>
                                    </Box>
                                }
                                accessibilityLabel={`View bundle ${bundle.name}`}
                                shortcutActions={[
                                    {
                                        content: 'Edit',
                                        onAction: () => handleModalOpen('edit', bundle),
                                        disabled: isSubmitting
                                    },
                                    {
                                        content: 'Delete',
                                        onAction: () => handleModalOpen('delete', bundle),
                                        disabled: isSubmitting
                                    }
                                ]}
                            >
                                <BlockStack gap="100">
                                    <Text as="h3" variant="bodyLg" fontWeight="semibold">
                                        {bundle.name}
                                    </Text>
                                    <InlineStack gap="100" blockAlign="center" wrap={false}>
                                        <Badge size="small" tone="success">
                                            {`Main: ${mainProduct?.title || 'Unknown Product'}`}
                                        </Badge>
                                        {otherProductsCount > 0 && (
                                            <Badge size="small">
                                                {`+${otherProductsCount} ${otherProductsCount === 1 ? 'Product' : 'Products'}`}
                                            </Badge>
                                        )}
                                    </InlineStack>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        Products: {productsInBundle.map(p => p.title).join(', ')}
                                    </Text>
                                </BlockStack>
                            </ResourceItem>
                        );
                    }}
                />
            ) : (
                <Box padding="600">
                    <BlockStack gap="400" align="center">
                        <Icon source={FolderIcon} tone="subdued" />
                        <Text as="h3" variant="headingMd" alignment="center">
                            No Review Bundles configured yet
                        </Text>
                        <Button
                            onClick={() => handleModalOpen('create', null)}
                            disabled={isSubmitting}
                            icon={PlusIcon}
                            variant="primary"
                        >
                            Create Your First Bundle
                        </Button>
                    </BlockStack>
                </Box>
            )}
        </Card>
    );
}

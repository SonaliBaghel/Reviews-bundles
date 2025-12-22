import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  BlockStack, 
  InlineStack, 
  Button, 
  ResourceList, 
  ResourceItem,
  TextField,
  Modal,
  Toast,
  Link as PolarisLink,
  Checkbox,
  Box,
  Badge,
  Thumbnail,
  Divider, 
  Banner,
  Icon,
  InlineGrid
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData, json, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useCallback, useState, useEffect } from 'react';
import { MinusIcon, PlusIcon, FolderIcon } from '@shopify/polaris-icons';

import db from "../db.server"; 
import { authenticate } from "../shopify.server";

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

interface LoaderData {
  products: ShopifyProduct[];
  bundles: ReviewBundle[];
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

const getNumericProductId = (gid: string): string => {
  const parts = gid.split('/');
  return parts[parts.length - 1];
};

const getGidProductId = (numericId: string): string => {
  return `gid://shopify/Product/${numericId}`;
};


export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  const bundles = await (db as any).reviewBundle.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const productGql = `
    query getProducts {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  const shopifyResponse = await admin.graphql(productGql);
  const data = await shopifyResponse.json();
  const shopifyProducts: ShopifyProduct[] = (data.data?.products?.edges || []).map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    handle: edge.node.handle,
    imageUrl: edge.node.images?.edges?.[0]?.node?.url || null,
    numericId: getNumericProductId(edge.node.id)
  }));

  const products: ShopifyProduct[] = shopifyProducts;

  const serializableBundles: ReviewBundle[] = bundles.map((b: any) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    productIds: b.productIds.split(','),
  }));


  return json({ products: products, bundles: serializableBundles });
}


export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'create-bundle' || intent === 'edit-bundle') {
      const bundleName = formData.get('bundleName') as string;
      const selectedProductGids = formData.getAll('productIds[]') as string[];
      const bundleId = formData.get('bundleId') as string | null;
      
      const bundleProductIdGid = selectedProductGids[0]; 

      if (!bundleName || selectedProductGids.length < 2) {
        return json({ success: false, error: "A bundle must have a name and include at least 2 products." }, { status: 400 });
      }

      const numericProductIds = selectedProductGids.map(getNumericProductId);
      const numericBundleProductId = getNumericProductId(bundleProductIdGid);
      
      const productIdsString = numericProductIds.join(',');

      if (intent === 'create-bundle') {
        const newBundle = await (db as any).reviewBundle.create({
          data: {
            name: bundleName,
            bundleProductId: numericBundleProductId,
            productIds: productIdsString,
          }
        });
        return json({ success: true, message: `Bundle '${newBundle.name}' created successfully.` });
      } else if (intent === 'edit-bundle' && bundleId) {
        const updatedBundle = await (db as any).reviewBundle.update({
          where: { id: bundleId },
          data: {
            name: bundleName,
            bundleProductId: numericBundleProductId,
            productIds: productIdsString,
          }
        });
        return json({ success: true, message: `Bundle '${updatedBundle.name}' updated successfully.` });
      }

    } else if (intent === 'delete-bundle') {
      const bundleId = formData.get('bundleId') as string;
      await (db as any).reviewBundle.delete({ where: { id: bundleId } });
      return json({ success: true, message: "Bundle deleted successfully." });
    }

    return json({ success: false, error: "Invalid intent or missing data." }, { status: 400 });
  } catch (error: any) {
    console.error("Error managing bundle:", error);
    if (error.code === 'P2002') {
        return json({ success: false, error: `Bundle creation failed. The name or the selected main product might already be in use.` }, { status: 409 });
    }
    return json({ success: false, error: error.message || "Failed to process bundle action." }, { status: 500 });
  }
}


export default function BundleReviewsPage() {
  const { products, bundles } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const isSubmitting = navigation.state === 'submitting';
  
  const [activeModal, setActiveModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [currentBundle, setCurrentBundle] = useState<ReviewBundle | null>(null);
  
  const [bundleName, setBundleName] = useState('');
  const [selectedProductGids, setSelectedProductGids] = useState<string[]>([]);
  const [activeToast, setActiveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const productMap = new Map(products.map(p => [p.id, p]));

  useEffect(() => {
    if (actionData) {
      setToastMessage(actionData.message || actionData.error || 'Action completed.');
      setToastError(!actionData.success);
      if (actionData.success) {
        setActiveModal(false); 
        setBundleName('');
        setSelectedProductGids([]);
        setCurrentBundle(null);
      }
      setActiveToast(true);
    }
  }, [actionData]);

  const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);
  
  const handleModalOpen = (type: 'create' | 'edit' | 'delete', bundle: ReviewBundle | null = null) => {
    setModalType(type);
    setCurrentBundle(bundle);
    
    if (type === 'edit' && bundle) {
      setBundleName(bundle.name);
      const gids = bundle.productIds.map(getGidProductId);
      setSelectedProductGids(gids);
    } else if (type === 'create') {
      setBundleName('');
      setSelectedProductGids([]);
    }
    
    setActiveModal(true);
  };
  
  const handleModalClose = useCallback(() => {
    setActiveModal(false);
    setBundleName('');
    setSelectedProductGids([]);
    setCurrentBundle(null);
    setProductSearchTerm('');
  }, []);

  const handleProductSelection = useCallback((productIdGid: string) => {
    setSelectedProductGids((prev) => 
      prev.includes(productIdGid)
        ? prev.filter(id => id !== productIdGid)
        : [...prev, productIdGid]
    );
  }, []);

  const handleFormSubmit = useCallback((intent: string, bundleId?: string) => {
    const formData = new FormData();
    formData.append('intent', intent);
    formData.append('bundleName', bundleName.trim());
    if (bundleId) formData.append('bundleId', bundleId);
    
    const sortedGids = [...selectedProductGids].sort((a, b) => {
      // Ensure the *original* main product ID (if editing) or the first selected remains first
      const currentMainGid = currentBundle ? getGidProductId(currentBundle.bundleProductId) : selectedProductGids[0];

      if (a === currentMainGid && b !== currentMainGid) return -1;
      if (b === currentMainGid && a !== currentMainGid) return 1;
      return 0;
    });

    sortedGids.forEach(gid => {
      formData.append('productIds[]', gid);
    });
    
    submit(formData, { method: 'post' });
  }, [bundleName, selectedProductGids, currentBundle, submit]);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
    p.numericId.includes(productSearchTerm)
  );

  const getProductsForBundle = (bundle: ReviewBundle) => {
    return bundle.productIds.map(numericId => { 
      const gid = getGidProductId(numericId);
      return productMap.get(gid) || {
        id: gid,
        title: `Product ${numericId} (Not found)`,
        handle: '#',
        imageUrl: null,
        numericId: numericId
      } as ShopifyProduct;
    });
  };

  const getProductMedia = (product: ShopifyProduct) => (
    <Box paddingInlineEnd="200">
        <Thumbnail
          source={product.imageUrl || `https://placehold.co/80x80/f6f6f7/6d7175?text=${encodeURIComponent(product.title.split(' ')[0])}`}
          alt={`Image of ${product.title}`}
          size="small"
        />
    </Box>
  );

  const toastMarkup = activeToast ? (
    <Toast content={toastMessage} onDismiss={toggleActiveToast} error={toastError} />
  ) : null;

  return (
    <Page fullWidth>
      <TitleBar title="Review Bundles Management" />

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Banner 
              title="Review Syndication Feature"
              tone="info"
            >
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  Create **Review Bundles** to automatically share approved reviews between a group of products.
                </Text>
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  The **first product selected** in a bundle will be designated as the main bundle ID.
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  If any product in a bundle receives an approved review, that review will be syndicated (copied) to all other products in that bundle.
                </Text>
              </BlockStack>
            </Banner>

            <Card padding="0">
              <Box padding="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg" fontWeight="semibold">
                    Existing Review Bundles ({bundles.length})
                  </Text>
                  <Button 
                    variant="primary" 
                    icon={PlusIcon} 
                    onClick={() => handleModalOpen('create')}
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
                          <Box background="bg-fill-tertiary" borderRadius="300" padding="300" display="flex" alignItems="center" justifyContent="center">
                            <Icon source={FolderIcon} tone="base" />
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
                            destructive: true,
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
                              Main: {mainProduct?.title || 'Unknown Product'}
                            </Badge>
                            {otherProductsCount > 0 && (
                              <Badge size="small">
                                +{otherProductsCount} {otherProductsCount === 1 ? 'Product' : 'Products'}
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
                      onClick={() => handleModalOpen('create')}
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
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* MODAL for Create/Edit */}
      <Modal
        open={activeModal && (modalType === 'create' || modalType === 'edit')}
        onClose={handleModalClose}
        title={modalType === 'create' ? "Create New Review Bundle" : `Edit Bundle: ${currentBundle?.name}`}
        size="large"
        primaryAction={{
          content: modalType === 'create' ? 'Create Bundle' : 'Save Changes',
          onAction: () => handleFormSubmit(`${modalType}-bundle`, currentBundle?.id),
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

      {/* MODAL for Delete Confirmation */}
      <Modal
        open={activeModal && modalType === 'delete'}
        onClose={handleModalClose}
        title="Delete Review Bundle"
        primaryAction={{
          content: 'Delete Bundle',
          onAction: () => handleFormSubmit('delete-bundle', currentBundle?.id),
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
              Are you sure you want to delete the bundle **{currentBundle?.name}**?
            </Text>
            <Banner tone="warning">
              This action will **only delete the bundle configuration**. Existing reviews and syndicated links will remain in the database, but no further syndication will occur for these products.
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {toastMarkup}
    </Page>
  );
}
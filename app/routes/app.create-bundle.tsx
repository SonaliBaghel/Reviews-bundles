import {
  Page, Layout, BlockStack, Banner, Text, Toast
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

import { useBundleManager } from "../hooks/useBundleManager";
import { BundleListSection } from "../components/bundles/BundleListSection";
import { BundleFormModal } from "../components/bundles/BundleFormModal";
import { DeleteBundleModal } from "../components/bundles/DeleteBundleModal";
import { getNumericProductId, getGidProductId } from "../utils/product.helpers";

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  numericId: string;
}

interface ReviewBundle {
  id: string;
  name: string;
  bundleProductId: string;
  productIds: string[];
  createdAt: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const bundles = await (db as any).reviewBundle.findMany({
    where: { shop },
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

  const serializableBundles: ReviewBundle[] = bundles.map((b: any) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    productIds: b.productIds.split(','),
  }));

  return json({ products: shopifyProducts, bundles: serializableBundles });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
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
            shop,
            name: bundleName,
            bundleProductId: numericBundleProductId,
            productIds: productIdsString,
          }
        });
        return json({ success: true, message: `Bundle '${newBundle.name}' created successfully.` });
      } else if (intent === 'edit-bundle' && bundleId) {
        const updatedBundle = await (db as any).reviewBundle.update({
          where: { id: bundleId, shop },
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
      await (db as any).reviewBundle.delete({ where: { id: bundleId, shop } });
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
  const {
    bundles, isSubmitting, activeModal, modalType, currentBundle,
    bundleName, selectedProductGids, activeToast, toastMessage, toastError,
    productSearchTerm, productMap, filteredProducts,
    setBundleName, setProductSearchTerm, toggleActiveToast,
    handleModalOpen, handleModalClose, handleProductSelection, handleFormSubmit,
    setActiveToast
  } = useBundleManager();

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

  const toastMarkup = activeToast ? (
    <Toast content={toastMessage} onDismiss={() => setActiveToast(false)} error={toastError} />
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

            <BundleListSection
              bundles={bundles}
              isSubmitting={isSubmitting}
              handleModalOpen={handleModalOpen}
              getProductsForBundle={getProductsForBundle}
            />
          </BlockStack>
        </Layout.Section>
      </Layout>

      <BundleFormModal
        activeModal={activeModal}
        modalType={modalType}
        handleModalClose={handleModalClose}
        currentBundleName={currentBundle?.name}
        bundleName={bundleName}
        setBundleName={setBundleName}
        handleFormSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        selectedProductGids={selectedProductGids}
        productMap={productMap}
        productSearchTerm={productSearchTerm}
        setProductSearchTerm={setProductSearchTerm}
        filteredProducts={filteredProducts}
        handleProductSelection={handleProductSelection}
        currentBundleId={currentBundle?.id}
        getNumericProductId={getNumericProductId}
      />

      <DeleteBundleModal
        activeModal={activeModal}
        modalType={modalType}
        handleModalClose={handleModalClose}
        currentBundleName={currentBundle?.name}
        handleFormSubmit={handleFormSubmit}
        currentBundleId={currentBundle?.id}
        isSubmitting={isSubmitting}
      />

      {toastMarkup}
    </Page>
  );
}
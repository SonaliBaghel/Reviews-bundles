/**
 * Shopify Helper Utilities
 * Common functions for working with Shopify GIDs and product data
 */

import logger from './logger.server';

/**
 * Converts a numeric product ID to a Shopify GID
 */
export function getGidProductId(numericId: string): string {
    return `gid://shopify/Product/${numericId}`;
}

/**
 * Extracts the numeric ID from a Shopify GID
 */
export function getNumericProductId(gid: string): string {
    const parts = gid.split('/');
    return parts[parts.length - 1];
}

/**
 * Ensures a product ID is in Shopify GID format
 */
export function ensureShopifyGid(productId: string): string {
    if (productId.startsWith('gid://shopify/Product/')) {
        return productId;
    }
    return `gid://shopify/Product/${productId}`;
}

/**
 * Checks if a product exists in Shopify
 */
export async function checkProductExists(
    productId: string,
    admin: any
): Promise<boolean> {
    try {
        const gid = `gid://shopify/Product/${productId}`;
        const response = await admin.graphql(
            `query productExists($id: ID!) {
        product(id: $id) { id title }
      }`,
            { variables: { id: gid } }
        );
        const data = await response.json();
        return !!data.data?.product;
    } catch (error) {
        logger.error(`Error checking product ${productId}`, error);
        return false;
    }
}

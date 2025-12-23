export const getGidProductId = (numericId: string): string => {
    return `gid://shopify/Product/${numericId}`;
};

export const getNumericProductId = (gid: string): string => {
    const parts = gid.split('/');
    return parts[parts.length - 1];
};

export const ensureShopifyGid = (productId: string): string => {
    if (productId.startsWith('gid://shopify/Product/')) {
        return productId;
    }
    return `gid://shopify/Product/${productId}`;
};

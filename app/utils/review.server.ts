import db from "../db.server";
import { ensureShopifyGid, getNumericProductId } from "./product.helpers";
import { ProductSummary } from "../components/ProductOverviewTable";
import { Review } from "../components/ReviewList";

export interface ProductReviewRecord extends Review {
    isBundleReview?: boolean;
    bundleContext?: string | null;
}

export async function checkProductExists(productId: string, admin: any): Promise<boolean> {
    try {
        const gid = `gid://shopify/Product/${productId}`;
        const response = await admin.graphql(`
      query productExists($id: ID!) {
        product(id: $id) { id title }
      }`, { variables: { id: gid } });
        const data = await response.json();
        return !!data.data?.product;
    } catch (error) {
        console.error(`Error checking product ${productId}:`, error);
        return false;
    }
}

export async function fetchProductSummaries(admin: any, shop: string) {
    const allProductReviews = await (db.productReview as any).findMany({
        where: { shop },
        orderBy: { createdAt: 'desc' },
        include: { images: true },
    }) as (ProductReviewRecord & { images: any[] })[];

    const productMap = new Map<string, { totalRating: number; count: number; reviews: ProductReviewRecord[] }>();
    const uniqueProductGids = new Set<string>();

    allProductReviews.forEach(review => {
        const productGid = ensureShopifyGid(review.productId);
        uniqueProductGids.add(productGid);

        if (!productMap.has(productGid)) {
            productMap.set(productGid, { totalRating: 0, count: 0, reviews: [] });
        }
        const productData = productMap.get(productGid)!;
        productData.totalRating += review.rating;
        productData.count++;
        productData.reviews.push(review);
    });

    const productsData: Record<string, { title: string; imageUrl: string | null }> = {};
    if (uniqueProductGids.size > 0) {
        const idsToFetch = Array.from(uniqueProductGids);
        const query = `query ProductsByIds($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id title images(first: 1) { edges { node { url } } } } } }`;
        const response = await admin.graphql(query, { variables: { ids: idsToFetch } });
        const data = await response.json();
        if (data.data?.nodes) {
            data.data.nodes.forEach((node: any) => {
                if (node && node.id && node.title) {
                    productsData[node.id] = {
                        title: node.title,
                        imageUrl: node.images?.edges[0]?.node?.url || null,
                    };
                }
            });
        }
    }

    const productSummaries: ProductSummary[] = Array.from(productMap.entries()).map(([productIdGid, data]) => ({
        productId: productIdGid,
        productName: productsData[productIdGid]?.title || `Product ${getNumericProductId(productIdGid)}`,
        productImageUrl: productsData[productIdGid]?.imageUrl || null,
        averageRating: (data.totalRating / data.count).toFixed(1),
        totalReviews: data.count,
        individualReviews: data.reviews.map(r => ({
            id: r.id, productId: r.productId, rating: r.rating, author: r.author, email: r.email,
            title: r.title, content: r.content, status: r.status,
            createdAt: (r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt),
            updatedAt: (r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt),
            images: r.images.map(img => ({
                id: img.id, url: img.url, altText: img.altText, order: img.order,
                createdAt: (img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt),
                updatedAt: (img.updatedAt instanceof Date ? img.updatedAt.toISOString() : img.updatedAt)
            }))
        })),
    }));

    productSummaries.sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
    return productSummaries;
}

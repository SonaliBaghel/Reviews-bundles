export const appConfig = {
    images: {
        maxSize: 20 * 1024 * 1024, // 20MB
        maxCount: 5,
        uploadRetries: 10,
        retryDelayMs: 2000,
    },
    reviews: {
        maxWordCount: 200,
        perPage: 10,
    },
    metafields: {
        namespace: "reviews",
        ratingKey: "rating",
        countKey: "count",
    }
};

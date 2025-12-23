/**
 * Application Configuration
 * Centralized configuration for all app-wide constants, URLs, and settings
 */

export const APP_CONFIG = {
    // Pagination Settings
    PAGINATION: {
        REVIEWS_PER_PAGE: 10,
        DEFAULT_PAGE: 1,
    },

    // Image URLs
    IMAGES: {
        PLACEHOLDER_BASE_URL: 'https://placehold.co/80x80/f6f6f7/6d7175',
        FALLBACK_THUMBNAIL: 'https://via.placeholder.com/80',
        getPlaceholderUrl: (text: string, width = 80, height = 80) =>
            `https://placehold.co/${width}x${height}/f6f6f7/6d7175?text=${encodeURIComponent(text)}`,
    },

    // Shopify CDN URLs
    SHOPIFY: {
        CDN_BASE_URL: 'https://cdn.shopify.com/',
        FONTS_URL: 'https://cdn.shopify.com/static/fonts/inter/v4/styles.css',
        GRAPHQL_QUERY_LIMITS: {
            PRODUCTS: 250,
            IMAGES_PER_PRODUCT: 1,
        },
    },

    // Documentation URLs
    DOCS: {
        APP_BRIDGE: 'https://shopify.dev/docs/apps/tools/app-bridge',
        APP_NAV: 'https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav',
    },

    // CSV Configuration
    CSV: {
        HEADERS: ['Product ID', 'Rating', 'Author', 'Email', 'Title', 'Content', 'Status', 'Created At'],
        SAMPLE_DATA: `Product ID,Rating,Author,Email,Title,Content,Status,Created At
gid://shopify/Product/123456789,5,John Doe,john@example.com,"Great product!","This product is amazing and works perfectly.",approved,2024-01-15T10:30:00.000Z
gid://shopify/Product/123456789,4,Jane Smith,jane@example.com,"Good quality","Pretty good but could be improved in some areas.",pending,2024-01-16T14:20:00.000Z
gid://shopify/Product/987654321,3,Bob Wilson,bob@example.com,"Average product","It's okay for the price, but not exceptional.",rejected,2024-01-17T09:15:00.000Z`,
        FILE_NAME_PREFIX: 'reviews-export',
        SAMPLE_FILE_NAME: 'reviews-sample-template.csv',
    },

    // Rating Thresholds
    RATINGS: {
        EXCELLENT: 4.5,
        GOOD: 4.0,
        AVERAGE: 3.0,
        POOR: 2.0,
    },

    // Settings Defaults
    SETTINGS_DEFAULTS: {
        STAR_COLOR: '#FFD700',
        BACKGROUND_COLOR: '#F9F9F9',
        HEADING_COLOR: '#222222',
        REVIEW_CARD_COLOR: '#FFFFFF',
        REVIEWS_PER_SLIDE: 3,
        DISPLAY_TYPE: 'slider',
        GRID_ROWS: 2,
        GRID_COLUMNS: 2,
        SECTION_BORDER_RADIUS: 12,
        SLIDER_AUTOPLAY: true,
        SLIDER_SPEED: 3000,
        SLIDER_LOOP: true,
        SLIDER_DIRECTION: 'horizontal',
        SPACE_BETWEEN: 20,
        SHOW_NAVIGATION: true,
        SLIDER_EFFECT: 'slide',
        HEADING_TEXT: "CUSTOMER TESTIMONIALS",
        HEADING_FONT_FAMILY: "theme",
        HEADING_FONT_SIZE: 40,
        HEADING_FONT_WEIGHT: "bold",
        HEADING_FONT_STYLE: "normal",
        HEADING_TEXT_TRANSFORM: "uppercase",
        HEADING_LETTER_SPACING: 0,
        HEADING_LINE_HEIGHT: 1.2,
        HEADING_TEXT_SHADOW: "none",
        RATING_LABEL_TEXT: "Excellent",
        RATING_LABEL_FONT_FAMILY: "theme",
        RATING_LABEL_FONT_SIZE: 18,
        RATING_LABEL_FONT_WEIGHT: "600",
        RATING_LABEL_COLOR: "#555555",
        RATING_VALUE_FONT_FAMILY: "theme",
        RATING_VALUE_FONT_SIZE: 18,
        RATING_VALUE_FONT_WEIGHT: "600",
        RATING_VALUE_COLOR: "#555555",
        REVIEW_COUNT_PREFIX: "Based on",
        REVIEW_COUNT_SUFFIX: "reviews",
        REVIEW_COUNT_FONT_FAMILY: "theme",
        REVIEW_COUNT_FONT_SIZE: 16,
        REVIEW_COUNT_FONT_WEIGHT: "normal",
        REVIEW_COUNT_COLOR: "#777777",
    },

    // API Endpoints
    API: {
        SETTINGS: '/apps/productreview/api/settings',
        PRODUCT_REVIEWS: '/apps/productreview/api/productreview',
    },
} as const;

export default APP_CONFIG;

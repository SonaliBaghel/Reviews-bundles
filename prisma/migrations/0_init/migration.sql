-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `scope` VARCHAR(191) NULL,
    `expires` DATETIME(3) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `userId` BIGINT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `accountOwner` BOOLEAN NOT NULL DEFAULT false,
    `locale` VARCHAR(191) NULL,
    `collaborator` BOOLEAN NULL DEFAULT false,
    `emailVerified` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `isBundleReview` BOOLEAN NOT NULL DEFAULT false,
    `bundleContext` VARCHAR(191) NULL,

    INDEX `product_reviews_deletedAt_idx`(`deletedAt`),
    INDEX `product_reviews_productId_idx`(`productId`),
    INDEX `product_reviews_bundleContext_idx`(`bundleContext`),
    INDEX `product_reviews_isBundleReview_idx`(`isBundleReview`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_images` (
    `id` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `altText` VARCHAR(191) NULL,
    `order` INTEGER NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `review_images_reviewId_idx`(`reviewId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bundle_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `bundleProductId` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bundle_reviews_bundleProductId_idx`(`bundleProductId`),
    INDEX `bundle_reviews_productId_idx`(`productId`),
    UNIQUE INDEX `bundle_reviews_reviewId_productId_key`(`reviewId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_bundles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `bundleProductId` VARCHAR(191) NOT NULL,
    `productIds` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `review_bundles_name_key`(`name`),
    UNIQUE INDEX `review_bundles_bundleProductId_key`(`bundleProductId`),
    INDEX `review_bundles_bundleProductId_idx`(`bundleProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewSyndication` (
    `id` VARCHAR(191) NOT NULL,
    `originalReviewId` VARCHAR(191) NOT NULL,
    `syndicatedReviewId` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReviewSyndication_originalReviewId_idx`(`originalReviewId`),
    INDEX `ReviewSyndication_syndicatedReviewId_idx`(`syndicatedReviewId`),
    INDEX `ReviewSyndication_bundleId_idx`(`bundleId`),
    INDEX `ReviewSyndication_productId_idx`(`productId`),
    UNIQUE INDEX `ReviewSyndication_originalReviewId_syndicatedReviewId_bundle_key`(`originalReviewId`, `syndicatedReviewId`, `bundleId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_settings` (
    `id` VARCHAR(191) NOT NULL,
    `starColor` VARCHAR(191) NOT NULL DEFAULT '#FFD700',
    `backgroundColor` VARCHAR(191) NOT NULL DEFAULT '#F9F9F9',
    `headingColor` VARCHAR(191) NOT NULL DEFAULT '#222222',
    `reviewCardColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `reviewsPerSlide` INTEGER NOT NULL DEFAULT 3,
    `displayType` VARCHAR(191) NOT NULL DEFAULT 'slider',
    `gridRows` INTEGER NOT NULL DEFAULT 2,
    `gridColumns` INTEGER NOT NULL DEFAULT 2,
    `sliderAutoplay` BOOLEAN NOT NULL DEFAULT true,
    `sliderSpeed` INTEGER NOT NULL DEFAULT 3000,
    `sliderLoop` BOOLEAN NOT NULL DEFAULT true,
    `sliderDirection` VARCHAR(191) NOT NULL DEFAULT 'horizontal',
    `spaceBetween` INTEGER NOT NULL DEFAULT 20,
    `showNavigation` BOOLEAN NOT NULL DEFAULT true,
    `sliderEffect` VARCHAR(191) NOT NULL DEFAULT 'slide',
    `sectionBorderRadius` INTEGER NOT NULL DEFAULT 12,
    `headingText` VARCHAR(191) NOT NULL DEFAULT 'CUSTOMER TESTIMONIALS',
    `headingFontFamily` VARCHAR(191) NOT NULL DEFAULT 'theme',
    `headingFontSize` INTEGER NOT NULL DEFAULT 40,
    `headingFontWeight` VARCHAR(191) NOT NULL DEFAULT 'bold',
    `headingFontStyle` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `headingTextTransform` VARCHAR(191) NOT NULL DEFAULT 'uppercase',
    `headingLetterSpacing` INTEGER NOT NULL DEFAULT 0,
    `headingLineHeight` DOUBLE NOT NULL DEFAULT 1.2,
    `headingTextShadow` VARCHAR(191) NOT NULL DEFAULT 'none',
    `ratingLabelText` VARCHAR(191) NOT NULL DEFAULT 'Excellent',
    `ratingLabelFontFamily` VARCHAR(191) NOT NULL DEFAULT 'theme',
    `ratingLabelFontSize` INTEGER NOT NULL DEFAULT 18,
    `ratingLabelFontWeight` VARCHAR(191) NOT NULL DEFAULT '600',
    `ratingLabelColor` VARCHAR(191) NOT NULL DEFAULT '#555555',
    `ratingValueFontFamily` VARCHAR(191) NOT NULL DEFAULT 'theme',
    `ratingValueFontSize` INTEGER NOT NULL DEFAULT 18,
    `ratingValueFontWeight` VARCHAR(191) NOT NULL DEFAULT '600',
    `ratingValueColor` VARCHAR(191) NOT NULL DEFAULT '#555555',
    `reviewCountPrefix` VARCHAR(191) NOT NULL DEFAULT 'Based on',
    `reviewCountSuffix` VARCHAR(191) NOT NULL DEFAULT 'reviews',
    `reviewCountFontFamily` VARCHAR(191) NOT NULL DEFAULT 'theme',
    `reviewCountFontSize` INTEGER NOT NULL DEFAULT 16,
    `reviewCountFontWeight` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `reviewCountColor` VARCHAR(191) NOT NULL DEFAULT '#777777',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `review_images` ADD CONSTRAINT `review_images_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `product_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundle_reviews` ADD CONSTRAINT `bundle_reviews_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `product_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewSyndication` ADD CONSTRAINT `ReviewSyndication_originalReviewId_fkey` FOREIGN KEY (`originalReviewId`) REFERENCES `product_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewSyndication` ADD CONSTRAINT `ReviewSyndication_syndicatedReviewId_fkey` FOREIGN KEY (`syndicatedReviewId`) REFERENCES `product_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


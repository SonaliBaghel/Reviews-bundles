-- AlterTable
ALTER TABLE `app_settings` ALTER COLUMN `shop` DROP DEFAULT;

-- AlterTable
ALTER TABLE `product_reviews` ALTER COLUMN `shop` DROP DEFAULT;

-- AlterTable
ALTER TABLE `review_bundles` ALTER COLUMN `shop` DROP DEFAULT;

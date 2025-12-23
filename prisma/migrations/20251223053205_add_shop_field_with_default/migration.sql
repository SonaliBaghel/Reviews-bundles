/*
  Warnings:

  - A unique constraint covering the columns `[shop]` on the table `app_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `review_bundles_name_key` ON `review_bundles`;

-- AlterTable
ALTER TABLE `app_settings` ADD COLUMN `shop` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `product_reviews` ADD COLUMN `shop` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `review_bundles` ADD COLUMN `shop` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX `app_settings_shop_key` ON `app_settings`(`shop`);

-- CreateIndex
CREATE INDEX `app_settings_shop_idx` ON `app_settings`(`shop`);

-- CreateIndex
CREATE INDEX `product_reviews_shop_idx` ON `product_reviews`(`shop`);

-- CreateIndex
CREATE INDEX `review_bundles_shop_idx` ON `review_bundles`(`shop`);

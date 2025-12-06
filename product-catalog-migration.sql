-- ================================================
-- PRODUCT CATALOG SYSTEM - Database Migration
-- Run this SQL in your MySQL database (Railway CLI)
-- ================================================

-- Create products table for e-commerce integration
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NULL,

  -- Product Information
  `name` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10, 2) NULL,
  `originalPrice` DECIMAL(10, 2) NULL COMMENT 'For showing discounts',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `sku` VARCHAR(191) NULL COMMENT 'Stock Keeping Unit',

  -- Product Details
  `category` VARCHAR(191) NULL,
  `brand` VARCHAR(191) NULL,
  `images` JSON NULL COMMENT 'Array of image URLs',
  `variants` JSON NULL COMMENT 'Sizes, colors, etc.',
  `features` TEXT NULL COMMENT 'Key features/specifications',

  -- Availability
  `inStock` BOOLEAN NOT NULL DEFAULT true,
  `stockQuantity` INT NULL,
  `stockStatus` VARCHAR(50) DEFAULT 'in_stock' COMMENT 'in_stock, out_of_stock, limited',

  -- Source Information
  `sourceUrl` TEXT NULL COMMENT 'Product page URL',
  `sourceType` VARCHAR(50) DEFAULT 'manual' COMMENT 'manual, scraped, api',

  -- Timestamps
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `lastSyncedAt` DATETIME(3) NULL COMMENT 'Last time synced from source',

  PRIMARY KEY (`id`),
  INDEX `idx_products_userId` (`userId`),
  INDEX `idx_products_agentId` (`agentId`),
  INDEX `idx_products_category` (`category`),
  INDEX `idx_products_inStock` (`inStock`),
  INDEX `idx_products_userId_category` (`userId`, `category`),

  CONSTRAINT `products_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `products_agentId_fkey`
    FOREIGN KEY (`agentId`) REFERENCES `agents`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Verification Query (run after migration)
-- ================================================
-- SELECT
--   COUNT(*) as total_products,
--   COUNT(DISTINCT userId) as unique_users,
--   COUNT(DISTINCT category) as unique_categories
-- FROM products;

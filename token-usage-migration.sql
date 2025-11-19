-- Migration: Add TokenUsage table for OpenAI cost tracking
-- Date: 2025-11-19
-- Description: Adds token usage tracking and cost control for OpenAI API calls

CREATE TABLE IF NOT EXISTS `token_usage` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `month` VARCHAR(191) NOT NULL COMMENT 'Format: 2025-11',
  `tokensUsed` INT NOT NULL DEFAULT 0 COMMENT 'Total tokens consumed this month',
  `tokenLimit` INT NOT NULL DEFAULT 500000 COMMENT 'Monthly token limit based on plan',
  `estimatedCost` DOUBLE NOT NULL DEFAULT 0 COMMENT 'Estimated cost in USD',
  `requestCount` INT NOT NULL DEFAULT 0 COMMENT 'Number of API requests made',
  `lastRequestAt` DATETIME(3) NULL COMMENT 'Timestamp of last API request',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `token_usage_userId_month_key`(`userId`, `month`),
  INDEX `token_usage_userId_idx`(`userId`),
  INDEX `token_usage_month_idx`(`month`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraint
ALTER TABLE `token_usage`
  ADD CONSTRAINT `token_usage_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Verify the table was created
SELECT 'TokenUsage table created successfully' AS status;

-- Show table structure
DESCRIBE `token_usage`;

-- Add billingInterval column to users table
ALTER TABLE `users` ADD COLUMN `billingInterval` VARCHAR(191) NULL DEFAULT 'monthly';

-- Update existing lifetime users to have null billingInterval
UPDATE `users` SET `billingInterval` = NULL WHERE `subscriptionStatus` = 'lifetime';

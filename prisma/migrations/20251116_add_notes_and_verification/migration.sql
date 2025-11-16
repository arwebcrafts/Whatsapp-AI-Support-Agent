-- AlterTable
ALTER TABLE `users` ADD COLUMN `company` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `verificationToken` VARCHAR(191) NULL,
    ADD COLUMN `verificationTokenExpiry` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `conversations` ADD COLUMN `notes` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_verificationToken_key` ON `users`(`verificationToken`);

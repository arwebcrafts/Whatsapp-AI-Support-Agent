-- AlterTable
ALTER TABLE `agents` ADD COLUMN `businessName` VARCHAR(191) NULL,
    ADD COLUMN `responseDelay` INTEGER NOT NULL DEFAULT 5;

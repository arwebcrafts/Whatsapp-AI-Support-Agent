-- Add conversation progress tracking and goals
ALTER TABLE `conversations`
ADD COLUMN `engagementScore` INTEGER NOT NULL DEFAULT 0,
ADD COLUMN `conversationGoal` VARCHAR(191) NOT NULL DEFAULT 'info',
ADD COLUMN `goalAchieved` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `aiMode` VARCHAR(191) NOT NULL DEFAULT 'auto';

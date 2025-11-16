-- Consolidated Migration for WhaSales AI
-- This file contains all schema updates needed for the application

-- Step 1: Add company and phone to users (if not exists)
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `company` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `phone` VARCHAR(191) NULL;

-- Step 2: Add email verification fields to users (if not exists)
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `emailVerified` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS `verificationToken` VARCHAR(191) NULL,
ADD COLUMN IF NOT EXISTS `verificationTokenExpiry` DATETIME(3) NULL;

-- Step 3: Add unique index for verificationToken (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS `users_verificationToken_key` ON `users`(`verificationToken`);

-- Step 4: Add notes field to conversations (if not exists)
ALTER TABLE `conversations`
ADD COLUMN IF NOT EXISTS `notes` TEXT NULL;

-- Step 5: Create conversation_analytics table (if not exists)
CREATE TABLE IF NOT EXISTS `conversation_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `avgResponseTime` INTEGER NULL,
    `firstResponseTime` INTEGER NULL,
    `conversationDuration` INTEGER NULL,
    `totalMessages` INTEGER NOT NULL DEFAULT 0,
    `customerMessages` INTEGER NOT NULL DEFAULT 0,
    `agentMessages` INTEGER NOT NULL DEFAULT 0,
    `resolutionStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `customerSatisfaction` DOUBLE NULL,
    `sentimentScore` DOUBLE NULL,
    `messageExchangeRate` DOUBLE NULL,
    `customerEngagement` INTEGER NOT NULL DEFAULT 0,
    `wasSuccessful` BOOLEAN NOT NULL DEFAULT false,
    `goalAchieved` BOOLEAN NOT NULL DEFAULT false,
    `needsImprovement` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `conversation_analytics_conversationId_key`(`conversationId`),
    INDEX `conversation_analytics_agentId_idx`(`agentId`),
    INDEX `conversation_analytics_userId_idx`(`userId`),
    INDEX `conversation_analytics_resolutionStatus_idx`(`resolutionStatus`),
    INDEX `conversation_analytics_wasSuccessful_idx`(`wasSuccessful`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 6: Create agent_feedback table (if not exists)
CREATE TABLE IF NOT EXISTS `agent_feedback` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `rating` INTEGER NULL,
    `feedbackType` VARCHAR(191) NOT NULL,
    `feedbackTags` TEXT NULL,
    `comment` TEXT NULL,
    `wasHelpful` BOOLEAN NOT NULL DEFAULT true,
    `wasAccurate` BOOLEAN NOT NULL DEFAULT true,
    `wasPolite` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agent_feedback_agentId_idx`(`agentId`),
    INDEX `agent_feedback_userId_idx`(`userId`),
    INDEX `agent_feedback_conversationId_idx`(`conversationId`),
    INDEX `agent_feedback_feedbackType_idx`(`feedbackType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 7: Create agent_performance table (if not exists)
CREATE TABLE IF NOT EXISTS `agent_performance` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `periodType` VARCHAR(191) NOT NULL,
    `totalConversations` INTEGER NOT NULL DEFAULT 0,
    `successfulConversations` INTEGER NOT NULL DEFAULT 0,
    `failedConversations` INTEGER NOT NULL DEFAULT 0,
    `averageSatisfaction` DOUBLE NULL,
    `averageSentiment` DOUBLE NULL,
    `resolutionRate` DOUBLE NULL,
    `avgResponseTime` DOUBLE NULL,
    `avgConversationDuration` DOUBLE NULL,
    `totalMessagesHandled` INTEGER NOT NULL DEFAULT 0,
    `improvementScore` DOUBLE NULL,
    `learningRate` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `agent_performance_agentId_idx`(`agentId`),
    INDEX `agent_performance_userId_idx`(`userId`),
    INDEX `agent_performance_periodType_idx`(`periodType`),
    UNIQUE INDEX `agent_performance_agentId_period_periodType_key`(`agentId`, `period`, `periodType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 8: Create conversation_insights table (if not exists)
CREATE TABLE IF NOT EXISTS `conversation_insights` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `insightType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `triggerPattern` TEXT NULL,
    `responsePattern` TEXT NULL,
    `successRate` DOUBLE NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `confidence` DOUBLE NULL,
    `category` VARCHAR(191) NULL,
    `context` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `conversation_insights_agentId_idx`(`agentId`),
    INDEX `conversation_insights_userId_idx`(`userId`),
    INDEX `conversation_insights_insightType_idx`(`insightType`),
    INDEX `conversation_insights_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 9: Create agent_learning_log table (if not exists)
CREATE TABLE IF NOT EXISTS `agent_learning_log` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `eventData` TEXT NOT NULL,
    `impactScore` DOUBLE NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agent_learning_log_agentId_idx`(`agentId`),
    INDEX `agent_learning_log_userId_idx`(`userId`),
    INDEX `agent_learning_log_eventType_idx`(`eventType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migration complete
SELECT 'All migrations applied successfully!' as status;

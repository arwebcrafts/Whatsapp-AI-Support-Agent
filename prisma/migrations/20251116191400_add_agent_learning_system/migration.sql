-- CreateTable: Conversation Analytics
CREATE TABLE `conversation_analytics` (
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
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `conversation_analytics_conversationId_key`(`conversationId`),
    INDEX `conversation_analytics_agentId_idx`(`agentId`),
    INDEX `conversation_analytics_userId_idx`(`userId`),
    INDEX `conversation_analytics_resolutionStatus_idx`(`resolutionStatus`),
    INDEX `conversation_analytics_wasSuccessful_idx`(`wasSuccessful`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Agent Feedback
CREATE TABLE `agent_feedback` (
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

-- CreateTable: Agent Performance
CREATE TABLE `agent_performance` (
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
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `agent_performance_agentId_idx`(`agentId`),
    INDEX `agent_performance_userId_idx`(`userId`),
    INDEX `agent_performance_periodType_idx`(`periodType`),
    UNIQUE INDEX `agent_performance_agentId_period_periodType_key`(`agentId`, `period`, `periodType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Conversation Insights
CREATE TABLE `conversation_insights` (
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
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `conversation_insights_agentId_idx`(`agentId`),
    INDEX `conversation_insights_userId_idx`(`userId`),
    INDEX `conversation_insights_insightType_idx`(`insightType`),
    INDEX `conversation_insights_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Agent Learning Log
CREATE TABLE `agent_learning_log` (
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

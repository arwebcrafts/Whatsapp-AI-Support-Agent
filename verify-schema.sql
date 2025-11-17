-- Quick verification script - Run this in your MySQL console
-- This will show you what columns exist in the conversations table

USE whatsapp_support;

SHOW COLUMNS FROM conversations;

-- Expected columns should include:
-- id, userId, agentId, whatsappConnectionId, customerPhone, customerName,
-- leadScore, aiEnabled, lastMessageAt, createdAt,
-- engagementScore, conversationGoal, goalAchieved, aiMode, notes

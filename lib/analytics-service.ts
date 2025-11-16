import { prisma } from "@/lib/prisma";

/**
 * Conversation Analytics Service
 * Tracks conversation metrics and generates insights for agent learning
 */

interface ConversationMetrics {
  conversationId: string;
  agentId?: string;
  userId: string;
  totalMessages: number;
  customerMessages: number;
  agentMessages: number;
  avgResponseTime?: number;
  firstResponseTime?: number;
  conversationDuration?: number;
  resolutionStatus: 'resolved' | 'pending' | 'escalated' | 'abandoned';
  goalAchieved: boolean;
}

/**
 * Calculate conversation metrics from messages
 */
export async function calculateConversationMetrics(
  conversationId: string
): Promise<ConversationMetrics | null> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return null;
    }

    const messages = conversation.messages;
    const totalMessages = messages.length;
    const customerMessages = messages.filter(m => m.senderType === 'customer').length;
    const agentMessages = messages.filter(m => m.senderType === 'ai' || m.senderType === 'user').length;

    // Calculate response times
    let totalResponseTime = 0;
    let responseCount = 0;
    let firstResponseTime: number | undefined;

    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];

      // If customer message followed by agent response
      if (currentMsg.senderType === 'customer' &&
          (nextMsg.senderType === 'ai' || nextMsg.senderType === 'user')) {
        const responseTime = Math.floor(
          (new Date(nextMsg.createdAt).getTime() - new Date(currentMsg.createdAt).getTime()) / 1000
        );
        totalResponseTime += responseTime;
        responseCount++;

        // Track first response time
        if (firstResponseTime === undefined && i === 0) {
          firstResponseTime = responseTime;
        }
      }
    }

    const avgResponseTime = responseCount > 0 ? Math.floor(totalResponseTime / responseCount) : undefined;

    // Calculate conversation duration (in minutes)
    const conversationDuration = messages.length > 0 ? Math.floor(
      (new Date(messages[messages.length - 1].createdAt).getTime() -
       new Date(messages[0].createdAt).getTime()) / 60000
    ) : 0;

    // Determine resolution status based on goal achieved and recent activity
    let resolutionStatus: 'resolved' | 'pending' | 'escalated' | 'abandoned' = 'pending';
    if (conversation.goalAchieved) {
      resolutionStatus = 'resolved';
    } else {
      const lastMessageTime = new Date(conversation.lastMessageAt).getTime();
      const hoursSinceLastMessage = (Date.now() - lastMessageTime) / (1000 * 60 * 60);

      if (hoursSinceLastMessage > 24) {
        resolutionStatus = 'abandoned';
      }
    }

    return {
      conversationId,
      agentId: conversation.agentId || undefined,
      userId: conversation.userId,
      totalMessages,
      customerMessages,
      agentMessages,
      avgResponseTime,
      firstResponseTime,
      conversationDuration,
      resolutionStatus,
      goalAchieved: conversation.goalAchieved
    };
  } catch (error) {
    console.error('Error calculating conversation metrics:', error);
    return null;
  }
}

/**
 * Analyze sentiment of conversation messages
 * Returns a score from -1 (negative) to 1 (positive)
 */
export function analyzeSentiment(messages: { messageText: string | null }[]): number {
  // Simple sentiment analysis based on keywords
  // In production, you would use a proper NLP library or API

  const positiveWords = [
    'thank', 'thanks', 'great', 'good', 'excellent', 'perfect', 'love',
    'awesome', 'amazing', 'happy', 'yes', 'sure', 'appreciate', 'helpful'
  ];

  const negativeWords = [
    'bad', 'terrible', 'worst', 'hate', 'angry', 'frustrat', 'disappoint',
    'problem', 'issue', 'error', 'wrong', 'no', 'not working', 'broken'
  ];

  let positiveCount = 0;
  let negativeCount = 0;
  let totalWords = 0;

  messages.forEach(msg => {
    if (!msg.messageText) return;

    const text = msg.messageText.toLowerCase();
    const words = text.split(/\s+/);
    totalWords += words.length;

    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
  });

  if (totalWords === 0) return 0;

  // Calculate sentiment score
  const sentimentScore = (positiveCount - negativeCount) / totalWords;

  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, sentimentScore * 10));
}

/**
 * Calculate customer engagement score (0-100)
 */
export function calculateEngagementScore(metrics: ConversationMetrics): number {
  let score = 0;

  // Message count factor (0-30 points)
  const messageScore = Math.min(30, metrics.totalMessages * 3);
  score += messageScore;

  // Response time factor (0-30 points)
  if (metrics.avgResponseTime) {
    // Good response time < 60s = full points
    // Poor response time > 300s = 0 points
    const responseScore = Math.max(0, 30 - (metrics.avgResponseTime / 10));
    score += responseScore;
  }

  // Conversation duration factor (0-20 points)
  if (metrics.conversationDuration) {
    // Ideal duration 5-20 minutes
    if (metrics.conversationDuration >= 5 && metrics.conversationDuration <= 20) {
      score += 20;
    } else if (metrics.conversationDuration > 0) {
      score += 10;
    }
  }

  // Goal achievement (0-20 points)
  if (metrics.goalAchieved) {
    score += 20;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Store or update conversation analytics
 */
export async function saveConversationAnalytics(conversationId: string): Promise<boolean> {
  try {
    const metrics = await calculateConversationMetrics(conversationId);
    if (!metrics) {
      console.error('Failed to calculate metrics for conversation:', conversationId);
      return false;
    }

    // Get messages for sentiment analysis
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true }
    });

    if (!conversation) return false;

    const sentimentScore = analyzeSentiment(conversation.messages);
    const engagementScore = calculateEngagementScore(metrics);

    // Calculate if conversation was successful
    const wasSuccessful =
      metrics.goalAchieved ||
      (metrics.resolutionStatus === 'resolved' && sentimentScore > 0.2);

    // Determine if needs improvement
    const needsImprovement =
      !wasSuccessful ||
      sentimentScore < -0.2 ||
      (metrics.avgResponseTime ? metrics.avgResponseTime > 180 : false);

    // Upsert analytics
    await prisma.conversationAnalytics.upsert({
      where: { conversationId },
      create: {
        conversationId,
        agentId: metrics.agentId,
        userId: metrics.userId,
        totalMessages: metrics.totalMessages,
        customerMessages: metrics.customerMessages,
        agentMessages: metrics.agentMessages,
        avgResponseTime: metrics.avgResponseTime,
        firstResponseTime: metrics.firstResponseTime,
        conversationDuration: metrics.conversationDuration,
        resolutionStatus: metrics.resolutionStatus,
        sentimentScore,
        customerEngagement: engagementScore,
        wasSuccessful,
        goalAchieved: metrics.goalAchieved,
        needsImprovement,
        updatedAt: new Date()
      },
      update: {
        totalMessages: metrics.totalMessages,
        customerMessages: metrics.customerMessages,
        agentMessages: metrics.agentMessages,
        avgResponseTime: metrics.avgResponseTime,
        firstResponseTime: metrics.firstResponseTime,
        conversationDuration: metrics.conversationDuration,
        resolutionStatus: metrics.resolutionStatus,
        sentimentScore,
        customerEngagement: engagementScore,
        wasSuccessful,
        goalAchieved: metrics.goalAchieved,
        needsImprovement,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Analytics saved for conversation ${conversationId}`);
    return true;
  } catch (error) {
    console.error('Error saving conversation analytics:', error);
    return false;
  }
}

/**
 * Update agent performance metrics for a given period
 */
export async function updateAgentPerformance(
  agentId: string,
  userId: string,
  periodType: 'daily' | 'weekly' | 'monthly'
): Promise<boolean> {
  try {
    const now = new Date();
    let period: string;

    switch (periodType) {
      case 'daily':
        period = now.toISOString().split('T')[0]; // '2025-11-16'
        break;
      case 'weekly':
        const weekNum = getWeekNumber(now);
        period = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        break;
      case 'monthly':
        period = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
    }

    // Get date range for the period
    const { startDate, endDate } = getPeriodDateRange(period, periodType);

    // Get all conversations for this agent in the period
    const analytics = await prisma.conversationAnalytics.findMany({
      where: {
        agentId,
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    if (analytics.length === 0) {
      return true; // No data to update
    }

    // Calculate aggregate metrics
    const totalConversations = analytics.length;
    const successfulConversations = analytics.filter(a => a.wasSuccessful).length;
    const failedConversations = totalConversations - successfulConversations;

    const avgSatisfaction = analytics
      .filter(a => a.customerSatisfaction !== null)
      .reduce((sum, a) => sum + (a.customerSatisfaction || 0), 0) / totalConversations || null;

    const avgSentiment = analytics
      .reduce((sum, a) => sum + (a.sentimentScore || 0), 0) / totalConversations;

    const resolutionRate = (successfulConversations / totalConversations) * 100;

    const avgResponseTime = analytics
      .filter(a => a.avgResponseTime !== null)
      .reduce((sum, a) => sum + (a.avgResponseTime || 0), 0) /
      analytics.filter(a => a.avgResponseTime !== null).length || null;

    const avgConversationDuration = analytics
      .filter(a => a.conversationDuration !== null)
      .reduce((sum, a) => sum + (a.conversationDuration || 0), 0) /
      analytics.filter(a => a.conversationDuration !== null).length || null;

    const totalMessagesHandled = analytics.reduce((sum, a) => sum + a.agentMessages, 0);

    // Calculate improvement score (compare to previous period)
    const improvementScore = await calculateImprovementScore(
      agentId,
      userId,
      periodType,
      resolutionRate
    );

    // Upsert performance record
    await prisma.agentPerformance.upsert({
      where: {
        agentId_period_periodType: {
          agentId,
          period,
          periodType
        }
      },
      create: {
        agentId,
        userId,
        period,
        periodType,
        totalConversations,
        successfulConversations,
        failedConversations,
        averageSatisfaction: avgSatisfaction,
        averageSentiment: avgSentiment,
        resolutionRate,
        avgResponseTime,
        avgConversationDuration,
        totalMessagesHandled,
        improvementScore,
        updatedAt: new Date()
      },
      update: {
        totalConversations,
        successfulConversations,
        failedConversations,
        averageSatisfaction: avgSatisfaction,
        averageSentiment: avgSentiment,
        resolutionRate,
        avgResponseTime,
        avgConversationDuration,
        totalMessagesHandled,
        improvementScore,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Performance metrics updated for agent ${agentId} (${periodType}: ${period})`);
    return true;
  } catch (error) {
    console.error('Error updating agent performance:', error);
    return false;
  }
}

/**
 * Calculate improvement score by comparing to previous period
 */
async function calculateImprovementScore(
  agentId: string,
  userId: string,
  periodType: string,
  currentResolutionRate: number
): Promise<number | null> {
  try {
    // Get previous period's performance
    const previousPerformance = await prisma.agentPerformance.findFirst({
      where: {
        agentId,
        userId,
        periodType
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    if (!previousPerformance || !previousPerformance.resolutionRate) {
      return null; // No previous data to compare
    }

    // Calculate improvement percentage
    const improvement = currentResolutionRate - previousPerformance.resolutionRate;

    // Normalize to 0-100 score (0 = no improvement, 100 = significant improvement)
    // +10% improvement = 100 points, 0% = 50 points, -10% = 0 points
    const score = 50 + (improvement * 5);

    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Error calculating improvement score:', error);
    return null;
  }
}

/**
 * Get week number of the year
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Get date range for a period
 */
function getPeriodDateRange(period: string, periodType: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case 'daily':
      startDate = new Date(period);
      endDate = new Date(period);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      // Parse format: '2025-W46'
      const [year, weekStr] = period.split('-W');
      const weekNum = parseInt(weekStr);
      startDate = getDateOfISOWeek(weekNum, parseInt(year));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      // Parse format: '2025-11'
      const [y, m] = period.split('-');
      startDate = new Date(parseInt(y), parseInt(m) - 1, 1);
      endDate = new Date(parseInt(y), parseInt(m), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate = now;
      endDate = now;
  }

  return { startDate, endDate };
}

/**
 * Get the date of the Monday of a given ISO week
 */
function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

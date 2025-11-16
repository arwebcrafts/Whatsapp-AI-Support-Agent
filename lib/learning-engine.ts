import { prisma } from "@/lib/prisma";

/**
 * Agent Learning Engine
 * Analyzes conversations to generate insights and improve agent performance
 */

interface ConversationPattern {
  trigger: string;
  response: string;
  category: string;
  successRate: number;
  count: number;
}

/**
 * Analyze successful conversations to identify patterns
 */
export async function analyzeSuccessfulPatterns(
  agentId: string,
  userId: string,
  limit: number = 50
): Promise<ConversationPattern[]> {
  try {
    // Get successful conversations
    const successfulAnalytics = await prisma.conversationAnalytics.findMany({
      where: {
        agentId,
        userId,
        wasSuccessful: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    if (successfulAnalytics.length === 0) {
      return [];
    }

    // Get conversation messages
    const conversationIds = successfulAnalytics.map(a => a.conversationId);
    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const patterns: Map<string, ConversationPattern> = new Map();

    // Analyze message patterns
    conversations.forEach(conv => {
      const messages = conv.messages;

      for (let i = 0; i < messages.length - 1; i++) {
        const customerMsg = messages[i];
        const agentMsg = messages[i + 1];

        // Look for customer question → agent response patterns
        if (customerMsg.senderType === 'customer' &&
            (agentMsg.senderType === 'ai' || agentMsg.senderType === 'user')) {

          const trigger = customerMsg.messageText?.toLowerCase().trim() || '';
          const response = agentMsg.messageText?.toLowerCase().trim() || '';

          if (trigger && response) {
            // Categorize the pattern
            const category = categorizeMessage(trigger);

            // Create pattern key
            const patternKey = `${category}:${trigger.substring(0, 50)}`;

            if (patterns.has(patternKey)) {
              const existing = patterns.get(patternKey)!;
              existing.count++;
            } else {
              patterns.set(patternKey, {
                trigger,
                response,
                category,
                successRate: 1.0,
                count: 1
              });
            }
          }
        }
      }
    });

    return Array.from(patterns.values())
      .filter(p => p.count >= 2) // Only patterns that appear multiple times
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error analyzing successful patterns:', error);
    return [];
  }
}

/**
 * Categorize message based on content
 */
function categorizeMessage(message: string): string {
  const lowerMsg = message.toLowerCase();

  // Greeting patterns
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMsg)) {
    return 'greeting';
  }

  // Pricing questions
  if (/(price|cost|how much|pricing|payment|afford)/i.test(lowerMsg)) {
    return 'pricing';
  }

  // Product information
  if (/(what is|tell me about|information|details|feature|benefit)/i.test(lowerMsg)) {
    return 'product_info';
  }

  // Support requests
  if (/(help|support|problem|issue|not working|error|fix)/i.test(lowerMsg)) {
    return 'support';
  }

  // Booking/scheduling
  if (/(book|schedule|appointment|meeting|when|available)/i.test(lowerMsg)) {
    return 'booking';
  }

  // Objections
  if (/(expensive|too much|not sure|thinking about|maybe later)/i.test(lowerMsg)) {
    return 'objection_handling';
  }

  // Closing
  if (/(buy|purchase|order|get started|sign up)/i.test(lowerMsg)) {
    return 'closing';
  }

  return 'general';
}

/**
 * Generate insights from conversation patterns
 */
export async function generateInsights(
  agentId: string,
  userId: string
): Promise<number> {
  try {
    console.log(`🧠 Generating insights for agent ${agentId}...`);

    // Analyze successful patterns
    const patterns = await analyzeSuccessfulPatterns(agentId, userId, 100);

    let insightsCreated = 0;

    // Create insights for high-frequency patterns
    for (const pattern of patterns) {
      if (pattern.count >= 3) {
        // Only create insights for patterns seen 3+ times
        const existingInsight = await prisma.conversationInsight.findFirst({
          where: {
            agentId,
            userId,
            category: pattern.category,
            triggerPattern: pattern.trigger.substring(0, 100)
          }
        });

        if (!existingInsight) {
          // Create new insight
          await prisma.conversationInsight.create({
            data: {
              agentId,
              userId,
              insightType: 'successful_pattern',
              title: `Effective ${pattern.category} response`,
              description: `This response pattern has been successful ${pattern.count} times when customers ask about ${pattern.category}.`,
              triggerPattern: pattern.trigger,
              responsePattern: pattern.response,
              successRate: pattern.successRate,
              usageCount: pattern.count,
              confidence: calculateConfidence(pattern.count),
              category: pattern.category,
              isActive: true,
              isApproved: false
            }
          });

          insightsCreated++;

          // Log the learning event
          await logLearningEvent(
            agentId,
            userId,
            'insight_discovered',
            `Discovered successful ${pattern.category} pattern`,
            calculateImpactScore(pattern.count)
          );
        } else {
          // Update existing insight
          await prisma.conversationInsight.update({
            where: { id: existingInsight.id },
            data: {
              usageCount: pattern.count,
              successRate: pattern.successRate,
              confidence: calculateConfidence(pattern.count),
              updatedAt: new Date()
            }
          });
        }
      }
    }

    // Identify common customer questions
    await identifyCommonQuestions(agentId, userId);

    // Identify areas needing improvement
    await identifyImprovementAreas(agentId, userId);

    console.log(`✅ Generated ${insightsCreated} new insights for agent ${agentId}`);
    return insightsCreated;
  } catch (error) {
    console.error('Error generating insights:', error);
    return 0;
  }
}

/**
 * Identify common customer questions
 */
async function identifyCommonQuestions(
  agentId: string,
  userId: string
): Promise<void> {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { agentId, userId },
      include: {
        messages: {
          where: { senderType: 'customer' },
          orderBy: { createdAt: 'asc' }
        }
      },
      take: 100
    });

    const questionCounts = new Map<string, number>();

    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        const text = msg.messageText?.toLowerCase().trim();
        if (text && text.includes('?')) {
          // Extract question
          const question = text.substring(0, 100);
          questionCounts.set(
            question,
            (questionCounts.get(question) || 0) + 1
          );
        }
      });
    });

    // Create insights for frequently asked questions
    for (const [question, count] of questionCounts.entries()) {
      if (count >= 5) {
        const existing = await prisma.conversationInsight.findFirst({
          where: {
            agentId,
            userId,
            insightType: 'common_question',
            triggerPattern: question
          }
        });

        if (!existing) {
          await prisma.conversationInsight.create({
            data: {
              agentId,
              userId,
              insightType: 'common_question',
              title: 'Frequently asked question',
              description: `This question appears ${count} times. Consider adding to FAQ or knowledge base.`,
              triggerPattern: question,
              usageCount: count,
              confidence: calculateConfidence(count),
              category: 'general',
              isActive: true,
              isApproved: false
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error identifying common questions:', error);
  }
}

/**
 * Identify areas needing improvement
 */
async function identifyImprovementAreas(
  agentId: string,
  userId: string
): Promise<void> {
  try {
    const analytics = await prisma.conversationAnalytics.findMany({
      where: {
        agentId,
        userId,
        needsImprovement: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Group by improvement type
    const slowResponses = analytics.filter(a => a.avgResponseTime && a.avgResponseTime > 180);
    const poorSentiment = analytics.filter(a => a.sentimentScore && a.sentimentScore < -0.2);
    const unresolved = analytics.filter(a => a.resolutionStatus !== 'resolved');

    // Create improvement insights
    if (slowResponses.length >= 3) {
      await createOrUpdateInsight(agentId, userId, {
        insightType: 'performance_issue',
        title: 'Slow response times detected',
        description: `${slowResponses.length} conversations have slow response times (>3 minutes). Consider improving response speed.`,
        category: 'performance',
        confidence: 0.8
      });
    }

    if (poorSentiment.length >= 3) {
      await createOrUpdateInsight(agentId, userId, {
        insightType: 'performance_issue',
        title: 'Negative sentiment detected',
        description: `${poorSentiment.length} conversations show negative customer sentiment. Review tone and approach.`,
        category: 'sentiment',
        confidence: 0.7
      });
    }

    if (unresolved.length >= 5) {
      await createOrUpdateInsight(agentId, userId, {
        insightType: 'performance_issue',
        title: 'Low resolution rate',
        description: `${unresolved.length} conversations remain unresolved. Review and improve resolution strategies.`,
        category: 'resolution',
        confidence: 0.9
      });
    }
  } catch (error) {
    console.error('Error identifying improvement areas:', error);
  }
}

/**
 * Create or update insight
 */
async function createOrUpdateInsight(
  agentId: string,
  userId: string,
  data: {
    insightType: string;
    title: string;
    description: string;
    category: string;
    confidence: number;
  }
): Promise<void> {
  const existing = await prisma.conversationInsight.findFirst({
    where: {
      agentId,
      userId,
      insightType: data.insightType,
      category: data.category
    }
  });

  if (existing) {
    await prisma.conversationInsight.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        confidence: data.confidence,
        updatedAt: new Date()
      }
    });
  } else {
    await prisma.conversationInsight.create({
      data: {
        agentId,
        userId,
        insightType: data.insightType,
        title: data.title,
        description: data.description,
        category: data.category,
        confidence: data.confidence,
        isActive: true,
        isApproved: false
      }
    });
  }
}

/**
 * Calculate confidence score based on sample size
 */
function calculateConfidence(count: number): number {
  // More occurrences = higher confidence
  // 1-2 occurrences = 0.3, 3-5 = 0.5, 6-10 = 0.7, 11+ = 0.9
  if (count >= 11) return 0.9;
  if (count >= 6) return 0.7;
  if (count >= 3) return 0.5;
  return 0.3;
}

/**
 * Calculate impact score for learning events
 */
function calculateImpactScore(count: number): number {
  // Impact based on frequency
  return Math.min(100, count * 5);
}

/**
 * Log a learning event
 */
export async function logLearningEvent(
  agentId: string,
  userId: string,
  eventType: string,
  description: string,
  impactScore?: number
): Promise<void> {
  try {
    await prisma.agentLearningLog.create({
      data: {
        agentId,
        userId,
        eventType,
        eventData: JSON.stringify({ timestamp: new Date() }),
        description,
        impactScore
      }
    });

    console.log(`📝 Learning event logged: ${description}`);
  } catch (error) {
    console.error('Error logging learning event:', error);
  }
}

/**
 * Run full learning cycle for an agent
 */
export async function runLearningCycle(
  agentId: string,
  userId: string
): Promise<{
  insightsGenerated: number;
  performanceUpdated: boolean;
}> {
  try {
    console.log(`🎯 Running learning cycle for agent ${agentId}...`);

    // Import analytics service
    const { updateAgentPerformance } = await import('./analytics-service');

    // Generate insights
    const insightsGenerated = await generateInsights(agentId, userId);

    // Update performance metrics
    await updateAgentPerformance(agentId, userId, 'daily');
    await updateAgentPerformance(agentId, userId, 'weekly');
    await updateAgentPerformance(agentId, userId, 'monthly');

    // Log the learning cycle
    await logLearningEvent(
      agentId,
      userId,
      'learning_cycle_completed',
      `Learning cycle completed. Generated ${insightsGenerated} insights.`,
      insightsGenerated * 10
    );

    console.log(`✅ Learning cycle completed for agent ${agentId}`);

    return {
      insightsGenerated,
      performanceUpdated: true
    };
  } catch (error) {
    console.error('Error running learning cycle:', error);
    return {
      insightsGenerated: 0,
      performanceUpdated: false
    };
  }
}

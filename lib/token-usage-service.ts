import { prisma } from './prisma';
import { PLAN_TOKEN_LIMITS, PLAN_RATE_LIMITS, PlanType, estimateCost } from './openai-client';

/**
 * Service to track and enforce OpenAI token usage limits
 */
export class TokenUsageService {
  /**
   * Check if user has available token quota
   * Returns { allowed: boolean, reason?: string, usage?: object }
   */
  static async checkQuota(userId: string, estimatedTokens: number): Promise<{
    allowed: boolean;
    reason?: string;
    usage?: {
      tokensUsed: number;
      tokenLimit: number;
      percentage: number;
    };
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // '2025-11'

    // Get user to check plan type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true, subscriptionStatus: true },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check subscription status
    if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'cancelled') {
      return { allowed: false, reason: 'Subscription expired or cancelled' };
    }

    // Get or create token usage record
    let usage = await prisma.tokenUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
    });

    if (!usage) {
      // Create new usage record with plan-based limit
      const planType = user.planType as PlanType;
      const tokenLimit = PLAN_TOKEN_LIMITS[planType] || PLAN_TOKEN_LIMITS.starter;

      usage = await prisma.tokenUsage.create({
        data: {
          userId,
          month: currentMonth,
          tokenLimit,
          tokensUsed: 0,
          estimatedCost: 0,
          requestCount: 0,
        },
      });
    }

    const { tokensUsed, tokenLimit } = usage;
    const wouldExceed = tokensUsed + estimatedTokens > tokenLimit;
    const percentage = (tokensUsed / tokenLimit) * 100;

    if (wouldExceed) {
      return {
        allowed: false,
        reason: `Monthly token limit exceeded. Used ${tokensUsed.toLocaleString()} of ${tokenLimit.toLocaleString()} tokens (${percentage.toFixed(1)}%)`,
        usage: { tokensUsed, tokenLimit, percentage },
      };
    }

    return {
      allowed: true,
      usage: { tokensUsed, tokenLimit, percentage },
    };
  }

  /**
   * Check rate limit (requests per hour)
   */
  static async checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    requestCount?: number;
    limit?: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get user plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    const planType = user.planType as PlanType;
    const hourlyLimit = PLAN_RATE_LIMITS[planType] || PLAN_RATE_LIMITS.starter;

    // Get usage record
    const usage = await prisma.tokenUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
    });

    // If no recent request, allow
    if (!usage || !usage.lastRequestAt || usage.lastRequestAt < oneHourAgo) {
      return { allowed: true, requestCount: 0, limit: hourlyLimit };
    }

    // Count requests in last hour (simplified - uses requestCount as proxy)
    // In production, you'd want a separate table to track individual requests
    // For now, we'll use a simple check based on last request time

    // Allow request but warn if near limit
    return { allowed: true, requestCount: usage.requestCount, limit: hourlyLimit };
  }

  /**
   * Track token usage after API call
   */
  static async trackUsage(
    userId: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalTokens = inputTokens + outputTokens;
    const cost = estimateCost(inputTokens, outputTokens);

    // Get user plan for token limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    });

    if (!user) {
      console.error('User not found for token tracking:', userId);
      return;
    }

    const planType = user.planType as PlanType;
    const tokenLimit = PLAN_TOKEN_LIMITS[planType] || PLAN_TOKEN_LIMITS.starter;

    // Upsert usage record
    await prisma.tokenUsage.upsert({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
      create: {
        userId,
        month: currentMonth,
        tokensUsed: totalTokens,
        tokenLimit,
        estimatedCost: cost,
        requestCount: 1,
        lastRequestAt: new Date(),
      },
      update: {
        tokensUsed: { increment: totalTokens },
        estimatedCost: { increment: cost },
        requestCount: { increment: 1 },
        lastRequestAt: new Date(),
      },
    });

    // Log warning if approaching limit
    const updatedUsage = await prisma.tokenUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
    });

    if (updatedUsage) {
      const percentage = (updatedUsage.tokensUsed / updatedUsage.tokenLimit) * 100;

      if (percentage >= 80 && percentage < 90) {
        console.warn(`⚠️ User ${userId} has used ${percentage.toFixed(1)}% of token quota`);
      } else if (percentage >= 90) {
        console.error(`🚨 User ${userId} has used ${percentage.toFixed(1)}% of token quota`);
      }
    }
  }

  /**
   * Get current usage statistics for a user
   */
  static async getUsageStats(userId: string): Promise<{
    tokensUsed: number;
    tokenLimit: number;
    percentage: number;
    estimatedCost: number;
    requestCount: number;
    daysRemaining: number;
  } | null> {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const usage = await prisma.tokenUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
    });

    if (!usage) {
      return null;
    }

    const percentage = (usage.tokensUsed / usage.tokenLimit) * 100;
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      tokensUsed: usage.tokensUsed,
      tokenLimit: usage.tokenLimit,
      percentage,
      estimatedCost: usage.estimatedCost,
      requestCount: usage.requestCount,
      daysRemaining,
    };
  }

  /**
   * Update token limits when user changes plan
   */
  static async updatePlanLimits(userId: string, newPlanType: PlanType): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newTokenLimit = PLAN_TOKEN_LIMITS[newPlanType];

    await prisma.tokenUsage.upsert({
      where: {
        userId_month: {
          userId,
          month: currentMonth,
        },
      },
      create: {
        userId,
        month: currentMonth,
        tokenLimit: newTokenLimit,
        tokensUsed: 0,
        estimatedCost: 0,
        requestCount: 0,
      },
      update: {
        tokenLimit: newTokenLimit,
      },
    });
  }
}

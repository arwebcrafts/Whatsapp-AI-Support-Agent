/**
 * Plan Limits Configuration
 *
 * Centralized configuration for all plan types and their limits.
 * This makes it easy to manage limits across the application.
 */

export interface PlanLimits {
  messageLimit: number;
  agentLimit: number;
  connectionLimit: number;
  knowledgeBaseLimit: number;
  tokenLimit: number;
  isUnlimited: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  // Starter Plan - $9/month
  starter: {
    messageLimit: 3000,      // 3,000 messages/month
    agentLimit: 1,           // 1 AI agent
    connectionLimit: 1,      // 1 WhatsApp number
    knowledgeBaseLimit: 5,   // 5 knowledge base items
    tokenLimit: 750000,      // ~750K tokens/month
    isUnlimited: false,
  },
  // Professional Plan - $19/month
  professional: {
    messageLimit: 10000,     // 10,000 messages/month
    agentLimit: 3,           // 3 AI agents
    connectionLimit: 3,      // 3 WhatsApp numbers
    knowledgeBaseLimit: 15,  // 15 knowledge base items
    tokenLimit: 2500000,     // ~2.5M tokens/month
    isUnlimited: false,
  },
  // Business Plan - $39/month
  business: {
    messageLimit: 20000,     // 20,000 messages/month
    agentLimit: 10,          // 10 AI agents
    connectionLimit: 10,     // 10 WhatsApp numbers
    knowledgeBaseLimit: 50,  // 50 knowledge base items
    tokenLimit: 6000000,     // ~6M tokens/month
    isUnlimited: false,
  },
  // Lifetime Starter - $79 one-time
  lifetime_starter: {
    messageLimit: 3000,      // 3,000 messages/month
    agentLimit: 1,
    connectionLimit: 1,
    knowledgeBaseLimit: 5,
    tokenLimit: 750000,
    isUnlimited: false,
  },
  // Lifetime Professional - $149 one-time
  lifetime_professional: {
    messageLimit: 10000,     // 10,000 messages/month
    agentLimit: 3,
    connectionLimit: 3,
    knowledgeBaseLimit: 15,
    tokenLimit: 2500000,
    isUnlimited: false,
  },
  // Lifetime Business - $199 one-time
  lifetime_business: {
    messageLimit: 20000,     // 20,000 messages/month
    agentLimit: 10,
    connectionLimit: 10,
    knowledgeBaseLimit: 50,
    tokenLimit: 6000000,
    isUnlimited: false,
  },
  // Admin Access - Unlimited (for you/team)
  admin_access: {
    messageLimit: 999999999,
    agentLimit: 999999999,
    connectionLimit: 999999999,
    knowledgeBaseLimit: 999999999,
    tokenLimit: 999999999,
    isUnlimited: true,
  },
};

/**
 * Get plan limits for a specific plan type
 */
export function getPlanLimits(planType: string): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.starter;
}

/**
 * Check if user has reached their plan limit
 */
export function hasReachedLimit(
  currentUsage: number,
  planType: string,
  limitType: keyof Omit<PlanLimits, 'isUnlimited'>
): boolean {
  const limits = getPlanLimits(planType);

  // Admin access users never reach limits
  if (limits.isUnlimited) {
    return false;
  }

  return currentUsage >= limits[limitType];
}

/**
 * Get remaining usage for a specific limit
 */
export function getRemainingUsage(
  currentUsage: number,
  planType: string,
  limitType: keyof Omit<PlanLimits, 'isUnlimited'>
): number {
  const limits = getPlanLimits(planType);

  // Admin access users have unlimited remaining
  if (limits.isUnlimited) {
    return Infinity;
  }

  return Math.max(0, limits[limitType] - currentUsage);
}

/**
 * Check if a plan type is valid
 */
export function isValidPlanType(planType: string): boolean {
  return planType in PLAN_LIMITS;
}

/**
 * Get all available plan types
 */
export function getAllPlanTypes(): string[] {
  return Object.keys(PLAN_LIMITS);
}

/**
 * Check if user has admin access plan
 */
export function hasAdminAccess(planType: string): boolean {
  return planType === 'admin_access';
}

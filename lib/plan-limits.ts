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
  starter: {
    messageLimit: 2000,
    agentLimit: 1,
    connectionLimit: 1,
    knowledgeBaseLimit: 5,
    tokenLimit: 500000,
    isUnlimited: false,
  },
  professional: {
    messageLimit: 5000,
    agentLimit: 3,
    connectionLimit: 3,
    knowledgeBaseLimit: 15,
    tokenLimit: 1500000,
    isUnlimited: false,
  },
  business: {
    messageLimit: 12000,
    agentLimit: 10,
    connectionLimit: 10,
    knowledgeBaseLimit: 50,
    tokenLimit: 5000000,
    isUnlimited: false,
  },
  admin_access: {
    messageLimit: 999999999, // Unlimited
    agentLimit: 999999999, // Unlimited
    connectionLimit: 999999999, // Unlimited
    knowledgeBaseLimit: 999999999, // Unlimited
    tokenLimit: 999999999, // Unlimited
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

import OpenAI from 'openai';

/**
 * Singleton OpenAI client to avoid creating new instances per request
 * This improves performance and reduces overhead
 */
class OpenAIClientSingleton {
  private static instance: OpenAI | null = null;

  private constructor() {}

  public static getInstance(): OpenAI {
    if (!OpenAIClientSingleton.instance) {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured in environment variables');
      }

      OpenAIClientSingleton.instance = new OpenAI({
        apiKey,
        timeout: 30000, // 30 second timeout to prevent hanging requests
        maxRetries: 2, // Retry failed requests up to 2 times
      });
    }

    return OpenAIClientSingleton.instance;
  }
}

/**
 * Get the singleton OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
  return OpenAIClientSingleton.getInstance();
}

/**
 * Estimate token count for text (rough approximation)
 * More accurate than nothing, good enough for budget tracking
 * Actual tokens may vary by ~20%
 */
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is a conservative estimate to avoid underestimating costs
  return Math.ceil(text.length / 3.5);
}

/**
 * Calculate estimated OpenAI API cost based on tokens
 * Prices as of January 2025 for GPT-4o-mini
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_1K = 0.00015; // $0.15 per 1M input tokens
  const OUTPUT_COST_PER_1K = 0.0006;  // $0.60 per 1M output tokens

  const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
  const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;

  return inputCost + outputCost;
}

/**
 * Plan-based token limits per month
 * These limits prevent runaway costs
 */
export const PLAN_TOKEN_LIMITS = {
  starter: 500000,      // ~500K tokens/month (~$75 worth)
  professional: 2000000, // ~2M tokens/month (~$300 worth)
  business: 10000000,    // ~10M tokens/month (~$1500 worth)
  lifetime: 10000000,    // Same as business
} as const;

/**
 * Plan-based rate limits (requests per hour)
 */
export const PLAN_RATE_LIMITS = {
  starter: 100,      // 100 AI requests per hour
  professional: 300, // 300 AI requests per hour
  business: 1000,    // 1000 AI requests per hour
  lifetime: 1000,    // Same as business
} as const;

export type PlanType = keyof typeof PLAN_TOKEN_LIMITS;

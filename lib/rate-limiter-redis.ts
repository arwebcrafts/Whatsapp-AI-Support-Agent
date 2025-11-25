import { NextRequest, NextResponse } from 'next/server';

/**
 * Production-ready rate limiter with Redis support
 *
 * SUPPORTS TWO REDIS OPTIONS:
 *
 * 1. Railway Redis (Recommended for Railway deployment):
 *    - Add Redis plugin in Railway dashboard
 *    - Railway auto-provides: REDIS_URL
 *    - No additional setup needed!
 *
 * 2. Upstash Redis (Alternative - free tier):
 *    - Go to https://upstash.com
 *    - Create database
 *    - Add: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 *
 * Priority: Checks Railway REDIS_URL first, then falls back to Upstash
 */

// Lazy load Redis clients to avoid errors if not configured
let redisClient: any = null;
let isRedisAvailable = false;
let redisType: 'railway' | 'upstash' | 'memory' = 'memory';

async function getRedisClient() {
  if (redisClient) return { client: redisClient, type: redisType };

  // Option 1: Railway Redis (native Redis URL)
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const Redis = (await import('ioredis')).default;
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        enableOfflineQueue: true,
      });

      isRedisAvailable = true;
      redisType = 'railway';
      console.log('✅ Railway Redis rate limiter connected successfully');
      return { client: redisClient, type: redisType };
    } catch (error) {
      console.error('❌ Failed to connect to Railway Redis:', error);
      redisClient = null;
    }
  }

  // Option 2: Upstash Redis REST (fallback)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
      isRedisAvailable = true;
      redisType = 'upstash';
      console.log('✅ Upstash Redis rate limiter connected successfully');
      return { client: redisClient, type: redisType };
    } catch (error) {
      console.error('❌ Failed to initialize Upstash Redis:', error);
      redisClient = null;
    }
  }

  // No Redis configured
  console.warn('⚠️ Redis not configured, falling back to in-memory rate limiter');
  console.warn('💡 For production, add Railway Redis plugin or set up Upstash Redis');
  isRedisAvailable = false;
  redisType = 'memory';
  return { client: null, type: redisType };
}

/**
 * In-memory fallback for local development
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    this.requests.set(identifier, record);

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();
setInterval(() => inMemoryLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Redis-based rate limiter with in-memory fallback
 */
export async function checkRateLimitRedis(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const { client: redisInstance, type } = await getRedisClient();

  // Fallback to in-memory if Redis not available
  if (!redisInstance) {
    return inMemoryLimiter.check(identifier, maxRequests, windowMs);
  }

  try {
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);
    const key = `ratelimit:${identifier}`;

    let count: number;
    let ttl: number;

    if (type === 'railway') {
      // ioredis pipeline returns [[null, result], [null, result]]
      const pipeline = redisInstance.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      const results = await pipeline.exec();

      count = results[0][1] as number;
      ttl = results[1][1] as number;

      // Set expiry on first request
      if (count === 1) {
        await redisInstance.expire(key, windowSeconds);
      }
    } else {
      // Upstash Redis REST API returns results directly
      const pipeline = redisInstance.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      const results = await pipeline.exec();

      count = results[0] as number;
      ttl = results[1] as number;

      // Set expiry on first request
      if (count === 1) {
        await redisInstance.expire(key, windowSeconds);
      }
    }

    const resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs);
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return {
      allowed,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('❌ Redis rate limit check failed:', error);
    // Fallback to in-memory on Redis errors
    return inMemoryLimiter.check(identifier, maxRequests, windowMs);
  }
}

/**
 * Get client identifier (IP address or fallback)
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try multiple headers for IP detection
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  return (
    cfConnectingIp ||
    realIp ||
    forwarded?.split(',')[0] ||
    'unknown'
  );
}

/**
 * Rate limit middleware with Redis support
 * Returns NextResponse with 429 if rate limit exceeded
 */
export async function checkRateLimit(
  req: NextRequest,
  options: {
    identifier?: string;
    maxRequests: number;
    windowMs: number;
    message?: string;
  }
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const identifier = options.identifier || getClientIdentifier(req);
  const result = await checkRateLimitRedis(identifier, options.maxRequests, options.windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    return {
      allowed: false,
      response: NextResponse.json(
        {
          message: options.message || 'Too many requests. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          },
        }
      ),
    };
  }

  return { allowed: true };
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // Auth endpoints - strict
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  // Signup - very strict to prevent abuse
  SIGNUP: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again in 1 hour.',
  },
  // Email verification - prevent enumeration
  EMAIL_VERIFY: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many verification attempts. Please try again in 1 hour.',
  },
  // Email resend - prevent spam
  EMAIL_RESEND: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many email resend requests. Please try again in 1 hour.',
  },
  // Admin endpoints - very strict
  ADMIN: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many admin requests. Please try again later.',
  },
  // General API - moderate
  API: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many API requests. Please try again later.',
  },
};

export default checkRateLimit;

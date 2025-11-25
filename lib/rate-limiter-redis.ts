import { NextRequest, NextResponse } from 'next/server';

/**
 * Redis-based rate limiter using Upstash Redis
 *
 * SETUP:
 * 1. Create free Upstash Redis account: https://upstash.com
 * 2. Create a database and get credentials
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
 *    UPSTASH_REDIS_REST_TOKEN="your-token"
 * 4. Install package: npm install @upstash/redis
 */

// Lazy load Redis to avoid errors if not configured
let redis: any = null;
let isRedisAvailable = false;

async function getRedisClient() {
  if (redis) return redis;

  // Check if Redis credentials are configured
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('⚠️ Redis not configured, falling back to in-memory rate limiter');
    console.warn('💡 For production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    isRedisAvailable = false;
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    isRedisAvailable = true;
    console.log('✅ Redis rate limiter connected successfully');
    return redis;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    console.warn('⚠️ Falling back to in-memory rate limiter');
    isRedisAvailable = false;
    return null;
  }
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
  const redisClient = await getRedisClient();

  // Fallback to in-memory if Redis not available
  if (!redisClient) {
    return inMemoryLimiter.check(identifier, maxRequests, windowMs);
  }

  try {
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);
    const key = `ratelimit:${identifier}`;

    // Use Redis pipeline for atomic operations
    const pipeline = redisClient.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);

    const results = await pipeline.exec();
    const count = results[0] as number;
    const ttl = results[1] as number;

    // Set expiry on first request
    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
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

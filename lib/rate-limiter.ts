import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or another persistent store
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if request is within rate limit
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // If no record or window expired, create new record
    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Increment count
    record.count++;
    this.requests.set(identifier, record);

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Clean up expired records (should be called periodically)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

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
 * Rate limit middleware
 * Returns NextResponse with 429 if rate limit exceeded
 */
export function checkRateLimit(
  req: NextRequest,
  options: {
    identifier?: string;
    maxRequests: number;
    windowMs: number;
    message?: string;
  }
): { allowed: boolean; response?: NextResponse } {
  const identifier = options.identifier || getClientIdentifier(req);
  const result = rateLimiter.check(identifier, options.maxRequests, options.windowMs);

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

export default rateLimiter;

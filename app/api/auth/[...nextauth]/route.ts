import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"
// PRODUCTION: Use Redis rate limiter for scalability
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limiter-redis"

const handler = NextAuth(authOptions)

// Wrap NextAuth handler with rate limiting
async function rateLimitedHandler(req: NextRequest, context: any) {
  try {
    // Only rate limit login attempts (POST to /api/auth/callback/credentials)
    // Use nextUrl.pathname which is always available and safe
    const pathname = req.nextUrl?.pathname || '';
    if (req.method === 'POST' && pathname.includes('/callback/credentials')) {
      const rateLimit = await checkRateLimit(req, RateLimitPresets.AUTH);
      if (!rateLimit.allowed) {
        return rateLimit.response!;
      }
    }

    return handler(req, context);
  } catch (error: any) {
    // Log but don't fail on URL parsing errors - let NextAuth handle the request
    if (error?.message?.includes('Invalid URL')) {
      console.warn('URL parsing warning in auth handler:', error.message);
      return handler(req, context);
    }
    throw error;
  }
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }

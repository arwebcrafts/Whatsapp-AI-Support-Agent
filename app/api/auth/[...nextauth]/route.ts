import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"
// PRODUCTION: Use Redis rate limiter for scalability
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limiter-redis"

const handler = NextAuth(authOptions)

// Wrap NextAuth handler with rate limiting
async function rateLimitedHandler(req: NextRequest, context: any) {
  // Only rate limit login attempts (POST to /api/auth/callback/credentials)
  if (req.method === 'POST' && req.url.includes('/callback/credentials')) {
    const rateLimit = await checkRateLimit(req, RateLimitPresets.AUTH);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
  }

  return handler(req, context);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }

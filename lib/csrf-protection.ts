import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection using Double Submit Cookie pattern
 *
 * How it works:
 * 1. Server generates a random token and sends it to client in both:
 *    - A cookie (HttpOnly, Secure, SameSite)
 *    - Response body/header (for client to include in requests)
 * 2. Client must send token back in both:
 *    - Cookie (automatically sent by browser)
 *    - Custom header (X-CSRF-Token)
 * 3. Server verifies both match
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-change-me';

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(crypto.randomBytes(32).toString('hex'))
    .digest('hex');
}

/**
 * Set CSRF token cookie in response
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

/**
 * Get CSRF token from request
 */
export function getCsrfTokenFromRequest(req: NextRequest): {
  cookieToken: string | null;
  headerToken: string | null;
} {
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value || null;
  const headerToken = req.headers.get(CSRF_HEADER_NAME) || null;

  return { cookieToken, headerToken };
}

/**
 * Validate CSRF token
 * Returns true if valid, false otherwise
 */
export function validateCsrfToken(req: NextRequest): boolean {
  const { cookieToken, headerToken } = getCsrfTokenFromRequest(req);

  // Both tokens must exist
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must match
  return cookieToken === headerToken;
}

/**
 * CSRF protection middleware
 * Use this to protect state-changing endpoints (POST, PUT, PATCH, DELETE)
 */
export function checkCsrfProtection(req: NextRequest): {
  valid: boolean;
  response?: NextResponse;
} {
  // Only check CSRF for state-changing methods
  const statefulMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!statefulMethods.includes(req.method)) {
    return { valid: true };
  }

  // Validate CSRF token
  if (!validateCsrfToken(req)) {
    console.warn('🚨 SECURITY: CSRF validation failed');
    return {
      valid: false,
      response: NextResponse.json(
        {
          message: 'Invalid CSRF token. Please refresh the page and try again.',
          code: 'CSRF_VALIDATION_FAILED',
        },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Create a response with CSRF token
 * Use this for GET requests that render forms
 */
export function createResponseWithCsrfToken(data: any, status: number = 200): NextResponse {
  const token = generateCsrfToken();
  const response = NextResponse.json(
    {
      ...data,
      csrfToken: token,
    },
    { status }
  );

  return setCsrfCookie(response, token);
}

/**
 * Exempted routes that don't need CSRF protection
 * Add routes here that are already protected by other means
 */
export const CSRF_EXEMPT_ROUTES = [
  '/api/auth',          // NextAuth handles its own CSRF
  '/api/stripe/webhook', // Stripe signature verification
];

/**
 * Check if route is exempt from CSRF protection
 */
export function isRouteExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some(route => pathname.startsWith(route));
}

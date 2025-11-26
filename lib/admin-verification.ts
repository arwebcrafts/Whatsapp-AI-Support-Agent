import crypto from 'crypto';

/**
 * Admin Login Verification Service
 *
 * Generates and manages one-time verification codes for admin logins.
 * Codes are sent via email and expire after 10 minutes.
 */

interface AdminVerificationCode {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory store for verification codes (for production, use Redis)
const verificationCodes = new Map<string, AdminVerificationCode>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [key, value] of verificationCodes.entries()) {
    if (now > value.expiresAt) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store verification code for admin login
 */
export function storeAdminVerificationCode(email: string, code: string): void {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  verificationCodes.set(email.toLowerCase(), {
    code,
    email: email.toLowerCase(),
    expiresAt,
    attempts: 0,
  });

  console.log(`🔐 Admin verification code generated for ${email} (expires in 10 min)`);
}

/**
 * Verify admin login code
 */
export function verifyAdminCode(email: string, code: string): {
  valid: boolean;
  message: string;
  attemptsLeft?: number;
} {
  const stored = verificationCodes.get(email.toLowerCase());

  if (!stored) {
    return {
      valid: false,
      message: 'No verification code found. Please request a new one.',
    };
  }

  // Check expiration
  if (new Date() > stored.expiresAt) {
    verificationCodes.delete(email.toLowerCase());
    return {
      valid: false,
      message: 'Verification code has expired. Please login again.',
    };
  }

  // Check attempts (max 3)
  if (stored.attempts >= 3) {
    verificationCodes.delete(email.toLowerCase());
    return {
      valid: false,
      message: 'Too many failed attempts. Please login again.',
    };
  }

  // Verify code
  if (stored.code !== code) {
    stored.attempts++;
    const attemptsLeft = 3 - stored.attempts;

    return {
      valid: false,
      message: `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
      attemptsLeft,
    };
  }

  // Code is valid - remove it (one-time use)
  verificationCodes.delete(email.toLowerCase());

  return {
    valid: true,
    message: 'Verification successful!',
  };
}

/**
 * Check if admin has pending verification
 */
export function hasPendingVerification(email: string): boolean {
  const stored = verificationCodes.get(email.toLowerCase());
  if (!stored) return false;

  // Check if expired
  if (new Date() > stored.expiresAt) {
    verificationCodes.delete(email.toLowerCase());
    return false;
  }

  return true;
}

/**
 * Clear verification code (e.g., on logout)
 */
export function clearAdminVerificationCode(email: string): void {
  verificationCodes.delete(email.toLowerCase());
}

// Store for verified admin sessions (temporary, expires in 1 minute)
const verifiedAdminSessions = new Map<string, { email: string; expiresAt: Date }>();

// Clean up expired verified sessions every minute
setInterval(() => {
  const now = new Date();
  for (const [token, value] of verifiedAdminSessions.entries()) {
    if (now > value.expiresAt) {
      verifiedAdminSessions.delete(token);
    }
  }
}, 60 * 1000);

/**
 * Create a temporary verified session token
 */
export function createVerifiedAdminToken(email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

  verifiedAdminSessions.set(token, {
    email: email.toLowerCase(),
    expiresAt,
  });

  console.log(`✅ Admin verified token created for ${email} (expires in 1 min)`);
  return token;
}

/**
 * Verify and consume admin verified token
 */
export function consumeVerifiedAdminToken(token: string): string | null {
  const session = verifiedAdminSessions.get(token);

  if (!session) {
    return null;
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    verifiedAdminSessions.delete(token);
    return null;
  }

  // Token is valid - consume it (one-time use)
  verifiedAdminSessions.delete(token);
  return session.email;
}

/**
 * Generate admin login verification email HTML
 */
export function generateAdminLoginVerificationEmail(name: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Login Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Admin Login Verification</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}!</h2>

        <p style="font-size: 16px; color: #4b5563;">
          A login attempt was made to your admin account. Please use the verification code below to complete your login:
        </p>

        <div style="background: white; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; border: 2px solid #dc2626;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">Your Verification Code:</p>
          <p style="font-size: 48px; font-weight: bold; color: #dc2626; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${code}
          </p>
        </div>

        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            <strong>⚠️ Security Notice:</strong><br>
            • This code expires in 10 minutes<br>
            • You have 3 attempts to enter the correct code<br>
            • If you didn't attempt to login, please secure your account immediately
          </p>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          <strong>Login Details:</strong><br>
          Time: ${new Date().toLocaleString()}<br>
          If this wasn't you, please change your password immediately and contact support.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} WhaSales AI. All rights reserved.</p>
        <p>Security Alert: support@whasalesai.com</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Environment Variable Validator
 *
 * Validates that all required environment variables are set
 * Runs on server startup to catch configuration issues early
 */

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
  defaultValue?: string;
}

const ENV_VARIABLES: EnvVariable[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'MySQL database connection string',
    validate: (value) => value.startsWith('mysql://'),
  },

  // OpenAI
  {
    name: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API key for AI responses',
    validate: (value) => value.startsWith('sk-'),
  },

  // NextAuth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js secret for JWT signing (generate with: openssl rand -base64 32)',
    validate: (value) => value.length >= 32,
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Your application URL (e.g., https://yourdomain.com)',
  },

  // Stripe
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key',
    validate: (value) => value.startsWith('sk_'),
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key',
    validate: (value) => value.startsWith('pk_'),
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook secret',
    validate: (value) => value.startsWith('whsec_'),
  },

  // Stripe Price IDs (all required for checkout to work)
  {
    name: 'STRIPE_PRICE_STARTER_MONTHLY',
    required: true,
    description: 'Stripe price ID for Starter Monthly plan',
  },
  {
    name: 'STRIPE_PRICE_STARTER_YEARLY',
    required: true,
    description: 'Stripe price ID for Starter Yearly plan',
  },
  {
    name: 'STRIPE_PRICE_PRO_MONTHLY',
    required: true,
    description: 'Stripe price ID for Pro Monthly plan',
  },
  {
    name: 'STRIPE_PRICE_PRO_YEARLY',
    required: true,
    description: 'Stripe price ID for Pro Yearly plan',
  },
  {
    name: 'STRIPE_PRICE_BUSINESS_MONTHLY',
    required: true,
    description: 'Stripe price ID for Business Monthly plan',
  },
  {
    name: 'STRIPE_PRICE_BUSINESS_YEARLY',
    required: true,
    description: 'Stripe price ID for Business Yearly plan',
  },
  {
    name: 'STRIPE_PRICE_LIFETIME_STARTER',
    required: true,
    description: 'Stripe price ID for Lifetime Starter plan',
  },
  {
    name: 'STRIPE_PRICE_LIFETIME_PRO',
    required: true,
    description: 'Stripe price ID for Lifetime Pro plan',
  },
  {
    name: 'STRIPE_PRICE_LIFETIME_BUSINESS',
    required: true,
    description: 'Stripe price ID for Lifetime Business plan',
  },

  // Security
  {
    name: 'CRON_SECRET',
    required: true,
    description: 'Secret for protecting cron endpoints (generate with: openssl rand -base64 32)',
    validate: (value) => value.length >= 32 && value !== 'CHANGE-THIS-TO-A-STRONG-RANDOM-SECRET',
  },
  {
    name: 'CSRF_SECRET',
    required: true,
    description: 'Secret for CSRF token generation (generate with: openssl rand -base64 32)',
    validate: (value) => value.length >= 32 && value !== 'CHANGE-THIS-TO-A-STRONG-RANDOM-SECRET',
  },

  // Redis (optional for development, required for production)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: process.env.NODE_ENV === 'production',
    description: 'Upstash Redis REST URL (required for production rate limiting)',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: process.env.NODE_ENV === 'production',
    description: 'Upstash Redis REST token (required for production rate limiting)',
  },

  // Email (optional)
  {
    name: 'EMAIL_SERVER_HOST',
    required: false,
    description: 'SMTP server host for sending emails',
  },
  {
    name: 'EMAIL_SERVER_PORT',
    required: false,
    description: 'SMTP server port',
  },
  {
    name: 'EMAIL_SERVER_USER',
    required: false,
    description: 'SMTP username',
  },
  {
    name: 'EMAIL_SERVER_PASSWORD',
    required: false,
    description: 'SMTP password',
  },
  {
    name: 'EMAIL_FROM',
    required: false,
    description: 'Email from address',
  },

  // Google OAuth (optional)
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret',
  },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`❌ Missing required: ${envVar.name} - ${envVar.description}`);
      continue;
    }

    // Check if optional variable is missing
    if (!envVar.required && !value) {
      warnings.push(`⚠️ Optional not set: ${envVar.name} - ${envVar.description}`);
      continue;
    }

    // Run custom validation if provided
    if (value && envVar.validate && !envVar.validate(value)) {
      errors.push(`❌ Invalid format: ${envVar.name} - ${envVar.description}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 * Call this at application startup
 */
export function validateEnvironmentOrThrow(): void {
  console.log('🔍 Validating environment variables...');

  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️ Environment Warnings:');
    result.warnings.forEach((warning) => console.warn(warning));
    console.warn('');
  }

  // Log errors and throw if invalid
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach((error) => console.error(error));
    console.error('\n💡 Fix these issues in your .env.local file before starting the server.\n');

    throw new Error('Environment validation failed - check console for details');
  }

  console.log('✅ Environment validation passed\n');
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];

  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }

  return value || defaultValue!;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

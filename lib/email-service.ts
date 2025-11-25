import nodemailer from 'nodemailer';

/**
 * Email Service for WhaSales AI
 * Handles all email communications including:
 * - Email verification
 * - Welcome emails
 * - Payment notifications
 * - Trial reminders
 * - Subscription updates
 */

// Email configuration with Railway-compatible settings
const EMAIL_CONFIG: any = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Railway compatibility: Extended timeouts for cloud environments
  connectionTimeout: 60000, // 60 seconds (increased for troubleshooting)
  greetingTimeout: 60000, // 60 seconds
  socketTimeout: 60000, // 60 seconds
  // TLS options for better compatibility
  tls: {
    rejectUnauthorized: false, // Disable cert validation for troubleshooting
    minVersion: 'TLSv1',
    ciphers: 'SSLv3',
  },
  requireTLS: false, // Try without forcing TLS
  // Connection pooling for better performance
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Enable debug logging in development
  logger: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',
};

// Create reusable transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG as any);

// Verify connection on startup (non-blocking)
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP connection failed:', error.message);
      console.log('💡 Tip: If using port 465, try port 587 instead');
    } else {
      console.log('✅ SMTP server is ready to send emails');
    }
  });
}

// Email template types
export type EmailTemplate =
  | 'verification'
  | 'welcome'
  | 'trial-reminder'
  | 'payment-success'
  | 'payment-failed'
  | 'subscription-cancelled'
  | 'subscription-upgraded';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ SMTP credentials not configured. Email not sent.');
      console.log('📧 Would send email to:', options.to, 'Subject:', options.subject);
      return false;
    }

    await transporter.sendMail({
      from: `"WhaSales AI" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Generate verification email HTML
 */
export function generateVerificationEmail(
  name: string,
  verificationLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Welcome to WhaSales AI!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${name || 'there'}!</h2>

        <p style="font-size: 16px; color: #4b5563;">
          Thank you for signing up for WhaSales AI! We're excited to help you automate your WhatsApp conversations and close more sales.
        </p>

        <p style="font-size: 16px; color: #4b5563;">
          To get started, please verify your email address by clicking the button below:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Verify Email Address
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Or copy and paste this link into your browser:<br>
          <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
        </p>

        <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #667eea;">
          <p style="margin: 0; font-size: 14px; color: #4338ca;">
            <strong>What's next?</strong><br>
            ✅ Connect your WhatsApp<br>
            ✅ Create your first AI agent<br>
            ✅ Start automating conversations<br>
            ✅ Watch your sales grow!
          </p>
        </div>

        <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">
          If you didn't create an account with WhaSales AI, you can safely ignore this email.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} WhaSales AI. All rights reserved.</p>
        <p>Need help? Contact us at support@whasalesai.com</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate welcome email HTML (sent after verification)
 */
export function generateWelcomeEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to WhaSales AI</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're All Set!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome aboard, ${name}!</h2>

        <p style="font-size: 16px; color: #4b5563;">
          Your email has been verified successfully. You now have full access to WhaSales AI!
        </p>

        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0;">Your 3-Day Free Trial Includes:</h3>
          <ul style="color: #065f46; padding-left: 20px;">
            <li>2,000 AI-powered messages</li>
            <li>1 WhatsApp connection</li>
            <li>1 AI agent</li>
            <li>Full access to all features</li>
          </ul>
        </div>

        <h3 style="color: #1f2937;">Quick Start Guide:</h3>
        <div style="margin: 20px 0;">
          <div style="padding: 15px; border-left: 3px solid #667eea; margin-bottom: 15px;">
            <strong style="color: #667eea;">1. Connect WhatsApp</strong>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Scan the QR code to link your WhatsApp account</p>
          </div>
          <div style="padding: 15px; border-left: 3px solid #667eea; margin-bottom: 15px;">
            <strong style="color: #667eea;">2. Set Up Your Agent</strong>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Configure your AI agent with your business info</p>
          </div>
          <div style="padding: 15px; border-left: 3px solid #667eea;">
            <strong style="color: #667eea;">3. Start Automating</strong>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Watch as AI handles your WhatsApp conversations</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.whasalesai.com'}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>💡 Pro Tip:</strong> The more detailed your knowledge base, the better your AI agent performs. Add your product info, pricing, and FAQs for best results!
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Need help getting started? Check out our <a href="#" style="color: #667eea;">documentation</a> or reply to this email.</p>
        <p>© ${new Date().getFullYear()} WhaSales AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate trial reminder email (2 days before expiry)
 */
export function generateTrialReminderEmail(name: string, daysLeft: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trial Ending Soon</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Your Trial Ends in ${daysLeft} Days</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${name},</h2>

        <p style="font-size: 16px; color: #4b5563;">
          Your WhaSales AI free trial will end in <strong>${daysLeft} days</strong>. Don't lose access to your AI-powered WhatsApp automation!
        </p>

        <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #9a3412; margin-top: 0;">Upgrade Now & Get:</h3>
          <ul style="color: #9a3412; padding-left: 20px;">
            <li>Unlimited AI conversations</li>
            <li>Advanced analytics</li>
            <li>Priority support</li>
            <li>Special launch pricing (Limited time!)</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.whasalesai.com'}/dashboard/billing" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Upgrade to Premium
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          No credit card required during trial. Cancel anytime.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} WhaSales AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate payment success email
 */
export function generatePaymentSuccessEmail(
  name: string,
  planName: string,
  amount: number,
  nextBillingDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Successful!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Thank you, ${name}!</h2>

        <p style="font-size: 16px; color: #4b5563;">
          Your payment has been processed successfully. Your ${planName} plan is now active!
        </p>

        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4338ca; margin-top: 0;">Payment Details</h3>
          <table style="width: 100%; color: #4b5563;">
            <tr>
              <td style="padding: 8px 0;"><strong>Plan:</strong></td>
              <td style="text-align: right;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Amount:</strong></td>
              <td style="text-align: right;">$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Next Billing:</strong></td>
              <td style="text-align: right;">${nextBillingDate}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.whasalesai.com'}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Access Dashboard
          </a>
        </div>

        <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">
          A receipt has been sent to your email address. You can view all your invoices in your account dashboard.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Questions? Contact us at billing@whasalesai.com</p>
        <p>© ${new Date().getFullYear()} WhaSales AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  return await sendEmail({
    to: email,
    subject: '🚀 Verify Your WhaSales AI Account',
    html: generateVerificationEmail(name, verificationLink),
  });
}

/**
 * Send welcome email (after verification)
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  return await sendEmail({
    to: email,
    subject: '🎉 Welcome to WhaSales AI - Let\'s Get Started!',
    html: generateWelcomeEmail(name),
  });
}

/**
 * Send trial reminder email
 */
export async function sendTrialReminderEmail(
  email: string,
  name: string,
  daysLeft: number
): Promise<boolean> {
  return await sendEmail({
    to: email,
    subject: `⏰ Your Trial Ends in ${daysLeft} Days - Upgrade Now`,
    html: generateTrialReminderEmail(name, daysLeft),
  });
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  email: string,
  name: string,
  planName: string,
  amount: number,
  nextBillingDate: string
): Promise<boolean> {
  return await sendEmail({
    to: email,
    subject: '✅ Payment Successful - Welcome to Premium!',
    html: generatePaymentSuccessEmail(name, planName, amount, nextBillingDate),
  });
}

/**
 * Send admin login verification code
 */
export async function sendAdminVerificationCode(
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  const { generateAdminLoginVerificationEmail } = await import('./admin-verification');

  return await sendEmail({
    to: email,
    subject: '🔐 Admin Login Verification Code',
    html: generateAdminLoginVerificationEmail(name, code),
  });
}

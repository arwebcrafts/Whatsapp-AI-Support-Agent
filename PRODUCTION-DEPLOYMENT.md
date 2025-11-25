# 🚀 Production Deployment Guide

This guide will walk you through deploying WhaSales AI to production safely and securely.

---

## 📋 Pre-Deployment Checklist

### 1. Install Required Dependencies

```bash
npm install @upstash/redis
```

### 2. Generate Security Secrets

Run these commands to generate secure random secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32

# Generate CSRF_SECRET
openssl rand -base64 32
```

Save these values - you'll need them for your `.env.local` file.

### 3. Set Up Upstash Redis (Free)

1. Go to https://upstash.com and create a free account
2. Create a new Redis database
3. Copy the **REST URL** and **REST Token**
4. Add to your `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="your-token"
   ```

### 4. Configure Database Connection Pool

Update your `DATABASE_URL` to include connection pooling:

```env
DATABASE_URL="mysql://user:password@host:3306/database?connection_limit=50&pool_timeout=20"
```

### 5. Run Database Migrations

Apply the new database indexes:

```bash
npx prisma generate
npx prisma db push
```

**⚠️ IMPORTANT:** This will add new indexes to your database. It's safe to run on existing data.

---

## 🔐 Environment Variables Setup

Copy `.env.example` to `.env.local` and fill in ALL values:

### Required Variables (Critical)

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/db?connection_limit=50&pool_timeout=20"

# OpenAI
OPENAI_API_KEY="sk-..."

# Authentication
NEXTAUTH_SECRET="[GENERATED SECRET FROM STEP 2]"
NEXTAUTH_URL="https://yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (all 9 required)
STRIPE_PRICE_STARTER_MONTHLY="price_..."
STRIPE_PRICE_STARTER_YEARLY="price_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_BUSINESS_MONTHLY="price_..."
STRIPE_PRICE_BUSINESS_YEARLY="price_..."
STRIPE_PRICE_LIFETIME_STARTER="price_..."
STRIPE_PRICE_LIFETIME_PRO="price_..."
STRIPE_PRICE_LIFETIME_BUSINESS="price_..."

# Security Secrets
CRON_SECRET="[GENERATED SECRET FROM STEP 2]"
CSRF_SECRET="[GENERATED SECRET FROM STEP 2]"

# Redis (Required for Production)
UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### Optional Variables

```env
# Email (for verification emails)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-secret"
```

---

## 🏗️ Deployment Options

### Option 1: Railway (Recommended)

Railway supports WhatsApp persistent connections and background processes.

1. Create Railway account: https://railway.app
2. Create new project from GitHub repo
3. Add MySQL database service
4. Add environment variables from `.env.local`
5. Deploy!

**Railway Configuration:**
- Set `NODE_ENV=production`
- Allocate at least 1GB RAM
- Enable persistent storage for WhatsApp sessions

### Option 2: Render

1. Create Render account: https://render.com
2. Create new Web Service
3. Add MySQL database
4. Set environment variables
5. Deploy

**Render Configuration:**
- Instance Type: Standard (at least 512MB RAM)
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npm start`

### Option 3: DigitalOcean App Platform

1. Create DigitalOcean account
2. Create new app from GitHub
3. Add managed MySQL database
4. Configure environment variables
5. Deploy

---

## ⚙️ Post-Deployment Configuration

### 1. Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 2. Set Up Cron Job for Trial Expiration

Use one of these services to hit your cron endpoint daily:

**Option A: Cron-job.org (Free)**
1. Go to https://cron-job.org
2. Create new cron job
3. URL: `https://yourdomain.com/api/cron/check-trials`
4. Method: GET
5. Schedule: Daily at 2:00 AM
6. Add header:
   ```
   Authorization: Bearer [YOUR_CRON_SECRET]
   ```

**Option B: Railway Cron (Built-in)**
Add to your Railway service configuration.

**Option C: Render Cron Jobs**
Configure in Render dashboard.

### 3. Verify Email Sending (Optional)

Test email verification:
1. Sign up with a test account
2. Check that verification email is sent
3. Verify the link works

If emails aren't working, check your SMTP settings.

---

## 🧪 Testing Your Production Deployment

### 1. Health Check

Visit these URLs and verify they work:
- ✅ `https://yourdomain.com` - Landing page loads
- ✅ `https://yourdomain.com/login` - Login page loads
- ✅ `https://yourdomain.com/signup` - Signup page loads

### 2. Authentication Flow

1. Create test account
2. Verify email (if email configured)
3. Log in
4. Access dashboard

### 3. WhatsApp Connection

1. Log in to dashboard
2. Navigate to WhatsApp connection
3. Generate QR code
4. Scan with WhatsApp
5. Send test message

### 4. Payment Flow

1. Go to billing/pricing page
2. Click upgrade
3. Use Stripe test card: `4242 4242 4242 4242`
4. Verify subscription updates in dashboard

### 5. Trial Expiration (Manual Test)

```bash
curl -X GET https://yourdomain.com/api/cron/check-trials \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Should return: `{"success":true,"expiredCount":0}`

---

## 📊 Monitoring & Alerts

### Recommended Monitoring Tools

1. **Error Tracking:** [Sentry](https://sentry.io)
   - Free for 5K errors/month
   - Real-time error alerts

2. **Uptime Monitoring:** [UptimeRobot](https://uptimerobot.com)
   - Free for 50 monitors
   - Email/SMS alerts

3. **Database Monitoring:** Your hosting provider's dashboard
   - Watch for connection pool exhaustion
   - Monitor query performance

### Set Up Alerts

Create alerts for:
- ❌ Server downtime (> 1 minute)
- ❌ Database connection failures
- ❌ Stripe webhook failures
- ❌ OpenAI API errors (quota exceeded)
- ⚠️ High memory usage (> 80%)
- ⚠️ Slow response times (> 3 seconds)

---

## 🔒 Security Best Practices

### After Deployment

1. ✅ Verify all secrets are set (no default values)
2. ✅ Enable Stripe webhook signature verification
3. ✅ Set up SSL/HTTPS (automatic on Railway/Render)
4. ✅ Enable rate limiting (automatic with Redis)
5. ✅ Review database security rules
6. ✅ Set up automated backups

### Regular Maintenance

- 🔄 Rotate secrets every 90 days
- 📊 Review error logs weekly
- 🔍 Monitor for suspicious activity
- 📈 Check OpenAI usage to avoid surprise bills

---

## 🚨 Troubleshooting

### Common Issues

**"CRON_SECRET is not set"**
- Add `CRON_SECRET` to environment variables
- Generate with: `openssl rand -base64 32`

**"Redis not configured, falling back to in-memory"**
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- In production, this will block scaling

**"stripeCustomerId is null"**
- This was fixed in the deployment updates
- Existing users: update manually or they'll get subscription updates

**WhatsApp disconnects frequently**
- Ensure persistent storage is enabled
- Check server memory (need at least 512MB)
- Verify session files are being saved

**Database connection timeouts**
- Increase connection pool: `?connection_limit=100`
- Check database resources
- Review slow queries

---

## 📈 Scaling to 1000+ Users

### Performance Optimization

1. **Database:**
   - ✅ Indexes added (in this deployment)
   - Consider read replicas for > 5000 users
   - Monitor slow queries

2. **Redis:**
   - Upstash free tier: 10K requests/day
   - Upgrade if you hit limits

3. **Server:**
   - Start with 1GB RAM
   - Scale to 2GB at 500 users
   - Scale to 4GB at 1000 users

4. **OpenAI:**
   - Monitor token usage daily
   - Set up usage alerts in OpenAI dashboard
   - Consider caching common responses

### Cost Estimates (1000 Active Users)

- **Server (Railway):** $25-50/month
- **Database (MySQL):** $10-25/month
- **Redis (Upstash):** Free tier OK
- **OpenAI:** $200-500/month (depends on usage)
- **Total:** ~$235-575/month

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables set (no defaults)
- [ ] Database migrations applied
- [ ] Redis configured and tested
- [ ] Stripe webhook configured and tested
- [ ] Cron job set up and tested
- [ ] Test signup → verification → login flow
- [ ] Test WhatsApp connection and messages
- [ ] Test payment flow (use test mode first!)
- [ ] Monitoring and alerts configured
- [ ] SSL/HTTPS enabled
- [ ] Backups configured
- [ ] Error tracking set up (Sentry)

---

## 🆘 Need Help?

If you encounter issues:

1. Check error logs in your hosting dashboard
2. Review environment variables
3. Test each component individually
4. Open an issue on GitHub with detailed logs

---

**🎉 You're ready to launch! Good luck with your 1000 users!**

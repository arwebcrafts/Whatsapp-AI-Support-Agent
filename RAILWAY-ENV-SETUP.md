# Railway Environment Variables Setup Guide

This guide explains how to set up all required environment variables in Railway for WhaSales AI.

## 🔑 Critical Variables to Set

### 1. Application URL (For Email Links)

**Variable:** `NEXT_PUBLIC_APP_URL`
**Required for:** Verification emails, password resets, dashboard links

**How to find your Railway domain:**
```bash
# Option 1: Check your Railway dashboard
# Go to: Railway Dashboard → Your Project → Settings → Domains
# Copy the domain shown (e.g., https://whatsapp-ai-support-agent-production.up.railway.app)

# Option 2: Use Railway CLI
railway domain

# Option 3: Check deployment logs
# Your domain is shown after successful deployment
```

**Set in Railway:**
```
NEXT_PUBLIC_APP_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

### 2. Email Configuration (Resend - Recommended)

**Why Resend?** Railway blocks SMTP ports (25, 465, 587), so Resend (HTTP-based) is required.

**Variables:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=support@whasalesai.com
```

**How to get:**
1. Sign up at [resend.com](https://resend.com) (Free: 3,000 emails/month)
2. Go to **Settings → API Keys** → Create API Key
3. Copy the key (starts with `re_`)

**For Testing (Quick Start):**
```
RESEND_FROM_EMAIL=onboarding@resend.dev
```
*No domain verification needed for testing*

**For Production:**
1. Go to Resend Dashboard → Domains
2. Add your domain: `whasalesai.com`
3. Follow DNS verification steps
4. Use: `support@whasalesai.com`

### 3. Authentication

```
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

### 4. Database

Railway auto-provides this when you add MySQL plugin:
```
DATABASE_URL=${MySQL.DATABASE_URL}
```

### 5. Redis (Rate Limiting)

Railway auto-provides this when you add Redis plugin:
```
REDIS_URL=${Redis.REDIS_URL}
```

### 6. Security Secrets

Generate secure secrets:
```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Generate CSRF_SECRET
openssl rand -base64 32
```

Then set in Railway:
```
CRON_SECRET=<your-generated-secret>
CSRF_SECRET=<your-generated-secret>
```

### 7. OpenAI API

```
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
```
Get from: https://platform.openai.com/api-keys

## 📋 Complete Railway Variables Checklist

Copy these to Railway Dashboard → Variables:

```bash
# 🌐 Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app

# 🔐 Authentication
NEXTAUTH_SECRET=<generate-32-char-secret>
NEXTAUTH_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app

# 📧 Email (Resend - Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=support@whasalesai.com

# 🤖 AI
OPENAI_API_KEY=sk-proj-YOUR-KEY

# 🗄️ Database (Auto-provided by Railway MySQL plugin)
DATABASE_URL=${MySQL.DATABASE_URL}

# 📦 Redis (Auto-provided by Railway Redis plugin)
REDIS_URL=${Redis.REDIS_URL}

# 🔒 Security
CRON_SECRET=<generate-32-char-secret>
CSRF_SECRET=<generate-32-char-secret>
ADMIN_CREATION_DISABLED=false

# 💳 Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
# ... (Stripe price IDs)
```

## 🚀 Quick Setup Steps

1. **Deploy to Railway** (first time)
   - Project will deploy with placeholder URL
   - Note your Railway domain from deployment logs

2. **Set NEXT_PUBLIC_APP_URL**
   - Railway Dashboard → Variables
   - Add: `NEXT_PUBLIC_APP_URL` = your Railway domain
   - **Important:** Include `https://` protocol

3. **Configure Email (Resend)**
   - Sign up at resend.com
   - Create API key
   - Add variables: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
   - For testing: use `onboarding@resend.dev`
   - For production: verify your domain first

4. **Generate Secrets**
   ```bash
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 32  # For CRON_SECRET
   openssl rand -base64 32  # For CSRF_SECRET
   ```

5. **Add Database & Redis**
   - Railway Dashboard → Add Plugin → MySQL
   - Railway Dashboard → Add Plugin → Redis
   - Variables auto-populate

6. **Redeploy**
   - After setting all variables, trigger a new deployment
   - Check logs to verify: "Using Resend (HTTP API)"

## ✅ Verification

After deployment, check logs for:

```
✅ Resend email service initialized successfully
✅ SMTP server is ready to send emails (if SMTP is configured)
✅ NEXT_PUBLIC_APP_URL: https://your-domain.up.railway.app
```

## 🔍 Troubleshooting

### Emails show placeholder URL
- **Cause:** `NEXT_PUBLIC_APP_URL` not set
- **Fix:** Add the variable in Railway Dashboard → Variables
- **Redeploy** after setting

### Email timeout errors
- **Cause:** Using SMTP (blocked by Railway)
- **Fix:** Switch to Resend (see Email Configuration above)

### Verification link doesn't work
- **Cause:** URL mismatch between `NEXT_PUBLIC_APP_URL` and actual domain
- **Fix:** Ensure the variable matches your Railway domain exactly

## 📝 Notes

- **NEXT_PUBLIC_** prefix means the variable is exposed to the browser
- Variables are injected at **build time** (redeploy after changes)
- Never commit `.env.production` to git (contains secrets)
- Use Railway's variable groups for better organization

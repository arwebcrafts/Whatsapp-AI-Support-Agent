# 🚂 Railway Quick Start - 5 Minutes to Deploy

Super quick guide to deploy WhaSales AI to Railway.

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Generate Secrets (30 seconds)

Run this locally and save the output:

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "CRON_SECRET=$(openssl rand -base64 32)"
echo "CSRF_SECRET=$(openssl rand -base64 32)"
```

### Step 2: Deploy to Railway (2 minutes)

1. Go to https://railway.app
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select `Whatsapp-AI-Support-Agent`
5. Railway auto-detects Next.js ✅

### Step 3: Add Databases (1 minute)

**Add MySQL:**
1. Click "+ New" → "Database" → "MySQL"
2. Railway auto-creates `DATABASE_URL` ✅

**Add Redis:**
1. Click "+ New" → "Database" → "Redis"
2. Railway auto-creates `REDIS_URL` ✅

### Step 4: Add Environment Variables (2 minutes)

Click your web service → "Variables" tab → Paste this:

```env
# Node Environment
NODE_ENV=production

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# NextAuth (use secrets from Step 1)
NEXTAUTH_SECRET=your-generated-32-char-secret
NEXTAUTH_URL=https://your-app.up.railway.app

# Stripe
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs (get from Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx
STRIPE_PRICE_LIFETIME_STARTER=price_xxx
STRIPE_PRICE_LIFETIME_PRO=price_xxx
STRIPE_PRICE_LIFETIME_BUSINESS=price_xxx

# Security (use secrets from Step 1)
CRON_SECRET=your-generated-32-char-secret
CSRF_SECRET=your-generated-32-char-secret

# Admin
ADMIN_CREATION_DISABLED=false
```

**Important:** Railway auto-provides:
- ✅ `DATABASE_URL` (from MySQL plugin)
- ✅ `REDIS_URL` (from Redis plugin)

You don't need to add these manually!

### Step 5: Deploy! (Auto)

Railway automatically:
- ✅ Installs dependencies (`ioredis`, `@upstash/redis`, etc.)
- ✅ Builds your Next.js app
- ✅ Runs database migrations on startup
- ✅ Starts the server

**That's it! Your app is live! 🎉**

---

## 🔍 Verify Deployment

### Check Logs

In Railway dashboard, click "View Logs" and look for:

```
✅ Database is accessible
📦 Generating Prisma Client...
✅ Prisma Client generated
🚀 Pushing schema to database...
✅ Database schema synchronized
🎉 Database initialization complete!
✅ Railway Redis rate limiter connected successfully
```

### Test Your App

Visit: `https://your-app.up.railway.app`

1. ✅ Landing page loads
2. ✅ Sign up for account
3. ✅ Log in
4. ✅ Dashboard loads

---

## 🔧 Post-Deployment Tasks

### 1. Update NEXTAUTH_URL

After first deploy:
1. Copy your Railway URL
2. Go to Variables → Edit `NEXTAUTH_URL`
3. Update to actual URL
4. Railway auto-redeploys ✅

### 2. Configure Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.up.railway.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in Railway

### 3. Set Up Cron Job

**Option A: Railway Cron (Built-in)**

1. Click "+ New" → "Cron Job"
2. Schedule: `0 2 * * *` (daily at 2 AM)
3. Command:
   ```bash
   curl -X POST https://your-app.up.railway.app/api/cron/check-trials \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

**Option B: External (cron-job.org)**

1. Go to https://cron-job.org
2. Create free account
3. Add cron job:
   - URL: `https://your-app.up.railway.app/api/cron/check-trials`
   - Schedule: Daily at 2:00 AM
   - Header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## ✅ What's Different?

### Auto-Initialization ✨

The app now **automatically**:
- ✅ Runs `prisma generate` on startup
- ✅ Runs `prisma db push` on startup
- ✅ Creates all database tables and indexes
- ✅ Connects to Railway Redis automatically

### No Manual Commands Needed! 🎉

You **DON'T** need to:
- ❌ Install Railway CLI
- ❌ Run `railway run npx prisma generate`
- ❌ Run `railway run npx prisma db push`

Everything happens automatically when Railway starts your app!

---

## 🐛 Troubleshooting

### "Database not accessible"

Check Railway logs. If you see this:
1. Make sure MySQL plugin is added
2. Check that `DATABASE_URL` variable exists
3. Restart the service

### "Redis not configured, falling back to in-memory"

1. Make sure Redis plugin is added
2. Check that `REDIS_URL` variable exists
3. Restart the service

Should see: `✅ Railway Redis rate limiter connected successfully`

### "Prisma push failed"

This is OK on first deploy if database is initializing. Just:
1. Wait 30 seconds
2. Restart the service
3. Check logs again

### App crashes on startup

Check logs for specific error. Common issues:
- Missing required environment variable
- Database connection failed
- Invalid Stripe keys

---

## 💰 Railway Costs

**Developer Plan ($20/month):**
- Unlimited execution hours
- Perfect for 1000 users
- **Includes:**
  - Web Service: ~$15/month usage
  - MySQL: ~$5/month usage
  - Redis: ~$2/month usage
- **Total: ~$22/month**

Plus OpenAI API costs (~$200-500/month usage-based)

---

## 📚 Need More Details?

- **Complete Guide:** See `RAILWAY-DEPLOYMENT.md`
- **QA Fixes:** See `QA-FIXES-SUMMARY.md`

---

## 🎉 You're Live!

Your WhaSales AI platform is now running on Railway with:
- ✅ Auto-scaling
- ✅ Auto-migrations
- ✅ Production Redis
- ✅ Managed MySQL
- ✅ Zero-downtime deploys

**Start inviting users! 🚀**

---

**Last Updated:** 2025-11-25
**Auto-Initialization:** Enabled
**Railway Redis:** Supported

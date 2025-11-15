# Vercel Deployment Guide

This guide will help you deploy the WhatsApp AI Support Agent to Vercel with a MySQL database.

## ⚠️ Important: Session Persistence Warning

**WhatsApp sessions use file storage** which is not persistent on Vercel's serverless environment. After deployment, WhatsApp connections will disconnect when serverless functions spin down.

**Solutions:**
1. Use a persistent VM (Railway, DigitalOcean, AWS EC2) for production
2. Modify the code to store sessions in database/S3 (advanced)
3. Accept that users need to re-scan QR codes periodically

For testing/demos, Vercel works fine. For production with persistent WhatsApp connections, consider alternative hosting.

---

## Step 1: Setup MySQL Database

### Option A: PlanetScale (Recommended - Free Tier)

1. **Create Account**: https://planetscale.com/
2. **Create Database**:
   - Click "New database"
   - Name: `whasales-production`
   - Region: Choose closest to your users
3. **Get Connection String**:
   - Click "Connect"
   - Framework: "Prisma"
   - Copy the `DATABASE_URL` (it includes `?sslaccept=strict`)

### Option B: Railway

1. Go to https://railway.app/
2. Create new project → Add MySQL
3. Go to Variables tab → Copy `DATABASE_URL`

### Option C: Aiven (Free Tier Available)

1. Go to https://aiven.io/
2. Create MySQL service
3. Get connection string from service overview

---

## Step 2: Prepare Environment Variables

Create a `.env.production` file (don't commit this):

```bash
# Database
DATABASE_URL="mysql://user:password@host:3306/database?sslaccept=strict"

# OpenAI
OPENAI_API_KEY="sk-..."

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (if using Stripe)
STRIPE_PRICE_STARTER_MONTHLY="price_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
# ... add other price IDs

# Cron Secret (for scheduled tasks)
CRON_SECRET="generate-random-secure-string"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Step 3: Deploy to Vercel

### Method A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts
   - Choose project name
   - Select settings

4. **Add Environment Variables**:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add OPENAI_API_KEY production
   vercel env add NEXTAUTH_SECRET production
   vercel env add NEXTAUTH_URL production
   # ... add all other env vars
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Method B: Using Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `prisma generate && next build`

3. **Add Environment Variables**:
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from `.env.production`
   - Make sure to select "Production" environment

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

---

## Step 4: Run Database Migrations

### Using Vercel CLI:

```bash
# Set database URL locally for migration
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### Or connect directly to your database:

```bash
# If using PlanetScale CLI
pscale connect whasales-production main --port 3309

# In another terminal
DATABASE_URL="mysql://root@127.0.0.1:3309/whasales-production" npx prisma migrate deploy
```

---

## Step 5: Create Admin User

After deployment, create an admin user:

1. **Option A: Using Prisma Studio**:
   ```bash
   export DATABASE_URL="your-production-database-url"
   npx prisma studio
   ```
   - Open User table
   - Create new user with `role: "admin"`

2. **Option B: Using SQL directly**:
   ```sql
   INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
   VALUES (
     UUID(),
     'admin@yourdomain.com',
     'Admin',
     '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to hash
     'admin',
     NOW(),
     NOW()
   );
   ```

   **Hash password with Node.js**:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```

---

## Step 6: Configure Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable to your domain

---

## Step 7: Setup Cron Jobs (Optional)

For trial expiration checks:

1. In Vercel Dashboard → Settings → Cron Jobs
2. Add new cron job:
   - Path: `/api/cron/check-trials`
   - Schedule: `0 0 * * *` (daily at midnight)
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Post-Deployment Checklist

- [ ] Database is accessible
- [ ] All environment variables are set
- [ ] Migrations have run successfully
- [ ] Admin user is created
- [ ] Can login to admin panel
- [ ] WhatsApp QR code generates (will disconnect after ~15 min due to serverless)
- [ ] OpenAI integration works
- [ ] Stripe webhooks configured (if using payments)

---

## Troubleshooting

### Build Failures

**Error: Prisma Client not generated**
```bash
# Add to package.json scripts:
"postinstall": "prisma generate"
```

**Error: Database connection timeout**
- Check DATABASE_URL is correct
- Ensure database allows connections from Vercel IPs
- For PlanetScale: connection string must include `?sslaccept=strict`

### Runtime Errors

**WhatsApp keeps disconnecting**
- This is expected on Vercel (serverless)
- Sessions are stored in `/tmp` which is ephemeral
- Consider persistent hosting for production

**Database queries timing out**
- Check Prisma connection pool settings
- Increase function timeout in `vercel.json`

### Environment Variables Not Working

```bash
# Verify env vars are set:
vercel env ls

# Pull env vars locally for testing:
vercel env pull .env.local
```

---

## Alternative: Deploy to Railway (Persistent Sessions)

If you need persistent WhatsApp sessions:

1. Go to https://railway.app/
2. Create new project from GitHub
3. Add MySQL database
4. Add environment variables
5. Deploy

Railway provides persistent file systems, so WhatsApp sessions will persist.

---

## Monitoring

- **Vercel Logs**: Check real-time logs in Vercel dashboard
- **Database**: Monitor query performance in your database provider
- **Errors**: Setup error tracking (Sentry, LogRocket, etc.)

---

## Security Recommendations

1. ✅ Use strong NEXTAUTH_SECRET
2. ✅ Enable database SSL connections
3. ✅ Restrict database access to Vercel IPs only
4. ✅ Use environment variables for all secrets
5. ✅ Enable Vercel's firewall rules
6. ✅ Setup rate limiting for APIs
7. ✅ Regular security audits

---

## Scaling Considerations

- Vercel Pro plan recommended for production
- Database connection pooling via Prisma
- Consider caching frequently accessed data
- Monitor function execution time and optimize
- Use CDN for static assets

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
- Project Issues: Check GitHub repository

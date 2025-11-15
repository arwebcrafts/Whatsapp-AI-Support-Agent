# Railway Deployment Guide (Recommended)

Railway is the **recommended hosting platform** for this WhatsApp AI Support Agent because it provides persistent file storage, which is essential for maintaining WhatsApp connections.

## Why Railway?

✅ **Persistent Storage** - WhatsApp sessions remain connected (unlike Vercel)
✅ **Built-in MySQL** - No external database needed
✅ **Always-On** - Not serverless, sessions don't disconnect
✅ **Easy Deployment** - GitHub integration, automatic builds
✅ **Free Trial** - $5 worth of credits to start
✅ **Next.js Native** - Auto-detects and configures

---

## Step 1: Create Railway Account

1. Go to https://railway.app/
2. Sign up with GitHub
3. You'll get $5 free credits to start

---

## Step 2: Create New Project from GitHub

### Option A: Deploy from Existing Repository

1. **Connect GitHub Repository**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Click "Deploy Now"

2. **Railway Auto-Detects**:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Start Command: `npm start`

### Option B: Deploy with Template

1. Click "New Project"
2. Choose "Deploy from Template"
3. Search for "Next.js" or use empty template

---

## Step 3: Add MySQL Database

1. **Add MySQL Service**:
   - In your project, click "+ New"
   - Select "Database"
   - Choose "MySQL"
   - Railway creates and connects the database automatically

2. **Get Database URL**:
   - Click on MySQL service
   - Go to "Variables" tab
   - Copy `DATABASE_URL` (Railway auto-generates this)

---

## Step 4: Configure Environment Variables

1. **Click on your Next.js service**
2. **Go to "Variables" tab**
3. **Add these variables**:

```bash
# Database (automatically added by Railway when you connect MySQL)
DATABASE_URL=${{MySQL.DATABASE_URL}}

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-app.up.railway.app

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (if using Stripe)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
# Add other price IDs as needed

# Cron Secret
CRON_SECRET=generate-random-secure-string

# Node Environment
NODE_ENV=production
```

### Generate Secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

### Reference MySQL Database:

Railway automatically creates a `MySQL.DATABASE_URL` variable. Use this syntax:
```bash
DATABASE_URL=${{MySQL.DATABASE_URL}}
```

---

## Step 5: Run Database Migrations

### Method A: Using Railway CLI (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Link Project**:
   ```bash
   railway link
   ```
   - Select your project from the list

4. **Run Migrations**:
   ```bash
   railway run npx prisma migrate deploy
   ```

### Method B: Using One-Off Command in Dashboard

1. Go to your Next.js service in Railway dashboard
2. Click "Settings" tab
3. Scroll to "One-off Commands"
4. Run:
   ```bash
   npx prisma migrate deploy
   ```

### Method C: Connect via Railway Proxy

1. **Start Proxy**:
   ```bash
   railway connect MySQL
   ```
   This creates a local proxy to your Railway MySQL

2. **Run Migration** (in another terminal):
   ```bash
   npx prisma migrate deploy
   ```

---

## Step 6: Create Admin User

### Using Railway CLI:

```bash
# Connect to your project
railway link

# Run Prisma Studio
railway run npx prisma studio
```

Then create a user with `role: "admin"` in the UI.

### Using SQL Query:

```bash
# Connect to MySQL shell
railway connect MySQL

# In MySQL shell:
USE railway;  -- or your database name

-- Create admin user
INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
VALUES (
  UUID(),
  'admin@yourdomain.com',
  'Admin',
  '$2a$10$YourBcryptHashedPassword',
  'admin',
  NOW(),
  NOW()
);
```

**Generate hashed password:**
```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 10))"
```

---

## Step 7: Configure Custom Domain (Optional)

1. **In Railway Dashboard**:
   - Click on your Next.js service
   - Go to "Settings" tab
   - Scroll to "Domains"
   - Click "Generate Domain" for free Railway domain
   - Or add your custom domain

2. **Update NEXTAUTH_URL**:
   - Update the `NEXTAUTH_URL` environment variable with your new domain
   - Example: `https://your-app.up.railway.app`

3. **For Custom Domain**:
   - Add CNAME record in your DNS:
     - Name: `www` (or your subdomain)
     - Value: Your Railway domain
   - Wait for DNS propagation (~5-60 minutes)

---

## Step 8: Verify Deployment

1. **Check Build Logs**:
   - Click on your Next.js service
   - View "Deployments" tab
   - Check latest deployment logs

2. **Test the Application**:
   - Visit your Railway URL
   - Login with admin credentials
   - Create an agent
   - Test WhatsApp QR code generation
   - Scan QR code - connection should persist!

3. **Monitor WhatsApp Sessions**:
   - Check that sessions remain connected
   - Unlike Vercel, sessions should persist across requests

---

## Automatic Deploys

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway will:
1. Detect the push
2. Build your app
3. Run migrations (if configured)
4. Deploy new version
5. Zero-downtime deployment

---

## Monitoring & Logs

### View Logs:
1. Click on your service
2. Go to "Logs" tab
3. See real-time application logs

### Metrics:
1. Click on your service
2. Go to "Metrics" tab
3. View CPU, Memory, Network usage

### Alerts:
- Railway will email you about deployment failures
- Set up health check endpoints for monitoring

---

## Railway CLI Commands

```bash
# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run commands in production environment
railway run <command>

# Connect to database
railway connect MySQL

# Deploy manually
railway up

# Open app in browser
railway open

# View environment variables
railway variables

# Add environment variable
railway variables set KEY=value
```

---

## Persistent Storage for WhatsApp Sessions

Railway automatically provides persistent storage at `/app/whatsapp_sessions/`. Your WhatsApp sessions will be stored here and persist across deployments.

**Important Notes:**
- Sessions persist during deployments
- Sessions are lost if you delete and recreate the service
- For critical production, consider backing up session files

---

## Cost Estimation

Railway Pricing (as of 2024):
- **Free Trial**: $5 in credits
- **Hobby Plan**: $5/month (500 hours)
- **Pay-as-you-go**: ~$10-20/month for small apps

**Typical Costs for This App:**
- Next.js Service: ~$5-10/month
- MySQL Database: ~$5/month
- Total: ~$10-15/month

Much cheaper than managing your own VPS!

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**
```bash
# Ensure postinstall script is in package.json:
"postinstall": "prisma generate"
```

**Error: "Prisma migration failed"**
- Check DATABASE_URL is correctly set
- Ensure MySQL service is running
- Try running migrations manually via CLI

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify MySQL service is running in Railway
- Check DATABASE_URL format: `mysql://user:pass@host:port/db`
- Ensure both services are in same project

### WhatsApp Sessions Not Persisting

**Issue: Sessions disconnect after restart**
- This shouldn't happen on Railway (unlike Vercel)
- Check that `/app/whatsapp_sessions/` directory exists
- Verify filesystem is writable

**Check logs:**
```bash
railway logs
```

### Port Issues

Railway automatically assigns a PORT environment variable. Next.js handles this automatically, but if you have custom server code:

```javascript
const port = process.env.PORT || 3000;
```

---

## Production Checklist

- [ ] MySQL database created and connected
- [ ] All environment variables set
- [ ] Database migrations completed successfully
- [ ] Admin user created
- [ ] WhatsApp QR code generates
- [ ] WhatsApp connection persists after scan
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Backup strategy for database
- [ ] Monitoring alerts configured

---

## Backup Strategy

### Database Backups:

**Option 1: Railway Backups**
- Railway Pro plan includes automated backups
- Manual backups via CLI:
  ```bash
  railway connect MySQL
  mysqldump railway > backup.sql
  ```

**Option 2: Scheduled Backups**
- Use cron job to backup to S3/Cloud Storage
- Create backup script in your app

### WhatsApp Session Backups:

Consider periodic backups of `/app/whatsapp_sessions/`:
```javascript
// Add to your cron jobs
async function backupSessions() {
  // Compress and upload to S3/Cloud Storage
}
```

---

## Scaling

As your app grows:

1. **Upgrade Railway Plan**:
   - More resources
   - Better performance
   - Automated backups

2. **Database Optimization**:
   - Add indexes to frequently queried tables
   - Use connection pooling (Prisma does this)
   - Monitor slow queries

3. **Horizontal Scaling**:
   - Railway supports multiple instances
   - Load balancing included

4. **Caching**:
   - Add Redis for session caching
   - Cache API responses

---

## Migration from Vercel

If you started on Vercel:

1. **Export Vercel Environment Variables**:
   ```bash
   vercel env pull .env.production
   ```

2. **Import to Railway**:
   - Use Railway dashboard to add variables
   - Or use Railway CLI

3. **Migrate Database**:
   ```bash
   # Export from current database
   mysqldump olddb > backup.sql

   # Import to Railway
   railway connect MySQL
   mysql railway < backup.sql
   ```

4. **Update DNS**:
   - Point domain to Railway
   - Update NEXTAUTH_URL

---

## Security Best Practices

1. ✅ Use strong NEXTAUTH_SECRET
2. ✅ Enable MySQL SSL (Railway does this by default)
3. ✅ Restrict database access to Railway network
4. ✅ Use environment variables for secrets
5. ✅ Keep dependencies updated
6. ✅ Enable rate limiting
7. ✅ Regular security audits
8. ✅ Monitor logs for suspicious activity

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app/
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Comparison: Railway vs Vercel

| Feature | Railway | Vercel |
|---------|---------|--------|
| WhatsApp Sessions | ✅ Persistent | ❌ Ephemeral |
| Database | ✅ Built-in MySQL | ❌ External only |
| File Storage | ✅ Persistent | ❌ Temporary |
| Deployment | ✅ Containers | Serverless |
| Cost | ~$10-15/mo | Free tier, then $20/mo |
| Best For | WhatsApp apps | Static/JAMstack sites |

**Verdict**: For this WhatsApp app, Railway is strongly recommended over Vercel.

---

## Next Steps

1. Sign up for Railway
2. Connect your GitHub repository
3. Add MySQL database
4. Configure environment variables
5. Run database migrations
6. Create admin user
7. Test WhatsApp connectivity
8. Enjoy persistent sessions! 🎉

Need help? Check the troubleshooting section or Railway's excellent documentation.

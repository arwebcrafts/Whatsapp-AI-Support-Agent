# 📝 Post-Deployment Quick Reference

Run these commands **AFTER** your app is deployed to Railway.

---

## 🚀 Required: Database Setup

### Install Railway CLI

```bash
npm install -g @railway/cli
```

### Login and Link Project

```bash
# Login to Railway
railway login

# Link to your project (run in project directory)
railway link
```

### Run Prisma Migrations

```bash
# Generate Prisma Client
railway run npx prisma generate

# Push schema to database (creates tables + indexes)
railway run npx prisma db push
```

**Expected Output:**
```
✅ Generated Prisma Client
✅ Database schema applied successfully
🚀 Done in 2.5s
```

---

## ✅ Verify Database

### Check Tables Created

```bash
railway run npx prisma studio
```

This opens Prisma Studio in your browser. Verify you see these tables:
- ✅ users
- ✅ agents
- ✅ conversations
- ✅ messages
- ✅ knowledge_base
- ✅ whatsapp_connections
- ✅ message_usage
- ✅ (and others...)

---

## 🔧 Optional: Database Commands

### Reset Database (⚠️ DELETES ALL DATA!)

```bash
railway run npx prisma db push --force-reset
```

**Use only in development!**

### View Database Connection

```bash
railway run npx prisma db pull
```

### Run Custom SQL

```bash
railway run psql $DATABASE_URL
```

---

## 🔍 Troubleshooting

### "Table doesn't exist" Error

```bash
railway run npx prisma db push --force-reset
railway run npx prisma generate
```

### "Prisma Client not generated"

```bash
railway run npx prisma generate
```

Then restart your Railway service.

### Check Environment Variables

```bash
railway variables
```

---

## 📊 Check App Status

### View Logs

```bash
railway logs
```

### Check Service Status

```bash
railway status
```

---

## 🎯 Quick Deployment Test

After running migrations, test your app:

1. **Visit Homepage:** `https://your-app.up.railway.app`
2. **Sign Up:** Create test account
3. **Verify Email:** Check inbox (if email configured)
4. **Login:** Use credentials
5. **Dashboard:** Should load without errors
6. **WhatsApp:** Generate QR code

---

## ⚡ Pro Tips

### Run Multiple Commands

```bash
railway run "npx prisma generate && npx prisma db push"
```

### Check Redis Connection

Check Railway logs for:
```
✅ Redis rate limiter connected successfully
```

If you see "falling back to in-memory", set Redis env vars.

### Force Redeploy

```bash
# After changing environment variables
railway up --detach
```

---

## 📚 Need More Help?

- **Full Guide:** See `RAILWAY-DEPLOYMENT.md`
- **General Deployment:** See `PRODUCTION-DEPLOYMENT.md`
- **QA Fixes:** See `QA-FIXES-SUMMARY.md`

---

**Last Updated:** 2025-11-25

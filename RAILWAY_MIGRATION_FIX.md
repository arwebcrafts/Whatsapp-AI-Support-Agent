# Railway Migration Fix Guide

## Problem: P3009 Migration Error on Railway

If your Railway deployment is crashing with this error:

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20251115213700_init` migration started at 2025-11-17 15:52:59.530 UTC failed
```

This guide will help you fix it.

---

## What Happened?

A Prisma migration started but didn't complete successfully, leaving the database in a "dirty" state. This blocks all future migrations and prevents the server from starting.

---

## Quick Fix (Recommended)

### Option 1: Using Railway CLI

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run the migration fix**:
   ```bash
   railway run npm run fix:migration:deploy
   ```

   This will:
   - Connect to your Railway database
   - Mark the failed migration as rolled back
   - Re-run `prisma migrate deploy`
   - Your server should start working again!

### Option 2: Manual Fix via Railway Dashboard

1. **Open your Railway project dashboard**
2. **Go to your service → Variables**
3. **Copy the `DATABASE_URL` value**
4. **On your local machine**, create a `.env` file:
   ```env
   DATABASE_URL="your-railway-database-url-here"
   ```

5. **Run the fix locally**:
   ```bash
   npm run fix:migration:deploy
   ```

6. **Redeploy on Railway** - it should now work!

### Option 3: Change Railway Start Command (Prevention)

1. **Go to Railway Dashboard → Your Service → Settings**
2. **Find "Start Command" or "Deploy Command"**
3. **Change it to**:
   ```bash
   npm run start:safe
   ```

This uses a safer start command that automatically fixes migration issues before starting the server.

---

## Understanding the Fix

The `fix-migration.js` script does the following:

1. **Connects** to your Railway MySQL database
2. **Checks** for failed migrations in `_prisma_migrations` table
3. **Marks** them as "rolled back" so Prisma can retry
4. **Optionally runs** `prisma migrate deploy` to apply migrations
5. **Reports** the status

---

## Available npm Scripts

```bash
npm run fix:migration          # Just mark failed migrations as rolled back
npm run fix:migration:deploy   # Fix + run prisma migrate deploy
npm run start:safe            # Fix migrations + start server (safe for Railway)
```

---

## Prevention for Future Deployments

To prevent this issue in the future:

### Method 1: Use Safe Start Command

In your Railway service settings, set the start command to:
```bash
npm run start:safe
```

### Method 2: Use Railway Build & Start Scripts

1. **Build Command**: `npm run build`
2. **Start Command**: `npm run start:safe`

This ensures migrations are always fixed before the server starts.

---

## Troubleshooting

### "mysql2 package is not installed"
This should never happen as `mysql2` is in dependencies. If you see this:
```bash
npm install mysql2
```

### "DATABASE_URL not set"
Make sure you're running the command via Railway CLI or have a `.env` file with the DATABASE_URL.

### "Could not connect to database"
- Check your Railway database is running
- Verify the DATABASE_URL is correct
- Check network connectivity

### Still crashing after fix?
1. Check Railway logs for new errors
2. Try running `railway run npx prisma migrate status`
3. If needed, run `railway run npx prisma migrate resolve --rolled-back 20251115213700_init`

---

## Why This Happens

Common causes:
- **Network timeout** during migration
- **Database connection lost** mid-migration
- **Railway restart** during deployment
- **Concurrent deployments** trying to migrate at the same time

The fix is safe and non-destructive - it just tells Prisma "yes, we know this migration failed, please retry it."

---

## Need Help?

If this guide doesn't solve your issue:
1. Check Railway logs: `railway logs`
2. Check database connection: `railway run npx prisma db pull`
3. Contact support with the error logs

---

## Summary

**Fastest fix:**
```bash
railway run npm run fix:migration:deploy
```

**For future prevention, set Railway start command to:**
```bash
npm run start:safe
```

Done! 🚀

# 🔧 Prisma Migration Fix Guide

## Problem
You're experiencing a **P3009 error** where Prisma found a failed migration (`20251115213700_init`) and won't apply new migrations. This causes your server to crash on startup.

## Quick Fix (Choose ONE method)

### Method 1: Using the Node.js Fix Script (Recommended)

1. **Create your `.env` file** (if you don't have one):
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and set your DATABASE_URL**:
   ```env
   DATABASE_URL="mysql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:3306/YOUR_DATABASE"
   ```

   Example:
   ```env
   DATABASE_URL="mysql://root:mypassword@localhost:3306/whasales"
   ```

3. **Run the fix script**:
   ```bash
   node fix-migration.js
   ```

4. **Deploy migrations**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Start your server**:
   ```bash
   npm start
   ```

---

### Method 2: Using MySQL CLI Directly

1. **Connect to your MySQL database**:
   ```bash
   mysql -u YOUR_USER -p YOUR_DATABASE
   ```

2. **Run the SQL fix script**:
   ```bash
   source fix-migration.sql
   ```

   Or manually run this SQL:
   ```sql
   UPDATE _prisma_migrations
   SET rolled_back_at = NOW(),
       logs = CONCAT(COALESCE(logs, ''), '\nManually rolled back due to P3009 error')
   WHERE migration_name = '20251115213700_init'
     AND finished_at IS NULL
     AND rolled_back_at IS NULL;
   ```

3. **Exit MySQL**:
   ```sql
   exit;
   ```

4. **Deploy migrations**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Start your server**:
   ```bash
   npm start
   ```

---

### Method 3: Using Prisma CLI (if Prisma CLI is working)

If you can get Prisma CLI working (currently having engine download issues), run:

```bash
npx prisma migrate resolve --rolled-back "20251115213700_init"
npx prisma migrate deploy
npm start
```

---

## Troubleshooting

### Issue: "DATABASE_URL environment variable is not set"
- Make sure you have a `.env` file in your project root
- Ensure `DATABASE_URL` is properly set in the `.env` file
- Format: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

### Issue: "Cannot connect to database"
- Verify your MySQL server is running
- Check your database credentials in `.env`
- Ensure the database exists
- Check firewall settings if connecting to remote database

### Issue: "Table _prisma_migrations doesn't exist"
- This means your database is completely new
- Simply run: `npx prisma migrate deploy`
- It will create all tables from scratch

### Issue: Prisma engine download errors (403 Forbidden)
- This is why Method 1 or 2 is recommended
- They bypass the Prisma CLI and fix the database directly
- After fixing with Method 1 or 2, migrations should work normally

---

## What Happened?

The migration `20251115213700_init` started but didn't complete successfully. Prisma marked it as "failed" in the `_prisma_migrations` table. When you try to restart the server:

1. The server runs `prisma migrate deploy` (from `package.json`)
2. Prisma sees the failed migration and refuses to continue
3. Server crashes with P3009 error

By marking the migration as "rolled back", we're telling Prisma:
- "This migration didn't apply, so forget about it"
- "Feel free to try applying it again"

Then when you run `prisma migrate deploy`, Prisma will:
- See the migration is rolled back (not failed)
- Try to apply it again from scratch
- Complete successfully this time

---

## Prevention

To avoid this in the future:

1. **Always backup your database** before running migrations in production
2. **Test migrations locally** before deploying to production
3. **Check database connection** before running migrations
4. **Monitor migration logs** during application startup

---

## Need More Help?

If these methods don't work:

1. Check if your database server is running
2. Verify database credentials
3. Check database logs for errors
4. Ensure you have proper permissions on the database
5. Try creating a fresh database and running migrations from scratch

---

## Files Created

- `fix-migration.js` - Node.js script to fix the migration automatically
- `fix-migration.sql` - SQL script to run manually in MySQL
- `MIGRATION_FIX_GUIDE.md` - This comprehensive guide

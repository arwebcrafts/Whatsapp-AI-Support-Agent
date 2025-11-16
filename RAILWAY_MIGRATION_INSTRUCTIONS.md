# Railway Database Migration Instructions

## Quick Fix for Database Updates

Since automatic migrations aren't running, follow these steps to manually update your MySQL database on Railway:

### Option 1: Run via Railway CLI (Recommended)

1. **Open Railway Dashboard**
   - Go to your Railway project
   - Click on your MySQL database service

2. **Open the Query Editor**
   - Click on "Data" tab
   - Click "Query" button

3. **Copy and Paste SQL**
   - Open the file `railway-migration.sql` in this repository
   - Copy ALL the contents
   - Paste into the Railway Query Editor
   - Click "Run" or "Execute"

4. **Verify Success**
   - You should see: "All migrations applied successfully!"
   - Check the "Tables" tab to verify new tables exist:
     - `conversation_analytics`
     - `agent_feedback`
     - `agent_performance`
     - `conversation_insights`
     - `agent_learning_log`

### Option 2: Run via Railway CLI (if you have it installed)

```bash
railway run npx prisma migrate deploy
```

### What This Migration Does

This migration adds all new features:

1. **Email Verification System**
   - Adds `emailVerified`, `verificationToken`, `verificationTokenExpiry` to users table

2. **User Profile Fields**
   - Adds `company` and `phone` to users table

3. **Conversation Notes**
   - Adds `notes` field to conversations table

4. **Agent Learning System** (5 new tables)
   - `conversation_analytics` - Track conversation quality and metrics
   - `agent_feedback` - Store user ratings and feedback
   - `agent_performance` - Track agent performance over time
   - `conversation_insights` - Store discovered patterns and learnings
   - `agent_learning_log` - Track learning events

### After Running Migration

1. **Redeploy your app** (if build was failing)
   - The build should now succeed
   - All new features will be available

2. **Access New Features**
   - Visit `/dashboard/agent-learning` to see the learning dashboard
   - Rate conversations in the conversations panel
   - Email verification will work on signup

### Troubleshooting

**If you see errors about tables already existing:**
- That's OK! The migration uses `IF NOT EXISTS` so it's safe to re-run
- It will only create tables/columns that don't exist

**If you see permission errors:**
- Make sure you're running the query on the correct MySQL database
- Contact Railway support if needed

**If build still fails:**
- Make sure nodemailer is installed (check package.json)
- Check Railway build logs for specific errors

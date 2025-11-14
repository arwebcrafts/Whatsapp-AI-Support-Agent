# Developer Setup Guide - WhaSales AI

## Complete Feature List

### ✅ Fully Implemented Features

1. **Landing Page**
   - Complete pricing tables (Monthly, Yearly, Lifetime)
   - Black Friday promotion banner
   - Feature showcase
   - FAQ section

2. **Authentication System**
   - Email/Password signup and login
   - NextAuth.js integration
   - Session management
   - **3-day free trial** (auto-expires and disconnects)

3. **Onboarding Flow**
   - Business type selection
   - AI tone customization
   - Knowledge base setup
   - WhatsApp connection

4. **WhatsApp Integration** (Baileys)
   - QR code generation and scanning
   - Real-time connection status
   - **Previous chat import** - Automatically imports existing WhatsApp chats
   - **AI chat analysis** - Analyzes conversation history to understand style
   - **Cold lead identification** - Identifies non-converted leads for follow-up
   - Message sending and receiving
   - Session persistence

5. **AI Auto-Reply System**
   - OpenAI GPT-4o-mini integration
   - Context-aware responses
   - Knowledge base integration
   - **Learning from previous chats** - AI learns from imported conversations
   - **Automatic lead conversion** - AI tries to convert cold leads
   - Message history tracking

6. **Conversations Management**
   - Full inbox view
   - Individual chat interface
   - AI toggle (enable/disable per conversation)
   - Lead scoring (hot/warm/cold)
   - Real-time message updates
   - Manual chat takeover

7. **Knowledge Base**
   - Manual content input
   - Multiple knowledge entries
   - FAQ support
   - Content management (add/delete)

8. **Stripe Integration** (Ready for Developer)
   - Checkout session creation
   - Webhook handling
   - Subscription management
   - Lifetime payment support
   - Trial to paid conversion
   - Cancellation handling

9. **Billing Page**
   - Plan comparison
   - Upgrade/downgrade
   - Payment history
   - Subscription status

10. **Message Usage & Limits**
    - Monthly message tracking
    - Automatic limit enforcement
    - Usage dashboard
    - Plan-based limits

11. **Trial Management**
    - **3-day trial period**
    - Automatic expiration
    - **Auto-disconnect after trial**
    - Upgrade prompts

## Stripe Setup Instructions

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Create an account
3. Complete verification

### Step 2: Get API Keys
1. Go to Stripe Dashboard → Developers → API keys
2. Copy **Publishable key** and **Secret key**
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### Step 3: Create Products and Prices

#### Monthly Plans
1. Dashboard → Products → Create Product
2. Create:
   - **Starter Monthly**: $9/month recurring
   - **Professional Monthly**: $19/month recurring
   - **Business Monthly**: $39/month recurring

#### Yearly Plans
1. Same products, add new prices:
   - **Starter Yearly**: $79/year recurring
   - **Professional Yearly**: $169/year recurring
   - **Business Yearly**: $349/year recurring

#### Lifetime Plans
1. Same products, add one-time prices:
   - **Lifetime Starter**: $79 one-time
   - **Lifetime Pro**: $149 one-time
   - **Lifetime Business**: $249 one-time

### Step 4: Copy Price IDs
1. For each price, copy the `price_xxx` ID
2. Add to `.env.local`:
   ```
   STRIPE_PRICE_STARTER_MONTHLY="price_xxx"
   STRIPE_PRICE_STARTER_YEARLY="price_xxx"
   STRIPE_PRICE_PRO_MONTHLY="price_xxx"
   STRIPE_PRICE_PRO_YEARLY="price_xxx"
   STRIPE_PRICE_BUSINESS_MONTHLY="price_xxx"
   STRIPE_PRICE_BUSINESS_YEARLY="price_xxx"
   STRIPE_PRICE_LIFETIME_STARTER="price_xxx"
   STRIPE_PRICE_LIFETIME_PRO="price_xxx"
   STRIPE_PRICE_LIFETIME_BUSINESS="price_xxx"
   ```

### Step 5: Set Up Webhook
1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

### Step 6: Test Payments
1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Test all plans (monthly, yearly, lifetime)

## Trial Expiration & Auto-Disconnect

### How It Works
1. Users get **3 days free trial** on signup
2. After 3 days:
   - WhatsApp automatically disconnects
   - AI replies stop
   - User prompted to upgrade

### Setting Up Cron Job

#### Option 1: Vercel Cron (Recommended if using Vercel)
1. Create `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/check-trials",
       "schedule": "0 0 * * *"
     }]
   }
   ```

#### Option 2: External Cron Service
1. Use cron-job.org or similar
2. Set up daily job to hit:
   ```
   POST https://yourdomain.com/api/cron/check-trials
   Authorization: Bearer YOUR_CRON_SECRET
   ```
3. Add to `.env.local`:
   ```
   CRON_SECRET="your-secure-random-string"
   ```

## Database Setup

### Using Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```

### Using Neon
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Add to `.env.local`

### Run Migrations
```bash
npx prisma generate
npx prisma db push
```

## OpenAI Setup

1. Go to https://platform.openai.com
2. Create API key
3. Add to `.env.local`:
   ```
   OPENAI_API_KEY="sk-proj-..."
   ```

**Note:** The provided OpenAI key in the spec has already been added to `.env.local`

## Environment Variables Checklist

Create `.env.local` with:
```env
# Database
DATABASE_URL="postgresql://..."

# OpenAI (Use the key provided by client)
OPENAI_API_KEY="your-openai-api-key-from-client"

# NextAuth
NEXTAUTH_SECRET="generate-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (ADD YOUR KEYS)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Stripe Price IDs (CREATE IN STRIPE DASHBOARD)
STRIPE_PRICE_STARTER_MONTHLY=""
STRIPE_PRICE_STARTER_YEARLY=""
STRIPE_PRICE_PRO_MONTHLY=""
STRIPE_PRICE_PRO_YEARLY=""
STRIPE_PRICE_BUSINESS_MONTHLY=""
STRIPE_PRICE_BUSINESS_YEARLY=""
STRIPE_PRICE_LIFETIME_STARTER=""
STRIPE_PRICE_LIFETIME_PRO=""
STRIPE_PRICE_LIFETIME_BUSINESS=""

# Cron
CRON_SECRET="generate-random-string"
```

## Running the App

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev

# Open http://localhost:3000
```

## Testing the Full Flow

### 1. Test Signup & Trial
1. Sign up with email/password
2. Complete onboarding
3. Note trial expires in 3 days

### 2. Test WhatsApp Connection
1. Go to Dashboard → WhatsApp
2. Click "Connect WhatsApp"
3. Scan QR code with phone
4. **Previous chats will import automatically**
5. **AI analyzes conversations**
6. **Cold leads identified**

### 3. Test AI Replies
1. Send message from another WhatsApp
2. AI should reply automatically
3. Check Dashboard → Conversations
4. Toggle AI on/off per chat
5. Manual takeover works

### 4. Test Knowledge Base
1. Add business information
2. Send test message
3. AI uses knowledge in response

### 5. Test Stripe (with test mode)
1. Go to Billing
2. Click upgrade
3. Use test card: 4242 4242 4242 4242
4. Complete payment
5. Check subscription updated

### 6. Test Message Limits
1. Check usage dashboard
2. Send messages until limit
3. AI should stop responding
4. Upgrade to increase limit

### 7. Test Trial Expiration
1. Manually trigger cron:
   ```bash
   curl -X POST https://localhost:3000/api/cron/check-trials \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
2. Expired trials should disconnect

## Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Database
- Use Supabase or Neon (already PostgreSQL)

### WhatsApp Service
- Deploy to Railway, Render, or DigitalOcean
- **Needs persistent filesystem** for Baileys sessions
- **Not compatible with serverless**

### Cron Job
- Set up Vercel Cron or external service
- Runs daily to check trials

## Troubleshooting

### WhatsApp Not Connecting
- Check auth_sessions directory exists
- Ensure persistent filesystem
- Check console for errors

### AI Not Replying
- Verify OpenAI API key
- Check message limits
- Verify trial not expired
- Check knowledge base exists

### Stripe Webhook Failed
- Verify webhook secret
- Check endpoint URL
- Test with Stripe CLI

### Previous Chats Not Importing
- Ensure WhatsApp connection successful
- Check console logs
- Verify database permissions

## Support

For issues:
- Check console logs
- Review Prisma Studio: `npx prisma studio`
- Check database connections
- Verify all environment variables

## Security Notes

1. Never commit `.env.local`
2. Use strong NEXTAUTH_SECRET
3. Use strong CRON_SECRET
4. Keep Stripe keys secure
5. Rotate keys regularly

---

All features are complete and production-ready!

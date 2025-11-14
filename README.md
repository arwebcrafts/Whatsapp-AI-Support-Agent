# WhaSales AI - WhatsApp AI Sales Platform

Turn WhatsApp chats into sales with AI-powered automation. No official WhatsApp API needed.

## Features

- 🤖 **AI Auto-Replies 24/7** - Never miss a lead with instant AI responses
- 📱 **WhatsApp Integration** - Connect via QR code, no official API needed
- 🔄 **Previous Chat Import** - Automatically imports existing WhatsApp conversations
- 🧠 **AI Learning** - Analyzes your previous chats to understand your style
- 🎯 **Cold Lead Conversion** - AI identifies and tries to convert non-converted leads
- 💬 **Voice Note Support** - AI understands and responds to voice messages
- ⚡ **Smart Follow-Ups** - Automatic follow-ups for inactive leads
- 🌍 **Multi-Language** - Chat with customers in any language
- 👥 **Conversation Management** - Full inbox with manual takeover capability
- 📚 **Knowledge Base Training** - Train AI with your business information
- 📊 **Analytics Dashboard** - Track conversions and performance
- 💳 **Stripe Integration** - Secure payment processing with lifetime deals
- ⏱️ **3-Day Free Trial** - Auto-disconnect after trial expires
- 🎫 **Message Limits** - Automatic enforcement based on plan

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **WhatsApp:** Baileys library (no official API required)
- **AI:** OpenAI GPT-4
- **Payments:** Stripe

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Whatsapp-AI-Support-Agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `NEXTAUTH_SECRET` - Random secret for NextAuth
   - `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── onboarding/        # Onboarding flow
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # UI components (shadcn)
│   └── dashboard-layout.tsx
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
│   └── schema.prisma
└── types/                # TypeScript types
```

## Pricing Plans

### Monthly Plans
- **Starter:** $9/month - 2,000 messages
- **Professional:** $19/month - 5,000 messages
- **Business:** $39/month - 12,000 messages

### Yearly Plans (Save 31-32%)
- **Starter:** $79/year
- **Professional:** $169/year
- **Business:** $349/year

### Lifetime Deals (Black Friday Special)
- **Lifetime Starter:** $79 one-time
- **Lifetime Pro:** $149 one-time
- **Lifetime Business:** $249 one-time

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and subscription info
- `whatsapp_connections` - WhatsApp connection data
- `conversations` - Customer conversations
- `messages` - Individual messages
- `knowledge_base` - AI training data
- `message_usage` - Monthly usage tracking

## WhatsApp Integration

This platform uses the Baileys library to connect to WhatsApp without requiring the official Business API. Users simply scan a QR code to link their WhatsApp account.

### How it works:
1. User navigates to WhatsApp connection page
2. System generates QR code using Baileys
3. User scans QR code with WhatsApp mobile app
4. Connection established and session stored
5. Incoming messages trigger AI responses

## AI System

The AI system uses OpenAI's GPT-4 to generate contextual responses based on:
- User's knowledge base
- Conversation history
- Business type and tone preferences
- Customer's message content

## Deployment

### Vercel (Recommended for Frontend)
```bash
vercel deploy
```

### Database
- Use Supabase, Neon, or any PostgreSQL provider
- Set `DATABASE_URL` in environment variables

### WhatsApp Service
The Baileys service requires a persistent server (not serverless):
- Deploy to Railway, Render, or DigitalOcean
- Ensure websocket support for WhatsApp connection

## Environment Variables

Create a `.env.local` file with these variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whasales"

# OpenAI
OPENAI_API_KEY="sk-..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PRICE_STARTER_MONTHLY="price_..."
STRIPE_PRICE_STARTER_YEARLY="price_..."
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_BUSINESS_MONTHLY="price_..."
STRIPE_PRICE_BUSINESS_YEARLY="price_..."
STRIPE_PRICE_LIFETIME_STARTER="price_..."
STRIPE_PRICE_LIFETIME_PRO="price_..."
STRIPE_PRICE_LIFETIME_BUSINESS="price_..."
```

## Development

### Run database migrations
```bash
npx prisma generate
npx prisma db push
```

### View database
```bash
npx prisma studio
```

### Build for production
```bash
npm run build
npm start
```

## 🎉 COMPLETE Features

### Core Platform
✅ Landing page with Black Friday pricing (Monthly/Yearly/Lifetime)
✅ User authentication (signup/login with NextAuth.js)
✅ 3-step onboarding flow
✅ Database schema with Prisma (PostgreSQL)
✅ Main dashboard with real-time stats
✅ Responsive dashboard layout with navigation

### WhatsApp Integration
✅ **WhatsApp QR connection** (Baileys library)
✅ **Previous chat import** - Automatically imports existing conversations
✅ **AI analysis of history** - Learns from your past chats
✅ **Cold lead identification** - Finds non-converted leads
✅ **Automatic lead conversion** - AI tries to convert cold leads
✅ Real-time message handling
✅ Session persistence

### Conversations
✅ **Full inbox interface**
✅ **Individual chat view**
✅ **AI toggle** per conversation
✅ **Manual takeover** capability
✅ **Lead scoring** (hot/warm/cold)
✅ Real-time updates

### AI System
✅ **AI auto-reply with OpenAI GPT-4o-mini**
✅ **Knowledge base integration**
✅ **Context-aware responses**
✅ **Multi-language support**
✅ Message history tracking

### Knowledge Base
✅ **Manual content management**
✅ **Multiple entries support**
✅ **FAQ ready**
✅ Content CRUD operations

### Stripe & Billing
✅ **Complete Stripe integration**
✅ **Checkout sessions** (monthly/yearly/lifetime)
✅ **Webhook handling**
✅ **Subscription management**
✅ **Billing page** with plan comparison
✅ **Upgrade/downgrade flows**
✅ **Cancellation support**

### Trial & Limits
✅ **3-day free trial** (auto-expires)
✅ **Automatic WhatsApp disconnect** after trial
✅ **Message usage tracking**
✅ **Automatic limit enforcement**
✅ **Cron job** for trial expiration
✅ Plan-based message limits

### Future Enhancements
⏳ Voice note transcription
⏳ Advanced analytics
⏳ Team collaboration
⏳ Multi-agent support
⏳ CRM integrations

## Contributing

This is a commercial project. Contact the owner for contribution guidelines.

## License

Proprietary - All rights reserved

## Support

For support, email support@whasales.ai

---

Built with ❤️ using Next.js 14, Prisma, and OpenAI

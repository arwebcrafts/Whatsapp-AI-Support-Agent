# MySQL Migration & New Features Guide

## ✅ Completed Migrations & Features

### 1. Database Migration to MySQL

**Changed:**
- Database provider from PostgreSQL to MySQL
- Updated `.env.example` and `.env.local`
- Modified Prisma schema for MySQL compatibility

**New Database Structure:**
- Added `Agent` model for multiple AI agents per user
- Added `AgentKnowledge` linking table
- Updated `KnowledgeBase` to support larger content (LongText)
- Added agent relationship to WhatsAppConnection and Conversation

**Connection String Format:**
```
DATABASE_URL="mysql://username:password@host:3306/database_name"
```

**For Local MySQL:**
```
DATABASE_URL="mysql://root:password@localhost:3306/whasales"
```

### 2. Multiple AI Agents System

**Features:**
- Users can create unlimited AI agents
- Each agent can have its own:
  - Name and description
  - Business type
  - AI tone (professional, friendly, direct, warm)
  - Knowledge base
  - WhatsApp connection
  - Conversations

**Pre-built Templates (9 Ready-to-Use):**
1. E-commerce Sales Agent 🛍️
2. Real Estate Agent 🏠
3. Education & Course Sales 🎓
4. Agency & Freelancer 💼
5. Restaurant & Food Service 🍽️
6. Healthcare & Wellness 🏥
7. Automotive Sales 🚗
8. SaaS & Technology 💻
9. General Customer Support 💬

### 3. Enhanced Knowledge Base

**New Capabilities:**
- **Text Input:** Up to 50,000 characters (10,000 words+)
- **PDF Upload:** Automatic text extraction
- **Word Documents (.docx):** Automatic text extraction
- **Website Scraping:** Fetch content from any URL
- **Multiple Sources:** Combine all types for one agent

**File Size Limits:**
- PDF: Up to 10MB
- Word: Up to 10MB
- Text: Up to 50,000 characters

### 4. Fixed WhatsApp QR Scanning

**New Implementation (`whatsapp-service-fixed.ts`):**
- Improved QR code generation
- Better session management
- More reliable connection handling
- Real-time status updates
- Automatic reconnection on disconnect
- Per-agent WhatsApp connections

**Key Fixes:**
- QR code now displays immediately
- Better error handling
- Session persistence improved
- Connection status tracking
- Terminal QR code for debugging

### 5. Document Processing System

**Supported Formats:**
- **PDF** - Full text extraction
- **Word (.docx)** - Full text extraction
- **Plain Text (.txt)** - Direct import
- **Websites** - Content scraping

**Features:**
- Automatic text sanitization
- Keyword extraction
- Content validation
- Size optimization

## 🚀 Setup Instructions

### Step 1: MySQL Database Setup

#### Option A: Local MySQL
```bash
# Install MySQL (if not installed)
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# Create database
mysql -u root -p
CREATE DATABASE whasales;
```

#### Option B: Cloud MySQL (Recommended)
Popular providers:
- **PlanetScale** (Free tier, no password needed)
- **AWS RDS** (Reliable, scalable)
- **Digital Ocean** (Simple, affordable)
- **Railway** (Easy setup)

### Step 2: Update Environment Variables

Edit `.env.local`:
```env
DATABASE_URL="mysql://username:password@host:3306/whasales"
```

### Step 3: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) View database
npx prisma studio
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Run Development Server

```bash
npm run dev
```

## 📊 New API Endpoints

### Agent Management
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/[id]` - Get agent details
- `PATCH /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

### Knowledge Base Enhancement
- `POST /api/knowledge/upload` - Upload PDF/Word/Text file
- `POST /api/knowledge/scrape` - Scrape website content
- `GET /api/knowledge` - List knowledge items (existing)
- `POST /api/knowledge` - Add manual text (existing)

### WhatsApp (Agent-based)
- `POST /api/whatsapp/connect` - Connect agent to WhatsApp
- `GET /api/whatsapp/status` - Get connection status
- `POST /api/whatsapp/disconnect` - Disconnect agent

## 🎨 Using Pre-built Templates

### From Code:
```typescript
import { agentTemplates, getTemplateByType } from '@/lib/agent-templates';

// Get all templates
const templates = agentTemplates;

// Get specific template
const ecommerceTemplate = getTemplateByType('ecommerce');

// Create agent from template
const agent = await prisma.agent.create({
  data: {
    userId: user.id,
    name: ecommerceTemplate.name,
    description: ecommerceTemplate.description,
    businessType: ecommerceTemplate.businessType,
    aiTone: ecommerceTemplate.aiTone,
  },
});
```

### From API:
```bash
POST /api/agents
{
  "name": "My E-commerce Agent",
  "description": "Handles product sales",
  "businessType": "ecommerce",
  "aiTone": "friendly",
  "knowledgeContent": "We sell handmade leather goods..."
}
```

## 📝 Knowledge Base Usage

### Upload PDF:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('agentId', agentId);

await fetch('/api/knowledge/upload', {
  method: 'POST',
  body: formData,
});
```

### Scrape Website:
```javascript
await fetch('/api/knowledge/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://yourwebsite.com',
    agentId: agentId,
  }),
});
```

### Add Manual Text:
```javascript
await fetch('/api/knowledge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Your business information here...',
    title: 'Business Info',
    sourceType: 'manual',
  }),
});
```

## 🔧 WhatsApp Integration (Agent-based)

### Connect Agent to WhatsApp:
```javascript
// Each agent can have its own WhatsApp number
const response = await fetch('/api/whatsapp/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: agentId,
  }),
});

const { qr } = await response.json();
// Display QR code for scanning
```

### Check Connection Status:
```javascript
const response = await fetch(`/api/whatsapp/status?agentId=${agentId}`);
const { isConnected, phoneNumber } = await response.json();
```

## 🎯 Multi-Agent Workflow

1. **Create Agent** (from template or custom)
2. **Add Knowledge** (upload files, scrape website, add text)
3. **Connect WhatsApp** (scan QR code)
4. **AI Handles Conversations** (using agent's knowledge)
5. **Monitor & Manage** (dashboard shows all agents)

## ⚠️ Important Notes

### Database
- **MySQL 5.7+** or **MySQL 8.0+** required
- Make sure your MySQL server supports `utf8mb4` charset
- LongText fields need InnoDB engine

### File Uploads
- Maximum file size: 10MB
- Supported formats: PDF, DOCX, TXT
- Files are processed server-side (no storage)
- Text extracted and saved to database

### Website Scraping
- Respects 30-second timeout
- Extracts main content only
- Removes scripts, styles, navigation
- Maximum content: 50,000 characters

### WhatsApp
- Each agent = separate WhatsApp number
- QR code expires in 20 seconds (generates new one)
- Sessions stored in `whatsapp_sessions/[agentId]`
- Auto-reconnects on disconnect

## 🚀 Next Steps

1. **Set up MySQL database**
2. **Run migrations** (`npx prisma db push`)
3. **Test agent creation**
4. **Upload knowledge base** (PDF/website)
5. **Connect WhatsApp**
6. **Start receiving messages!**

## 📚 Additional Resources

- [Prisma MySQL Docs](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [Baileys Documentation](https://whiskeysockets.github.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

---

All features are production-ready and fully functional!

# 🤖 Agent System Guide - Understanding Agent IDs

## What is an Agent?

An **Agent** is your AI sales assistant. Think of it like hiring different employees for different roles:

- **Sales Agent** → Handles sales inquiries
- **Support Agent** → Handles customer support
- **Real Estate Agent** → Handles property inquiries
- And so on...

Each agent has:
- ✅ Its own **name** and personality
- ✅ Its own **knowledge base** (business info, products, policies)
- ✅ Its own **WhatsApp number** connection
- ✅ Its own **conversation history**
- ✅ Its own **AI tone** (professional, friendly, direct, warm)

## What is an Agent ID?

An **Agent ID** is a unique identifier for each agent, like an employee ID number.

Example:
```
Agent Name: "My Sales Agent"
Agent ID: "clx123abc456def"  ← This is the unique identifier
WhatsApp: +1-234-567-8900
```

## How the Multi-Agent System Works

### 1. **Creating Agents**

**Option A: Via Onboarding** (First Time Users)
- When you complete onboarding, it automatically creates "My First Agent"
- This agent gets your business info from the onboarding form
- It's ready to connect to WhatsApp immediately

**Option B: Via Dashboard** (Manual Creation)
```
Dashboard → Agents → Create New Agent
```

You can create:
- **From Template**: Choose from 9 pre-built templates
  - E-commerce Sales Agent 🛍️
  - Real Estate Agent 🏠
  - Education & Course Sales 🎓
  - Agency & Freelancer 💼
  - Restaurant & Food Service 🍽️
  - Healthcare & Wellness 🏥
  - Automotive Sales 🚗
  - SaaS & Technology 💻
  - General Customer Support 💬

- **Custom Agent**: Build from scratch

### 2. **Connecting WhatsApp to an Agent**

Each agent can connect to **one WhatsApp number**. Here's how:

**Method 1: During Onboarding**
```
Step 1-3: Fill business info
Step 4: Scan QR code
→ WhatsApp automatically connects to "My First Agent"
```

**Method 2: From Agent Dashboard**
```
Dashboard → Agents → [Select Agent] → WhatsApp Tab → Connect
→ Scan QR code with your phone
```

**Method 3: From WhatsApp Page** (Legacy)
```
Dashboard → WhatsApp → Connect WhatsApp
→ Uses your first agent automatically
```

### 3. **How Agent IDs are Used**

When you connect WhatsApp or manage agents, the system needs to know **which agent** you're working with.

Example API calls:
```javascript
// Connect WhatsApp to a specific agent
POST /api/whatsapp/connect
Body: { "agentId": "clx123abc456def" }

// Check status of a specific agent's WhatsApp
GET /api/whatsapp/status?agentId=clx123abc456def

// Add knowledge to a specific agent
POST /api/knowledge
Body: {
  "content": "Product information...",
  "agentId": "clx123abc456def"
}
```

## Common Workflows

### Workflow 1: First-Time Setup
```
1. Complete onboarding (creates "My First Agent")
2. Scan QR code at Step 4
3. Agent connects to WhatsApp
4. Start receiving messages
5. AI auto-replies based on your knowledge base
```

### Workflow 2: Adding More Agents
```
1. Dashboard → Agents → Create New Agent
2. Choose template or create custom
3. Add knowledge base (upload PDF, scrape website, or type manually)
4. Connect a different WhatsApp number
5. Each agent handles different customers
```

### Workflow 3: Managing Multiple WhatsApp Numbers
```
Agent 1: Sales WhatsApp (+1-234-567-8900)
  └── Handles product inquiries
  └── Professional tone
  └── E-commerce knowledge base

Agent 2: Support WhatsApp (+1-234-567-8901)
  └── Handles technical support
  └── Warm tone
  └── Support documentation

Agent 3: Real Estate WhatsApp (+1-234-567-8902)
  └── Handles property inquiries
  └── Direct tone
  └── Property listings knowledge
```

## Troubleshooting

### Error: "Agent ID is required"
**Problem**: You're trying to connect WhatsApp without specifying which agent.

**Solution**:
1. Go to **Dashboard → Agents**
2. Create an agent if you don't have one
3. Click on the agent you want to connect
4. Go to **WhatsApp tab** and click "Connect WhatsApp"

### Error: "No agents exist"
**Problem**: You haven't created any agents yet.

**Solution**:
1. Go to **Dashboard → Agents → Create New Agent**
2. OR complete the onboarding flow

### WhatsApp QR Code Not Showing
**Problem**: The QR code isn't generating.

**Checklist**:
- ✅ Do you have an agent created?
- ✅ Is your database set up (MySQL)?
- ✅ Are all dependencies installed (`npm install`)?
- ✅ Is your dev server running (`npm run dev`)?

**Check Console Logs**:
```bash
# Look for errors like:
WhatsApp connect error: ...
```

### Multiple QR Codes / Connection Issues
**Problem**: You see multiple QR codes or connections fail.

**Solution**:
- Each agent can only connect to ONE WhatsApp number
- Each WhatsApp number can only connect to ONE agent
- If you want to switch, disconnect the old agent first

## Database Structure

Here's how agents are stored:

```sql
-- Agent Table
Agent:
  - id (Agent ID)
  - userId (Owner)
  - name
  - description
  - businessType
  - aiTone
  - isActive

-- WhatsApp Connection (One-to-One with Agent)
WhatsAppConnection:
  - id
  - agentId  ← Links to Agent
  - phoneNumber
  - isConnected

-- Knowledge Base (Many-to-Many with Agent)
AgentKnowledge:
  - agentId  ← Links to Agent
  - knowledgeId  ← Links to Knowledge

KnowledgeBase:
  - id
  - content
  - sourceType (manual, pdf, word, website)
```

## Quick Reference

### Where to Find Agent ID

**Via UI**:
- Dashboard → Agents → Click agent → URL shows ID
- Example: `/dashboard/agents/clx123abc456def`

**Via Database**:
```sql
SELECT id, name FROM Agent WHERE userId = 'your-user-id';
```

**Via API**:
```javascript
const response = await fetch('/api/agents');
const data = await response.json();
console.log(data.agents[0].id);  // First agent's ID
```

### API Endpoints

| Endpoint | Method | Purpose | Requires Agent ID? |
|----------|--------|---------|-------------------|
| `/api/agents` | GET | List all agents | No |
| `/api/agents` | POST | Create agent | No (returns ID) |
| `/api/agents/[id]` | GET | Get agent details | Yes (in URL) |
| `/api/agents/[id]` | PATCH | Update agent | Yes (in URL) |
| `/api/agents/[id]` | DELETE | Delete agent | Yes (in URL) |
| `/api/whatsapp/connect` | POST | Connect WhatsApp | Yes (in body) |
| `/api/whatsapp/status` | GET | Check status | Yes (query param) |
| `/api/knowledge` | POST | Add knowledge | Optional |
| `/api/knowledge/upload` | POST | Upload file | Optional |
| `/api/knowledge/scrape` | POST | Scrape website | Optional |

## Best Practices

1. **Start with One Agent**: Get comfortable with one agent before creating multiple
2. **Use Templates**: They come pre-configured with knowledge for specific industries
3. **Test Before Going Live**: Send test messages to yourself first
4. **Name Agents Clearly**: Use descriptive names like "Sales Agent - Main Store"
5. **Keep Knowledge Updated**: Regularly update product info, pricing, etc.
6. **Monitor Conversations**: Check the dashboard to see how AI is performing
7. **Use Different Tones**: Match the AI tone to your customer expectations

## Example: Complete Setup

```bash
# 1. Start development server
npm run dev

# 2. Open browser
http://localhost:3000

# 3. Sign up / Login
→ Creates user account

# 4. Complete onboarding OR create agent manually
→ Creates "My First Agent" with ID: clx123abc456def

# 5. Connect WhatsApp (happens automatically in onboarding Step 4)
→ Scan QR code
→ WhatsApp connects to Agent ID: clx123abc456def

# 6. Add knowledge
Dashboard → Knowledge Base → Upload PDF / Scrape Website

# 7. Test
→ Send message to your WhatsApp
→ AI responds automatically
→ View in Dashboard → Conversations
```

## Need Help?

- **Check Logs**: Look at terminal where `npm run dev` is running
- **Check Browser Console**: Open DevTools → Console tab
- **Check Database**: Make sure MySQL is running and tables exist
- **Read Error Messages**: They usually tell you exactly what's wrong

## Summary

✅ **Agent** = Your AI employee
✅ **Agent ID** = Employee ID number (unique identifier)
✅ **One Agent** = One WhatsApp Connection
✅ **Multiple Agents** = Multiple WhatsApp Numbers
✅ **Knowledge Base** = What the agent knows about your business

You can manage everything from **Dashboard → Agents**!

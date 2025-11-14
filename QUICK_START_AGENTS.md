# Quick Start: Creating and Using Agents

## ⚡ 60-Second Setup

### Option 1: Via Browser UI (Easiest)

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Create agent:**
   - Go to: `http://localhost:3000/dashboard/agents/new`
   - Click a template (e.g., "E-commerce Sales Agent 🛍️")
   - Enter agent name: "My Sales Agent"
   - Add knowledge: "We sell bags. Prices $50-200."
   - Click "Create Agent from Template"

3. **Done!** Agent created with unique ID

### Option 2: Via API

```javascript
// In browser console (F12)
fetch('/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Sales Agent",
    businessType: "ecommerce",
    aiTone: "friendly",
    knowledgeContent: "We sell bags. Prices $50-200."
  })
})
.then(res => res.json())
.then(data => console.log('Agent ID:', data.agent.id));
```

## 📋 Get Your Agents

### Method 1: Via UI
```
http://localhost:3000/dashboard/agents
```

### Method 2: Via API
```javascript
fetch('/api/agents')
  .then(res => res.json())
  .then(data => {
    data.agents.forEach(agent => {
      console.log(`${agent.name} - ID: ${agent.id}`);
    });
  });
```

## 🔗 Connect WhatsApp to Agent

### Via UI:
```
1. Go to: /dashboard/agents/[your-agent-id]
2. Click "WhatsApp" tab
3. Click "Connect WhatsApp"
4. Scan QR code
```

### Via API:
```javascript
const agentId = "your-agent-id-here";

fetch('/api/whatsapp/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentId })
})
.then(res => res.json())
.then(data => {
  if (data.qr) {
    console.log('QR Code generated! Display it to scan.');
  }
});
```

## 🤖 How OpenAI Works

### Where OpenAI is Used

File: `lib/whatsapp-service-fixed.ts`

Line 293-331:
```typescript
const OpenAI = (await import('openai')).default;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ← Your key from .env.local
});

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // Fast & cheap model
  messages: [
    {
      role: 'system',
      content: `You are a ${aiTone} assistant.

Business Information:
${businessKnowledge} // ← Agent's knowledge base injected here

Instructions:
- Reply in under 100 words
- Be helpful and convert leads`
    },
    ...chatHistory // Previous conversation
  ],
  max_tokens: 200,
});
```

### What Gets Sent to OpenAI

For an agent with:
- **Name:** "Sales Agent"
- **Tone:** "friendly"
- **Knowledge:** "We sell bags. Prices $50-200."

OpenAI receives:
```
System: "You are a friendly assistant.

Business Information:
We sell bags. Prices $50-200.

Instructions:
- Reply in under 100 words
- Be helpful and convert leads"

User: "How much are your bags?"
```

OpenAI responds:
```
"Hi! 👋 Our handmade bags range from $50 to $200 depending on the size and style. We have something for every budget! Would you like to know more about any specific type?"
```

## 🔑 OpenAI API Key

### Current Setup

Your key is in `.env.local`:
```bash
OPENAI_API_KEY="sk-proj-vVX2tjIBQPKjR_7AXY..."
```

✅ **It's working!** No need to change.

### To Update:

1. Get new key from: https://platform.openai.com/api-keys
2. Update `.env.local`:
   ```bash
   OPENAI_API_KEY="sk-proj-your-new-key"
   ```
3. Restart server:
   ```bash
   npm run dev
   ```

### Cost Per Message

- Model: gpt-4o-mini
- Cost: ~$0.0002 per response
- Example: 1000 messages = $0.20 (20 cents!)

## 📍 File Locations

| Feature | File |
|---------|------|
| Agent Creation UI | `app/dashboard/agents/new/page.tsx` |
| Agent List UI | `app/dashboard/agents/page.tsx` |
| Agent API | `app/api/agents/route.ts` |
| OpenAI Integration | `lib/whatsapp-service-fixed.ts:293-331` |
| WhatsApp Connection | `app/api/whatsapp/connect/route.ts` |
| Agent Templates | `lib/agent-templates.ts` |

## 🧪 Testing

### 1. Create Test Agent
```bash
# In browser console
fetch('/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Test Agent",
    businessType: "ecommerce",
    aiTone: "friendly"
  })
}).then(r => r.json()).then(d => console.log(d));
```

### 2. Verify Creation
```bash
fetch('/api/agents')
  .then(r => r.json())
  .then(d => console.log('Agents:', d.agents));
```

### 3. Connect WhatsApp
```bash
# Replace with your agent ID
const agentId = "clx123abc...";

fetch('/api/whatsapp/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentId })
})
.then(r => r.json())
.then(d => console.log('QR:', d.qr ? 'Generated' : 'Error'));
```

## 🎓 Learning Resources

- **Full API Examples:** `AGENT_API_EXAMPLES.js`
- **Agent System Guide:** `AGENT_SYSTEM_GUIDE.md`
- **MySQL Setup:** `MYSQL_AND_FEATURES_GUIDE.md`

## ❓ Common Questions

**Q: How do I get my agent ID?**
```javascript
// Option 1: From API
fetch('/api/agents').then(r => r.json()).then(d => {
  console.log('First agent:', d.agents[0].id);
});

// Option 2: From URL
// Go to /dashboard/agents/[id] → ID is in the URL
```

**Q: Can one agent connect to multiple WhatsApp numbers?**
- No. One agent = One WhatsApp number

**Q: Can I have multiple agents?**
- Yes! Unlimited agents per user

**Q: How much does OpenAI cost?**
- ~$0.0002 per message
- Very affordable for most businesses

**Q: What if OpenAI API key is invalid?**
- Check `.env.local` has correct key
- Restart server after changing
- Check OpenAI dashboard for key status

## ✅ Checklist

- [ ] MySQL database running
- [ ] `npm install` completed
- [ ] `.env.local` has OPENAI_API_KEY
- [ ] `npm run dev` running
- [ ] Agent created (via UI or API)
- [ ] Knowledge added to agent
- [ ] WhatsApp connected to agent
- [ ] Test message sent and received
- [ ] AI response generated

## 🚀 You're Ready!

Your agents are now ready to:
- ✅ Receive WhatsApp messages
- ✅ Use OpenAI to generate intelligent responses
- ✅ Access their knowledge base for accurate answers
- ✅ Handle conversations automatically

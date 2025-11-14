/**
 * COMPLETE EXAMPLE: Create Agent and Test OpenAI Integration
 *
 * This file shows you how to:
 * 1. Create an agent via API
 * 2. Add knowledge to the agent
 * 3. Connect WhatsApp to the agent
 * 4. Test OpenAI response generation
 */

// ============================================
// 1. CREATE AN AGENT
// ============================================

async function createAgent() {
  const response = await fetch('http://localhost:3000/api/agents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Note: You need to be logged in (cookies will be sent automatically)
    },
    body: JSON.stringify({
      name: "E-commerce Sales Agent",
      description: "Handles product inquiries and sales",
      businessType: "ecommerce",
      aiTone: "friendly",
      knowledgeContent: `
        Our Business:
        - We sell handmade leather bags
        - 3 sizes: Small ($50), Medium ($100), Large ($200)
        - Colors: Black, Brown, Tan
        - Free shipping on orders over $100
        - 30-day money-back guarantee
        - Ships worldwide in 3-5 business days

        Common Questions:
        Q: What's your return policy?
        A: 30 days, no questions asked

        Q: Do you ship internationally?
        A: Yes, worldwide shipping available
      `
    })
  });

  const data = await response.json();
  console.log('✅ Agent Created!');
  console.log('Agent ID:', data.agent.id);
  console.log('Agent Name:', data.agent.name);

  return data.agent;
}

// ============================================
// 2. GET ALL AGENTS
// ============================================

async function getAllAgents() {
  const response = await fetch('http://localhost:3000/api/agents');
  const data = await response.json();

  console.log('📋 All Your Agents:');
  data.agents.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent.name} (ID: ${agent.id})`);
    console.log(`   - Tone: ${agent.aiTone}`);
    console.log(`   - Active: ${agent.isActive}`);
    console.log(`   - Knowledge Items: ${agent.agentKnowledge?.length || 0}`);
  });

  return data.agents;
}

// ============================================
// 3. GET SPECIFIC AGENT
// ============================================

async function getAgentById(agentId) {
  const response = await fetch(`http://localhost:3000/api/agents/${agentId}`);
  const data = await response.json();

  console.log('🔍 Agent Details:');
  console.log('Name:', data.agent.name);
  console.log('Description:', data.agent.description);
  console.log('Business Type:', data.agent.businessType);
  console.log('AI Tone:', data.agent.aiTone);
  console.log('WhatsApp Connected:', data.agent.whatsappConnection?.isConnected || false);
  console.log('Knowledge Items:', data.agent.agentKnowledge?.length || 0);

  return data.agent;
}

// ============================================
// 4. ADD KNOWLEDGE TO AGENT
// ============================================

async function addKnowledgeToAgent(agentId) {
  const response = await fetch('http://localhost:3000/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `
        New Product Launch:
        - Introducing premium leather backpacks
        - Available in 2 sizes: Regular ($150), Large ($250)
        - Limited edition colors: Navy Blue, Forest Green
        - Pre-order now with 10% discount
      `,
      sourceType: 'manual',
      agentId: agentId
    })
  });

  const data = await response.json();
  console.log('✅ Knowledge Added!');
  return data;
}

// ============================================
// 5. CONNECT WHATSAPP TO AGENT
// ============================================

async function connectWhatsAppToAgent(agentId) {
  const response = await fetch('http://localhost:3000/api/whatsapp/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId })
  });

  const data = await response.json();

  if (data.qr) {
    console.log('📱 QR Code Generated!');
    console.log('Scan this QR code with WhatsApp on your phone');
    console.log('QR Data URL:', data.qr.substring(0, 50) + '...');
  }

  return data;
}

// ============================================
// 6. CHECK WHATSAPP CONNECTION STATUS
// ============================================

async function checkWhatsAppStatus(agentId) {
  const response = await fetch(`http://localhost:3000/api/whatsapp/status?agentId=${agentId}`);
  const data = await response.json();

  console.log('📊 WhatsApp Status:');
  console.log('Connected:', data.isConnected);
  console.log('Phone Number:', data.phoneNumber || 'Not connected');
  console.log('Last Active:', data.lastActive || 'N/A');

  return data;
}

// ============================================
// 7. UPLOAD FILE TO KNOWLEDGE BASE
// ============================================

async function uploadFileToKnowledgeBase(agentId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agentId', agentId);

  const response = await fetch('http://localhost:3000/api/knowledge/upload', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  console.log('✅ File Uploaded!');
  return data;
}

// ============================================
// 8. SCRAPE WEBSITE FOR KNOWLEDGE
// ============================================

async function scrapeWebsiteForKnowledge(agentId, websiteUrl) {
  const response = await fetch('http://localhost:3000/api/knowledge/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: websiteUrl,
      agentId: agentId
    })
  });

  const data = await response.json();
  console.log('✅ Website Scraped!');
  return data;
}

// ============================================
// EXAMPLE USAGE WORKFLOW
// ============================================

async function completeWorkflow() {
  console.log('🚀 Starting Complete Agent Creation Workflow...\n');

  // Step 1: Create agent
  console.log('Step 1: Creating agent...');
  const agent = await createAgent();
  const agentId = agent.id;
  console.log('');

  // Step 2: View all agents
  console.log('Step 2: Getting all agents...');
  await getAllAgents();
  console.log('');

  // Step 3: Get specific agent details
  console.log('Step 3: Getting agent details...');
  await getAgentById(agentId);
  console.log('');

  // Step 4: Add more knowledge
  console.log('Step 4: Adding additional knowledge...');
  await addKnowledgeToAgent(agentId);
  console.log('');

  // Step 5: Connect WhatsApp
  console.log('Step 5: Connecting WhatsApp...');
  await connectWhatsAppToAgent(agentId);
  console.log('');

  // Step 6: Check connection status
  console.log('Step 6: Checking WhatsApp status...');
  await checkWhatsAppStatus(agentId);
  console.log('');

  console.log('✅ Workflow Complete!');
  console.log(`Your agent "${agent.name}" is ready to receive messages!`);
}

// ============================================
// HOW OPENAI IS USED (Behind the Scenes)
// ============================================

/*
When a customer sends a WhatsApp message, this happens:

1. WhatsApp message arrives → Baileys detects it
2. Message is saved to database
3. System retrieves the agent by agentId
4. System loads agent's knowledge base
5. System builds OpenAI prompt:

   const prompt = {
     role: 'system',
     content: `You are a ${agent.aiTone} assistant.

     Business Information:
     ${agent.knowledge.map(k => k.content).join('\n\n')}

     Instructions:
     - Reply in under 100 words
     - Be helpful and convert leads
     - Match customer's language`
   };

6. OpenAI generates response using gpt-4o-mini
7. Response is sent back via WhatsApp
8. Message is saved to database

Configuration:
- Model: gpt-4o-mini (fast & cheap)
- Max tokens: 200 (keeps responses concise)
- Temperature: default (balanced creativity)
- API Key: From environment variable OPENAI_API_KEY
*/

// ============================================
// OPENAI API KEY SETUP
// ============================================

/*
1. Get your OpenAI API key:
   - Go to: https://platform.openai.com/api-keys
   - Create new secret key
   - Copy the key (starts with "sk-proj-...")

2. Add to environment:
   # .env.local
   OPENAI_API_KEY="sk-proj-your-actual-key-here"

3. Restart your dev server:
   npm run dev

4. The key is automatically used by agents!

5. Monitor usage:
   - Go to: https://platform.openai.com/usage
   - View API calls, costs, and limits

6. Cost per message (estimated):
   - gpt-4o-mini: ~$0.0002 per response
   - Very affordable for most use cases!
*/

// ============================================
// TESTING IN BROWSER CONSOLE
// ============================================

/*
You can test these functions directly in your browser:

1. Open http://localhost:3000/dashboard
2. Press F12 to open Developer Console
3. Copy-paste any function from above
4. Run it:

   // Example:
   getAllAgents().then(agents => {
     console.log('Found agents:', agents);
   });

5. Or run the complete workflow:
   completeWorkflow();
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createAgent,
    getAllAgents,
    getAgentById,
    addKnowledgeToAgent,
    connectWhatsAppToAgent,
    checkWhatsAppStatus,
    uploadFileToKnowledgeBase,
    scrapeWebsiteForKnowledge,
    completeWorkflow
  };
}

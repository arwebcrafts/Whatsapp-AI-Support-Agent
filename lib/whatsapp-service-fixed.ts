import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';

// Simple logger for Baileys
const logger = {
  level: 'silent' as const,
  fatal: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  trace: () => {},
  child: () => logger,
};

interface WhatsAppSession {
  sock: any;
  qr: string | null;
  isConnected: boolean;
  agentId: string;
  userId: string;
  isReconnecting?: boolean; // Flag to prevent duplicate reconnections
  conflictRetries?: number; // Track conflict retry attempts
}

class WhatsAppServiceFixed {
  private sessions: Map<string, WhatsAppSession> = new Map(); // key: agentId
  private authDir = path.join(process.cwd(), 'whatsapp_sessions');
  private initialized = false;

  constructor() {
    // Create auth directory if it doesn't exist
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    // Auto-restore sessions on server start (run async in background)
    this.initializeConnections().catch(err =>
      console.error('Error initializing WhatsApp connections:', err)
    );
  }

  async initializeConnections() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      console.log('🔄 Checking for existing WhatsApp connections to restore...');

      // Find all connections marked as connected in database
      const activeConnections = await prisma.whatsAppConnection.findMany({
        where: { isConnected: true },
        include: { agent: true },
      });

      if (activeConnections.length === 0) {
        console.log('ℹ️ No active connections to restore');
        return;
      }

      console.log(`📱 Found ${activeConnections.length} connection(s) to restore`);

      // Restore each connection
      for (const connection of activeConnections) {
        if (!connection.agentId || !connection.userId) continue;

        const agentAuthDir = path.join(this.authDir, connection.agentId);

        // Check if session files exist
        if (fs.existsSync(agentAuthDir) && fs.existsSync(path.join(agentAuthDir, 'creds.json'))) {
          console.log(`🔄 Restoring connection for agent ${connection.agent?.name || connection.agentId}...`);

          // Reconnect in background
          setTimeout(() => {
            this.connectWhatsApp(connection.userId, connection.agentId!)
              .catch(err => console.error(`Failed to restore connection for agent ${connection.agentId}:`, err));
          }, 1000); // Stagger connections by 1 second each
        } else {
          console.log(`⚠️ No session files found for agent ${connection.agentId}, marking as disconnected`);
          // Mark as disconnected since we can't restore it
          await prisma.whatsAppConnection.update({
            where: { id: connection.id },
            data: { isConnected: false },
          });
        }
      }
    } catch (error) {
      console.error('Error initializing connections:', error);
    }
  }

  async connectWhatsApp(userId: string, agentId: string): Promise<{ qr: string | null; status: string }> {
    try {
      console.log(`🔄 Connecting WhatsApp for agent ${agentId}...`);
      console.log(`📊 Active sessions: ${this.sessions.size}, Connected: ${Array.from(this.sessions.values()).filter(s => s.isConnected).length}`);

      // Check if there's already an active session or reconnection in progress
      const existingSession = this.sessions.get(agentId);
      if (existingSession) {
        // If already reconnecting, don't create another connection
        if (existingSession.isReconnecting) {
          console.log('⏳ Reconnection already in progress for agent, skipping...');
          return { qr: null, status: 'reconnecting' };
        }

        // If connected, return existing session info
        if (existingSession.isConnected) {
          console.log('✅ Agent already connected, returning existing session');
          return { qr: existingSession.qr, status: 'connected' };
        }

        console.log('⚠️ Found existing session for agent, disconnecting old session...');
        try {
          await existingSession.sock?.end();
        } catch (error) {
          console.error('Error closing existing socket:', error);
        }
        this.sessions.delete(agentId);
      }

      const agentAuthDir = path.join(this.authDir, agentId);

      if (!fs.existsSync(agentAuthDir)) {
        fs.mkdirSync(agentAuthDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(agentAuthDir);
      const { version } = await fetchLatestBaileysVersion();

      console.log('📡 Creating WebSocket connection...');

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true, // Also print to terminal for debugging
        browser: ['WhaSales AI', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: undefined,
      });

      let qrCode: string | null = null;

      // Create a promise that resolves when QR is generated or connection opens
      const qrPromise = new Promise<string | null>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏱️ QR generation timeout after 30 seconds');
          resolve(qrCode); // Return whatever we have
        }, 30000); // 30 second timeout

        // Handle QR code generation
        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          console.log('📱 Connection update:', {
            connection,
            hasQR: !!qr,
            agentId,
            isConnecting: update.connection === 'connecting',
            isOpen: update.connection === 'open',
            isClose: update.connection === 'close',
            lastDisconnectReason: lastDisconnect?.error?.message
          });

          if (qr) {
            try {
              // Generate QR code as data URL
              qrCode = await QRCode.toDataURL(qr);
              const session = this.sessions.get(agentId);
              if (session) {
                session.qr = qrCode;
              }
              console.log(`✅ QR Code generated successfully for agent ${agentId}`);
              console.log('📊 QR Code length:', qrCode?.length || 0);

              clearTimeout(timeout);
              resolve(qrCode); // Resolve with QR code
            } catch (error) {
              console.error('❌ Error generating QR code:', error);
            }
          }

          if (connection === 'connecting') {
            console.log('🔄 WhatsApp is connecting for agent:', agentId);
          }

          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('🔌 Connection closed:', {
              statusCode,
              shouldReconnect,
              reason: lastDisconnect?.error?.message,
            });

            // Check for conflict error (multiple sessions on same WhatsApp number)
            const isConflict =
              statusCode === 440 ||
              lastDisconnect?.error?.message?.includes('conflict') ||
              lastDisconnect?.error?.message?.includes('Stream Errored (conflict)');

            if (isConflict) {
              // Get current session to check retry count
              const session = this.sessions.get(agentId);
              const retryCount = (session?.conflictRetries || 0) + 1;

              console.log(`⚠️ Conflict detected for agent ${agentId} (attempt ${retryCount}/3)`);

              // Allow up to 3 retries for conflicts
              // This handles cases where QR scanning takes time or network issues
              if (retryCount < 3) {
                console.log(`🔄 Retrying connection after conflict...`);

                // Store retry count before deleting session
                const savedRetryCount = retryCount;

                // Delete session to allow fresh reconnection
                this.sessions.delete(agentId);

                // Wait a bit longer before retrying (exponential backoff)
                const backoffTime = retryCount * 3000; // 3s, 6s, 9s
                setTimeout(() => {
                  this.connectWhatsApp(userId, agentId).then(() => {
                    // Restore conflict retry count after reconnection
                    const newSession = this.sessions.get(agentId);
                    if (newSession) {
                      newSession.conflictRetries = savedRetryCount;
                    }
                  }).catch(console.error);
                }, backoffTime);

                clearTimeout(timeout);
                resolve(null);
                return;
              } else {
                // After 3 attempts, give up to avoid infinite loops
                console.log('❌ Max conflict retries reached. This WhatsApp number may already be connected elsewhere.');
                console.log('💡 Tip: Make sure you\'re not scanning the same QR code on multiple devices, or disconnect from other sessions first.');

                // Clean up
                this.sessions.delete(agentId);
                await this.updateConnectionStatus(agentId, false, null);
                clearTimeout(timeout);
                resolve(null);
                return;
              }
            }

            // Check for stream error
            const isStreamError =
              statusCode === 515 ||
              lastDisconnect?.error?.message?.includes('Stream Errored');

            // Stream error 515 is normal after QR scan pairing - it means "restart connection"
            // Only clear credentials if pairing never completed (no creds.json exists)
            if (isStreamError) {
              const credsPath = path.join(agentAuthDir, 'creds.json');
              const hasCredentials = fs.existsSync(credsPath);

              if (hasCredentials) {
                // Credentials exist - this is normal post-pairing restart
                console.log('⚠️ Stream error after pairing - reconnecting with saved credentials...');

                // Clear from memory but keep session files
                this.sessions.delete(agentId);

                // Reconnect with existing credentials (don't clear session files)
                setTimeout(() => {
                  this.connectWhatsApp(userId, agentId);
                }, 2000);
              } else {
                // No credentials - pairing never completed, clear everything
                console.log('⚠️ Stream error without credentials - clearing and retrying...');

                // Clear the session directory
                try {
                  if (fs.existsSync(agentAuthDir)) {
                    fs.rmSync(agentAuthDir, { recursive: true, force: true });
                    console.log('✅ Cleared old session files');
                  }
                } catch (error) {
                  console.error('❌ Error clearing session files:', error);
                }

                // Clear from memory
                this.sessions.delete(agentId);

                // Update database
                await this.updateConnectionStatus(agentId, false, null);

                // Retry connection
                setTimeout(() => {
                  this.connectWhatsApp(userId, agentId);
                }, 2000);
              }
            }
            // Check if it's a bad session / connection failure (expired credentials)
            else if (
              statusCode === DisconnectReason.badSession ||
              statusCode === DisconnectReason.timedOut ||
              lastDisconnect?.error?.message?.includes('Connection Failure') ||
              lastDisconnect?.error?.message?.includes('Connection Error')
            ) {
              console.log('🗑️ Detected expired/invalid credentials, clearing session...');

              // Clear the session directory to force fresh QR generation
              try {
                if (fs.existsSync(agentAuthDir)) {
                  fs.rmSync(agentAuthDir, { recursive: true, force: true });
                  console.log('✅ Cleared old session files');
                }
              } catch (error) {
                console.error('❌ Error clearing session files:', error);
              }

              // Clear from memory
              this.sessions.delete(agentId);

              // Update database
              await this.updateConnectionStatus(agentId, false, null);

              console.log('🔄 Retrying with fresh credentials...');

              // Retry connection after a short delay (will generate new QR)
              setTimeout(() => {
                this.connectWhatsApp(userId, agentId);
              }, 2000);
            } else if (shouldReconnect) {
              console.log('🔄 Connection lost, will reconnect...');

              // Clear session to allow fresh reconnection
              this.sessions.delete(agentId);

              // Other connection issues - retry without clearing session files
              setTimeout(() => {
                this.connectWhatsApp(userId, agentId);
              }, 3000);
            } else {
              // Logged out - update database
              await this.updateConnectionStatus(agentId, false, null);
              this.sessions.delete(agentId);
            }

            clearTimeout(timeout);
            resolve(null); // Connection closed without QR
          } else if (connection === 'open') {
            console.log('✅ WhatsApp connected successfully for agent:', agentId);

            // Get phone number
            const phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id || '';

            // Update database
            await this.updateConnectionStatus(agentId, true, phoneNumber);

            // Update session
            const session = this.sessions.get(agentId);
            if (session) {
              session.isConnected = true;
              session.qr = null; // Clear QR once connected
              session.isReconnecting = false; // Clear reconnecting flag
              session.conflictRetries = 0; // Reset conflict counter on successful connection
              session.sock = sock; // Update socket reference
            }

            clearTimeout(timeout);
            resolve(null); // Already connected, no QR needed
          }
        });
      }); // Close qrPromise

      // Handle credentials update
      sock.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log(`📨 Message event received: type=${type}, count=${messages.length}`);

        if (type === 'notify') {
          for (const msg of messages) {
            console.log(`📩 Processing message: fromMe=${msg.key.fromMe}, hasMessage=${!!msg.message}`);

            if (!msg.key.fromMe && msg.message) {
              console.log('✅ Valid incoming message, handling...');
              await this.handleIncomingMessage(userId, agentId, sock, msg).catch(console.error);
            }
          }
        }
      });

      // Store session
      this.sessions.set(agentId, {
        sock,
        qr: qrCode,
        isConnected: false,
        agentId,
        userId,
        isReconnecting: false,
        conflictRetries: 0,
      });

      // Create initial WhatsAppConnection record if it doesn't exist
      const existingConnection = await prisma.whatsAppConnection.findFirst({
        where: { agentId },
      });

      if (!existingConnection) {
        await prisma.whatsAppConnection.create({
          data: {
            userId,  // ← Required field
            agentId,
            isConnected: false,
            phoneNumber: null,
            lastActive: new Date(),
          },
        });
        console.log(`📝 Created initial WhatsAppConnection record for agent ${agentId}`);
      }

      // Wait for QR code to be generated
      console.log('⏳ Waiting for QR code generation...');
      qrCode = await qrPromise;

      // Update session with QR code
      const session = this.sessions.get(agentId);
      if (session) {
        session.qr = qrCode;
      }

      if (qrCode) {
        console.log('🎉 QR Code ready! Returning to client...');
      } else {
        console.log('⚠️ No QR code generated (might already be connected)');
      }

      return {
        qr: qrCode,
        status: qrCode ? 'waiting_for_scan' : 'connecting',
      };
    } catch (error) {
      console.error('WhatsApp connection error:', error);
      throw error;
    }
  }


  async handleIncomingMessage(userId: string, agentId: string, sock: any, msg: any): Promise<void> {
    try {
      const messageText = await this.extractMessageText(msg);
      const customerPhone = msg.key.remoteJid?.split('@')[0] || '';

      console.log(`📱 Extracted message - phone: ${customerPhone}, text: ${messageText}`);

      if (!messageText || !customerPhone) {
        console.log('⚠️ Missing message text or customer phone, skipping');
        return;
      }

      // CRITICAL: Prevent processing our own messages
      if (msg.key.fromMe) {
        console.log('⚠️ Skipping message from self (fromMe=true)');
        return;
      }

      console.log(`✅ Incoming message from ${customerPhone}: ${messageText}`);

      // Find WhatsApp connection
      const whatsappConnection = await prisma.whatsAppConnection.findFirst({
        where: { agentId, userId, isConnected: true },
      });

      if (!whatsappConnection) {
        console.log('No active WhatsApp connection found');
        return;
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          agentId,
          whatsappConnectionId: whatsappConnection.id,
          customerPhone,
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId,
            agentId,
            whatsappConnectionId: whatsappConnection.id,
            customerPhone,
            customerName: msg.pushName || customerPhone,
            leadScore: 'warm',
            aiEnabled: true,
          },
        });
      }

      // Check if we recently responded to avoid spam
      const recentMessages = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          senderType: 'ai',
          createdAt: {
            gte: new Date(Date.now() - 5000), // Last 5 seconds
          },
        },
      });

      if (recentMessages.length > 0) {
        console.log('⚠️ Recently responded, skipping to avoid spam');
        // Still save customer message but don't respond
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'customer',
            messageText,
            messageType: this.getMessageType(msg),
          },
        });
        return;
      }

      // Save customer message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'customer',
          messageText,
          messageType: this.getMessageType(msg),
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Check if AI should auto-reply
      const aiMode = conversation.aiMode || 'auto';
      const shouldAutoReply = conversation.aiEnabled && aiMode === 'auto';

      if (shouldAutoReply) {
        console.log('🤖 AI is enabled in AUTO mode, checking limits...');
        const { canUserSendMessage } = await import('./trial-checker');
        const canSend = await canUserSendMessage(userId);

        if (canSend.allowed) {
          console.log('✅ User can send messages, generating AI response...');
          await this.generateAIResponse(userId, agentId, conversation.id, sock, msg.key.remoteJid);
        } else {
          console.log(`❌ Cannot send AI reply: ${canSend.reason}`);
        }
      } else if (conversation.aiEnabled && aiMode === 'copilot') {
        console.log('✨ AI is in CO-PILOT mode - user will request suggestions manually');
      } else if (conversation.aiEnabled && aiMode === 'manual') {
        console.log('👤 AI is in MANUAL mode - user will reply manually');
      } else {
        console.log('ℹ️ AI is disabled for this conversation');
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  async generateAIResponse(
    userId: string,
    agentId: string,
    conversationId: string,
    sock: any,
    remoteJid: string
  ): Promise<void> {
    try {
      // Check limits
      const { canUserSendMessage } = await import('./trial-checker');
      const canSend = await canUserSendMessage(userId);

      if (!canSend.allowed) {
        console.log('Cannot generate AI response:', canSend.reason);
        return;
      }

      // Get conversation history
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          agent: {
            include: {
              agentKnowledge: {
                include: {
                  knowledge: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) return;

      // Get agent's knowledge base
      const businessKnowledge = conversation.agent?.agentKnowledge
        .map(ak => ak.knowledge.content)
        .join('\n\n') || '';

      // Get FAQs for the user
      const faqs = await prisma.fAQ.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          priority: 'desc',
        },
        take: 20,
      });

      const faqKnowledge = faqs.length > 0
        ? faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')
        : '';

      const aiTone = conversation.agent?.aiTone || 'friendly';
      const agentName = conversation.agent?.name || 'AI Assistant';
      const agentDescription = conversation.agent?.description || '';
      const businessType = conversation.agent?.businessType || '';
      const conversationGoal = conversation.conversationGoal || 'info';

      // Generate AI response
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatHistory = conversation.messages
        .reverse()
        .map(m => ({
          role: m.senderType === 'customer' ? 'user' as const : 'assistant' as const,
          content: m.messageText || '',
        }));

      // SPECIALIZED AGENT PROMPTS - Like Dealism's "Vibe Selling"
      const businessTypePrompts: any = {
        ecommerce: `🛍️ **E-COMMERCE SALES SPECIALIST**

YOUR MISSION: Convert browsers into buyers. Every message should move towards a sale.

SALES PSYCHOLOGY:
- Create urgency without being pushy
- Highlight benefits over features
- Use social proof ("bestseller", "popular choice")
- Handle objections smoothly
- Always suggest next steps

SALES TACTICS:
1. **Build Trust**: Answer questions thoroughly, be honest about products
2. **Create Desire**: Paint a picture of how the product improves their life
3. **Remove Friction**: Make buying easy, address concerns proactively
4. **Close Confidently**: Use soft closes like "Ready to place your order?" or "Shall I help you complete your purchase?"

RESPONSE STRATEGY:
- Product questions → Describe benefits + suggest related items
- Price concerns → Emphasize value + any promotions
- Hesitation → Offer free shipping, guarantees, or limited-time deals
- Ready to buy → Streamline checkout process`,

        realestate: `🏠 **REAL ESTATE ADVISOR**

YOUR MISSION: Match clients with their dream property and secure viewings/deals.

RELATIONSHIP-FIRST APPROACH:
- Listen carefully to understand their needs (budget, location, property type)
- Build trust through expertise and market knowledge
- Create emotional connections to properties
- Guide them through the buying/renting process

CONVERSATION FLOW:
1. **Discovery**: "What brings you to look for a new place?" → Learn their needs
2. **Qualify**: Understand budget, timeline, must-haves
3. **Present Options**: Describe properties vividly, highlight selling points
4. **Create Urgency**: "This area is in high demand", "Great value for the neighborhood"
5. **Book Viewing**: Make scheduling easy and convenient

GOAL: Every conversation should move towards booking a property viewing or signing a lease.`,

        restaurant: `🍕 **RESTAURANT & DELIVERY EXPERT**

YOUR MISSION: Make mouths water and convert hunger into orders.

HOSPITALITY MINDSET:
- Be warm, welcoming, and helpful
- Make ordering easy and enjoyable
- Upsell naturally (sides, drinks, desserts)
- Handle dietary restrictions professionally

ORDER CONVERSION TACTICS:
1. **Greet Warmly**: "Hi! Hungry for something delicious?"
2. **Recommend Specials**: "Our chef's special today is amazing!"
3. **Paint the Picture**: Describe dishes appetizingly
4. **Suggest Combos**: "Add garlic bread for just $3?"
5. **Close the Order**: "Shall I place that order for you? Delivery or pickup?"

ALWAYS: Mention delivery time, confirm order, thank them genuinely.`,

        fitness: `💪 **FITNESS & WELLNESS COACH**

YOUR MISSION: Motivate, inspire, and convert interest into memberships/sessions.

MOTIVATIONAL PSYCHOLOGY:
- Tap into their fitness goals and aspirations
- Create excitement about transformation
- Remove barriers ("too expensive", "too busy", "not fit enough")
- Build confidence and belief

CONVERSION PATH:
1. **Connect with Goals**: "What brings you to look into fitness today?"
2. **Understand Barriers**: "What's held you back before?"
3. **Paint Success**: "Imagine how you'll feel after your first month"
4. **Offer Trial**: "Try our FREE first week - zero commitment"
5. **Close**: "Let's book your first session - when works for you?"

TONE: Encouraging, supportive, energetic - like a personal cheerleader!`,

        education: `📚 **EDUCATION & TUTORING ADVISOR**

YOUR MISSION: Help students/parents find the perfect learning solution.

CONSULTATIVE SELLING:
- Understand their academic challenges and goals
- Show empathy for learning struggles
- Build confidence in your tutors/programs
- Emphasize results and success stories

CONVERSATION STRUCTURE:
1. **Assess Needs**: "Which subject are you looking to improve?"
2. **Understand Context**: Grade level, current struggles, goals
3. **Present Solution**: Match them with right tutor/program
4. **Build Confidence**: "Our tutors specialize in exactly this"
5. **Offer Trial**: "First session 50% off - see the difference yourself"
6. **Schedule**: Make booking immediate and easy

TONE: Patient, knowledgeable, encouraging - like a caring teacher.`,
      };

      const systemPrompts = {
        professional: `You are ${agentName}, a professional business assistant. ${agentDescription}

Your communication style:
- Be formal, clear, and concise
- Use professional language and proper grammar
- Provide detailed, well-structured information
- Focus on facts and solutions
- Maintain a respectful, business-appropriate tone`,

        friendly: `You are ${agentName}, a friendly and helpful assistant. ${agentDescription}

Your communication style:
- Be warm, approachable, and conversational
- Use a casual but respectful tone
- Show enthusiasm and positivity
- Make customers feel comfortable and valued
- Build rapport while staying professional`,

        direct: `You are ${agentName}, a direct sales-focused assistant. ${agentDescription}

Your communication style:
- Be quick, clear, and to-the-point
- Focus on converting interest into action
- Identify needs and provide solutions
- Use confident, persuasive language
- Drive towards clear next steps (purchases, bookings, sign-ups)`,

        warm: `You are ${agentName}, a warm and empathetic assistant. ${agentDescription}

Your communication style:
- Be caring, supportive, and understanding
- Show genuine interest in helping customers
- Use friendly, encouraging language
- Make customers feel heard and appreciated
- Build trust through empathy and patience`,
      };

      // Apply business-specific prompt if available
      const specializedPrompt = businessTypePrompts[businessType] || '';

      // Goal-specific instructions
      const goalInstructions: any = {
        booking: `🎯 **PRIMARY GOAL: Secure a booking/appointment**

Your focus: Every response should move closer to getting them to book.
- Ask about their preferred dates/times
- Remove scheduling friction ("I have Tuesday at 3pm available, does that work?")
- Confirm details clearly
- Send calendar confirmations
- Success = Date & time confirmed`,

        buying: `🎯 **PRIMARY GOAL: Close the sale**

Your focus: Convert interest into purchase.
- Identify which product/service they want
- Address concerns confidently
- Create urgency naturally
- Make checkout seamless
- Success = Order placed or payment confirmed`,

        'follow-up': `🎯 **PRIMARY GOAL: Re-engage and move forward**

Your focus: Bring them back into the conversation.
- Reference previous interaction
- Offer new value ("New arrivals!", "Special offer for you")
- Ask if they're ready to proceed
- Remove previous blockers
- Success = Customer re-engages actively`,

        support: `🎯 **PRIMARY GOAL: Resolve their issue**

Your focus: Fix problems, answer questions, provide solutions.
- Listen carefully to understand the problem
- Provide clear, step-by-step solutions
- Follow up to ensure resolution
- Be patient and empathetic
- Success = Problem solved, customer satisfied`,

        info: `🎯 **PRIMARY GOAL: Educate and qualify**

Your focus: Answer questions and identify serious leads.
- Provide thorough, helpful information
- Ask qualifying questions
- Gauge interest level
- Suggest next steps when appropriate
- Success = Customer has clarity, we know their intent`,
      };

      const knowledgeSection = businessKnowledge || faqKnowledge
        ? `

📚 YOUR KNOWLEDGE BASE:
${businessKnowledge ? `\n=== Business Information ===\n${businessKnowledge}\n` : ''}
${faqKnowledge ? `\n=== Frequently Asked Questions ===\n${faqKnowledge}\n` : ''}
`
        : '\nNote: No specific business information or FAQs have been added yet. Answer based on general knowledge and ask clarifying questions.';

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompts[aiTone as keyof typeof systemPrompts]}
${specializedPrompt ? `\n${specializedPrompt}\n` : ''}
${knowledgeSection}
${goalInstructions[conversationGoal] || ''}

🎯 **CONVERSATION MASTERY** (Like Dealism's "Vibe Selling"):
1. **Read the Vibe**: Understand customer's emotion and intent
2. **Match Their Energy**: Adapt to their communication style
3. **Build Trust**: Be genuine, helpful, and human
4. **Guide Naturally**: Nudge towards the goal without being pushy
5. **Close Confidently**: When ready, ask for the commitment

📱 MESSAGE HANDLING:
- You receive both text and voice messages (voice is transcribed to text)
- Respond naturally to all message types
- Match the customer's language and communication style
- If they write in Spanish, respond in Spanish, etc.

✅ RESPONSE GUIDELINES:
- Keep responses under 100 words (be concise and punchy)
- Use emojis naturally but sparingly (1-2 per message max)
- If you don't know something, be honest and offer to check
- When referencing your knowledge base, do so naturally
- For complex questions, break down your answer into clear points
- **Always end with a relevant question or call-to-action** - keep the conversation moving

🚫 AVOID:
- Making up information not in your knowledge base
- Being overly salesy or pushy (build trust first!)
- Using too many emojis or excessive punctuation (!!!)
- Generic responses - be specific and personal
- Giving legal, medical, or financial advice unless in your knowledge base
- Letting the conversation die - always give them something to respond to

💡 CONVERSATION FLOW (Like talking to a friend who's also an expert):
- **First message**: Warm greeting + understand their need
- **Discovery**: Ask smart questions to qualify
- **Value delivery**: Answer thoroughly, show expertise
- **Build desire**: Help them see the benefit
- **Handle objections**: Address concerns smoothly
- **Close**: When signals are positive, confidently suggest next step
- **Follow-up**: If they go silent, friendly nudge

🏆 **SUCCESS METRICS**:
- Engagement: Are they responding actively?
- Qualification: Do we know what they need?
- Progress: Are we moving towards the goal?
- Conversion: Did we achieve the conversation goal?

Remember: You're not just answering questions - you're building relationships and driving results. Be helpful, be human, be effective. Every conversation is an opportunity to make someone's day better AND achieve your goal.`,
          },
          ...chatHistory,
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiReply = response.choices[0].message.content || '';

      // Calculate realistic typing delay based on message length
      // Simulate human typing behavior:
      // - Short messages (< 50 chars): 10-15 seconds
      // - Medium messages (50-150 chars): 20-30 seconds
      // - Long messages (> 150 chars): 30-40 seconds
      const messageLength = aiReply.length;
      let typingDelay: number;

      if (messageLength < 50) {
        typingDelay = 10000 + Math.random() * 5000; // 10-15 seconds
      } else if (messageLength < 150) {
        typingDelay = 20000 + Math.random() * 10000; // 20-30 seconds
      } else {
        typingDelay = 30000 + Math.random() * 10000; // 30-40 seconds
      }

      console.log(`⌨️ Showing typing indicator for ${Math.round(typingDelay / 1000)} seconds...`);

      // Show "typing..." indicator
      try {
        await sock.sendPresenceUpdate('composing', remoteJid);
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }

      // Wait for realistic typing delay
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      // Stop typing indicator and set to "available"
      try {
        await sock.sendPresenceUpdate('paused', remoteJid);
      } catch (error) {
        console.error('Error clearing typing indicator:', error);
      }

      // Send message via WhatsApp
      await sock.sendMessage(remoteJid, { text: aiReply });

      // Save AI message
      await prisma.message.create({
        data: {
          conversationId,
          senderType: 'ai',
          messageText: aiReply,
          messageType: 'text',
          tokensUsed: response.usage?.total_tokens || 0,
        },
      });

      // Calculate engagement score (like Dealism's conversion tracking)
      await this.updateEngagementScore(conversationId);

      // Update message usage
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await prisma.messageUsage.findUnique({
        where: {
          userId_month: {
            userId,
            month: currentMonth,
          },
        },
      });

      if (usage) {
        await prisma.messageUsage.update({
          where: { id: usage.id },
          data: {
            messagesUsed: { increment: 1 },
          },
        });
      } else {
        await prisma.messageUsage.create({
          data: {
            userId,
            month: currentMonth,
            messagesUsed: 1,
            messageLimit: 2000,
          },
        });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  async extractMessageText(msg: any): Promise<string> {
    const message = msg.message;

    // Handle text messages
    if (message?.conversation) return message.conversation;
    if (message?.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message?.imageMessage?.caption) return message.imageMessage.caption;
    if (message?.videoMessage?.caption) return message.videoMessage.caption;

    // Handle voice/audio messages
    if (message?.audioMessage) {
      console.log('🎤 Voice message detected, transcribing...');
      try {
        return await this.transcribeVoiceMessage(msg);
      } catch (error) {
        console.error('❌ Error transcribing voice message:', error);
        return '[Voice message - transcription failed]';
      }
    }

    return '';
  }

  async transcribeVoiceMessage(msg: any): Promise<string> {
    try {
      // Download the audio buffer
      console.log('📥 Downloading voice message...');
      const buffer = await downloadMediaMessage(msg, 'buffer', {});

      if (!buffer) {
        throw new Error('Failed to download voice message');
      }

      console.log(`✅ Downloaded ${buffer.length} bytes`);

      // Save to temporary file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `voice_${Date.now()}.ogg`);
      fs.writeFileSync(tempFilePath, buffer);

      console.log('💾 Saved to temp file, transcribing with Whisper...');

      // Transcribe using OpenAI Whisper
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        // Auto-detect language (supports 50+ languages including English, Arabic, Urdu, etc.)
      });

      console.log(`✅ Transcription: "${transcription.text}"`);

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      return transcription.text || '[Voice message - no speech detected]';
    } catch (error) {
      console.error('Error in transcribeVoiceMessage:', error);
      throw error;
    }
  }

  getMessageType(msg: any): string {
    const message = msg.message;

    if (message?.conversation || message?.extendedTextMessage) return 'text';
    if (message?.imageMessage) return 'image';
    if (message?.videoMessage) return 'video';
    if (message?.audioMessage) return 'voice';
    if (message?.documentMessage) return 'document';

    return 'text';
  }

  async updateEngagementScore(conversationId: string): Promise<void> {
    try {
      // Get conversation with messages
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!conversation) return;

      // Calculate engagement score (0-100) based on:
      // 1. Message count (more messages = higher engagement)
      // 2. Customer response rate
      // 3. Conversation length
      // 4. Recency

      const messages = conversation.messages;
      const totalMessages = messages.length;

      // Base score from message count (0-40 points)
      let score = Math.min(40, totalMessages * 2);

      // Customer messages count (shows they're engaged)
      const customerMessages = messages.filter(m => m.senderType === 'customer').length;
      const responseRate = totalMessages > 0 ? (customerMessages / totalMessages) : 0;

      // Response rate score (0-30 points)
      score += responseRate * 30;

      // Conversation length in time (0-15 points)
      const conversationAge = Date.now() - new Date(conversation.createdAt).getTime();
      const daysOld = conversationAge / (1000 * 60 * 60 * 24);
      const lengthScore = Math.min(15, daysOld * 3);
      score += lengthScore;

      // Recent activity bonus (0-15 points)
      const lastMessageAge = Date.now() - new Date(conversation.lastMessageAt).getTime();
      const hoursOld = lastMessageAge / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 15 - hoursOld);
      score += recencyScore;

      // Cap at 100
      const finalScore = Math.min(100, Math.round(score));

      // Update engagement score
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { engagementScore: finalScore },
      });

      console.log(`📊 Updated engagement score for conversation ${conversationId}: ${finalScore}%`);
    } catch (error) {
      console.error('Error updating engagement score:', error);
    }
  }

  async updateConnectionStatus(
    agentId: string,
    isConnected: boolean,
    phoneNumber: string | null
  ): Promise<void> {
    try {
      const existing = await prisma.whatsAppConnection.findFirst({
        where: { agentId },
      });

      if (existing) {
        // Update existing connection
        await prisma.whatsAppConnection.update({
          where: { id: existing.id },
          data: {
            isConnected,
            phoneNumber,
            lastActive: new Date(),
          },
        });
      } else {
        // Create new connection if it doesn't exist
        // First, get the userId from the agent
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          select: { userId: true },
        });

        if (!agent) {
          console.error(`Agent ${agentId} not found, cannot create connection`);
          return;
        }

        await prisma.whatsAppConnection.create({
          data: {
            userId: agent.userId,  // ← Required field
            agentId,
            isConnected,
            phoneNumber,
            lastActive: new Date(),
          },
        });
      }

      console.log(`✅ Connection status updated for agent ${agentId}: ${isConnected ? 'Connected' : 'Disconnected'}`);
    } catch (error) {
      console.error('Error updating connection status:', error);
    }
  }

  async disconnectWhatsApp(agentId: string): Promise<void> {
    const session = this.sessions.get(agentId);

    if (session?.sock) {
      try {
        await session.sock.logout();
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }

    this.sessions.delete(agentId);
    await this.updateConnectionStatus(agentId, false, null);

    // Remove auth files
    const agentAuthDir = path.join(this.authDir, agentId);
    if (fs.existsSync(agentAuthDir)) {
      fs.rmSync(agentAuthDir, { recursive: true, force: true });
    }
  }

  getSession(agentId: string): WhatsAppSession | undefined {
    return this.sessions.get(agentId);
  }

  async sendMessage(agentId: string, remoteJid: string, message: string): Promise<void> {
    const session = this.sessions.get(agentId);

    if (session?.sock && session.isConnected) {
      await session.sock.sendMessage(remoteJid, { text: message });
    } else {
      throw new Error('WhatsApp not connected');
    }
  }

  /**
   * Send message with quick reply buttons
   * Example: Yes/No questions, Book Now, See Menu, etc.
   */
  async sendMessageWithButtons(
    agentId: string,
    remoteJid: string,
    message: string,
    buttons: Array<{ id: string; text: string }>
  ): Promise<void> {
    const session = this.sessions.get(agentId);

    if (!session?.sock || !session.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    // WhatsApp supports up to 3 buttons
    if (buttons.length > 3) {
      console.warn('WhatsApp only supports up to 3 buttons, truncating...');
      buttons = buttons.slice(0, 3);
    }

    const buttonMessage = {
      text: message,
      footer: 'Powered by WhaSales AI',
      buttons: buttons.map((btn, index) => ({
        buttonId: btn.id,
        buttonText: { displayText: btn.text },
        type: 1,
      })),
      headerType: 1,
    };

    try {
      await session.sock.sendMessage(remoteJid, buttonMessage);
      console.log(`✅ Sent message with ${buttons.length} buttons`);
    } catch (error) {
      // Fallback to regular message if buttons not supported
      console.error('Error sending buttons, falling back to text:', error);
      await session.sock.sendMessage(remoteJid, { text: message });
    }
  }

  /**
   * Send message with list/menu
   * Example: Select from multiple options
   */
  async sendMessageWithList(
    agentId: string,
    remoteJid: string,
    message: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<void> {
    const session = this.sessions.get(agentId);

    if (!session?.sock || !session.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const listMessage = {
      text: message,
      footer: 'Powered by WhaSales AI',
      title: 'Please select an option',
      buttonText: buttonText,
      sections: sections,
    };

    try {
      await session.sock.sendMessage(remoteJid, listMessage);
      console.log(`✅ Sent list message with ${sections.length} sections`);
    } catch (error) {
      // Fallback to regular message if list not supported
      console.error('Error sending list, falling back to text:', error);
      await session.sock.sendMessage(remoteJid, { text: message });
    }
  }

  // Add method to check if agent has active session
  hasActiveSession(agentId: string): boolean {
    const session = this.sessions.get(agentId);
    return !!session && session.isConnected;
  }

  // Get all active sessions (for debugging)
  getActiveSessions(): string[] {
    const active: string[] = [];
    this.sessions.forEach((session, agentId) => {
      if (session.isConnected) {
        active.push(agentId);
      }
    });
    return active;
  }

  // Manually clear session (force fresh connection)
  async clearSession(agentId: string): Promise<void> {
    console.log(`🗑️ Manually clearing session for agent ${agentId}...`);

    // Close active socket if exists
    const session = this.sessions.get(agentId);
    if (session) {
      try {
        await session.sock?.end();
      } catch (error) {
        console.error('Error closing socket:', error);
      }
      this.sessions.delete(agentId);
    }

    // Delete session files from disk
    const agentAuthDir = path.join(this.authDir, agentId);
    try {
      if (fs.existsSync(agentAuthDir)) {
        fs.rmSync(agentAuthDir, { recursive: true, force: true });
        console.log('✅ Cleared session files from disk');
      }
    } catch (error) {
      console.error('❌ Error clearing session files:', error);
      throw error;
    }

    // Update database
    await this.updateConnectionStatus(agentId, false, null);

    console.log('✅ Session cleared successfully');
  }
}

// Singleton instance
export const whatsappServiceFixed = new WhatsAppServiceFixed();

// Export class for API routes that need to create their own instances
export { WhatsAppServiceFixed };

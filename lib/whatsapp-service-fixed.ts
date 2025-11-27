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
import { getPlanLimits } from './plan-limits';

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
  eventListeners?: Set<string>; // Track registered event listeners for cleanup
}

class WhatsAppServiceFixed {
  private sessions: Map<string, WhatsAppSession> = new Map(); // key: agentId
  private authDir = path.join(process.cwd(), 'whatsapp_sessions');
  private initialized = false;
  private messageDebounceTimers: Map<string, NodeJS.Timeout> = new Map(); // key: conversationId
  private pendingMessages: Map<string, number> = new Map(); // key: conversationId, value: message count

  constructor() {
    // Create auth directory if it doesn't exist
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    // Auto-restore sessions on server start (run async in background)
    this.initializeConnections().catch(err =>
      console.error('Error initializing WhatsApp connections:', err)
    );

    // Start follow-up message scheduler (checks every hour)
    // This enables automatic re-engagement messages
    if (typeof window === 'undefined') { // Only run on server
      this.initializeFollowUpSystem();
    }
  }

  private async initializeFollowUpSystem() {
    try {
      // Import dynamically to avoid circular dependencies
      const { followUpService } = await import('./follow-up-service');

      // Start the scheduler (checks every 60 minutes)
      followUpService.startFollowUpScheduler(60);

      console.log('✅ Follow-up messaging system initialized');
    } catch (error) {
      console.error('Error initializing follow-up system:', error);
    }
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
      console.log('⚡ Using connection manager to prevent overload...');

      // Use connection manager for staggered reconnection
      const { connectionManager } = await import('./connection-manager');

      // Restore each connection via queue
      for (const connection of activeConnections) {
        if (!connection.agentId || !connection.userId) continue;

        const agentAuthDir = path.join(this.authDir, connection.agentId);

        // Check if session files exist
        if (fs.existsSync(agentAuthDir) && fs.existsSync(path.join(agentAuthDir, 'creds.json'))) {
          console.log(`📋 Queuing connection for agent ${connection.agent?.name || connection.agentId}...`);

          // Add to connection manager queue (priority 0 = normal)
          connectionManager.enqueue(connection.userId, connection.agentId!, 0);
        } else {
          console.log(`⚠️ No session files found for agent ${connection.agentId}, marking as disconnected`);
          // Mark as disconnected since we can't restore it
          await prisma.whatsAppConnection.update({
            where: { id: connection.id },
            data: { isConnected: false },
          });
        }
      }

      console.log('✅ All connections queued for gradual reconnection');
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
              console.log(`🎨 Generating QR code from raw string (length: ${qr.length})...`);
              // Generate QR code as data URL
              qrCode = await QRCode.toDataURL(qr);
              const session = this.sessions.get(agentId);
              if (session) {
                session.qr = qrCode;
              }
              console.log(`✅ QR Code generated successfully for agent ${agentId}`);
              console.log('📊 QR Code data URL length:', qrCode?.length || 0);

              clearTimeout(timeout);
              resolve(qrCode); // Resolve with QR code
            } catch (error) {
              console.error('❌ Error generating QR code from string:', error);
              console.error('QR string that failed:', qr?.substring(0, 50) + '...');
              // Don't resolve here - let timeout handle it or wait for another QR
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
        console.log('📏 Final QR code length:', qrCode.length);
      } else {
        console.log('⚠️ No QR code generated after waiting');
        console.log('Possible reasons: already connected, timeout, or connection error');

        // Check if session exists and is connected
        const session = this.sessions.get(agentId);
        if (session?.isConnected) {
          console.log('✅ Session is already connected');
          return { qr: null, status: 'connected' };
        }
      }

      return {
        qr: qrCode,
        status: qrCode ? 'waiting_for_scan' : 'connecting',
      };
    } catch (error) {
      console.error('❌ WhatsApp connection error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
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
        console.log('🤖 AI is enabled in AUTO mode, using debounced response...');

        // Clear existing debounce timer for this conversation
        const existingTimer = this.messageDebounceTimers.get(conversation.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
          console.log('⏱️ Cleared previous timer, customer is still typing...');
        }

        // Increment pending message count
        const currentCount = this.pendingMessages.get(conversation.id) || 0;
        this.pendingMessages.set(conversation.id, currentCount + 1);
        console.log(`📊 Pending messages for this conversation: ${currentCount + 1}`);

        // Set new debounce timer - wait 3 seconds after last message
        const timer = setTimeout(async () => {
          const messageCount = this.pendingMessages.get(conversation.id) || 1;
          console.log(`⏰ Timer expired! Processing ${messageCount} message(s) together...`);

          // Clear the timer and counter
          this.messageDebounceTimers.delete(conversation.id);
          this.pendingMessages.delete(conversation.id);

          // Check if user can send messages
          const { canUserSendMessage } = await import('./trial-checker');
          const canSend = await canUserSendMessage(userId);

          if (canSend.allowed) {
            console.log(`✅ User can send messages, generating AI response for ${messageCount} message(s)...`);
            await this.generateAIResponse(userId, agentId, conversation.id, sock, msg.key.remoteJid);
          } else {
            console.log(`❌ Cannot send AI reply: ${canSend.reason}`);
          }
        }, 3000); // Wait 3 seconds after last message

        this.messageDebounceTimers.set(conversation.id, timer);
        console.log('⏱️ Debounce timer set (3 seconds)');

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

      // Generate AI response using singleton client
      const { getOpenAIClient, estimateTokens } = await import('./openai-client');
      const { TokenUsageService } = await import('./token-usage-service');
      const openai = getOpenAIClient();

      const chatHistory = conversation.messages
        .reverse()
        .map(m => ({
          role: m.senderType === 'customer' ? 'user' as const : 'assistant' as const,
          content: m.messageText || '',
        }));

      // PROFESSIONAL SALES AGENT PROMPTS - Conversion-Focused & Adaptive
      const businessTypePrompts: any = {
        ecommerce: `🛍️ **E-COMMERCE SALES EXPERT**

YOUR MISSION: Turn every conversation into a sale. You're not just answering questions - you're a trusted advisor helping customers make the right purchase decision.

SALES MASTERY PRINCIPLES:
1. **Build Instant Trust**: Be knowledgeable, honest, and genuinely helpful
2. **Understand Needs Deeply**: Ask smart questions to identify what they REALLY want
3. **Present Perfect Solutions**: Match products to their specific needs using knowledge base
4. **Create Emotional Connection**: Help them visualize owning and using the product
5. **Handle Objections Like a Pro**: Price concerns, doubts, comparisons - address everything smoothly
6. **Close with Confidence**: Natural, pressure-free closing that feels like helping

ADVANCED SALES TACTICS:
- **Social Proof**: "This is our #1 bestseller" / "Customers love this for..."
- **Scarcity**: "Only X left in stock" / "Limited time offer"
- **Value Stacking**: "You also get free shipping + warranty"
- **Risk Reversal**: "30-day money-back guarantee - zero risk"
- **Upselling**: "Customers who bought this also love..." (but be natural!)
- **Bundle Deals**: "Save $X when you buy together"

CONVERSATION STRATEGY:
→ Product inquiry? Describe benefits (not just features), ask about their use case, recommend the perfect match
→ Price question? Emphasize value, quality, long-term savings, payment plans if available
→ Hesitation? Address concerns directly, offer guarantees, share reviews/testimonials
→ Ready to buy? Make checkout EFFORTLESS - guide them step-by-step`,

        realestate: `🏠 **REAL ESTATE SALES PROFESSIONAL**

YOUR MISSION: You're not just showing properties - you're helping people find their dream home or perfect investment. Build trust, create desire, secure viewings, close deals.

RELATIONSHIP-DRIVEN SELLING:
1. **Deep Discovery**: Understand their WHY - why moving? what matters most? budget reality?
2. **Become Their Advocate**: You're on THEIR side, finding the best match
3. **Paint the Picture**: Help them imagine living there - "Picture your morning coffee on this balcony"
4. **Create Urgency**: "Market is competitive" / "This won't last long" (if true!)
5. **Overcome Objections**: Too expensive? Show value. Wrong location? Highlight benefits.
6. **Secure Commitment**: Book viewings, request documents, move them forward

POWER TACTICS:
- **Lifestyle Selling**: Don't sell property, sell the LIFE they'll have there
- **Investment Angle**: "Property values here increased 15% last year"
- **Neighborhood Intel**: Schools, amenities, community - know EVERYTHING
- **Comparison Strategy**: "Compared to similar properties, this is exceptional value"
- **FOMO Creation**: "I have 2 other viewings scheduled" (if true)

GOAL: Every chat should end with a viewing booked or next step confirmed.`,

        restaurant: `🍽️ **RESTAURANT SALES & SERVICE EXPERT**

YOUR MISSION: Turn hunger into orders, first-timers into regulars, small orders into bigger ones. You're the friendly face that makes ordering irresistible.

HOSPITALITY + SALES:
1. **Warm Welcome**: Make them feel special from word one
2. **Suggest Confidently**: Be the expert - "Our signature dish is..." / "I highly recommend..."
3. **Describe Deliciously**: Make their mouth water with vivid descriptions
4. **Upsell Naturally**: "Want to add crispy fries?" / "Our homemade dessert is incredible"
5. **Handle Special Requests**: Dietary restrictions? Allergies? You've got them covered
6. **Close the Order**: Make it easy - confirm everything, provide timing

MENU MASTERY:
- **Highlight Specials**: Create urgency - "Today only!" / "Chef's weekend creation"
- **Pairings**: "This goes perfectly with..." (drinks, sides, desserts)
- **Portion Guidance**: "Generous portions - great for sharing" or "Perfect for one"
- **Dietary Options**: Know vegan, gluten-free, keto options by heart
- **Deal Awareness**: "Combo saves you $X" / "Free delivery over $Y"

CONVERSION TACTICS:
→ Browsing menu? Recommend top sellers, ask about preferences (spicy? vegetarian?)
→ Single item? Suggest meal deals or combos (higher value)
→ Price checking? Emphasize quality, freshness, "Better than cooking!"
→ Ready? Confirm order, delivery time, payment - SMOOTH process`,

        fitness: `💪 **FITNESS SALES & MOTIVATION SPECIALIST**

YOUR MISSION: Transform interest into action. You're not just selling memberships - you're selling transformation, confidence, health, and the best version of themselves.

PSYCHOLOGY OF FITNESS SALES:
1. **Connect to Their "Why"**: Weight loss? Strength? Health? Confidence? Find their REAL motivation
2. **Create Vision**: Help them SEE themselves achieving their goal
3. **Remove Barriers**: "Too busy" → Show 30-min options / "Too expensive" → Break down to daily cost / "Not fit enough" → Everyone starts somewhere!
4. **Build Excitement**: "Imagine how you'll feel in 30 days..."
5. **Offer Low-Risk Entry**: Free trial, first week discount, no commitment
6. **Close on Emotion**: When they're excited, that's when you ask for commitment

CONVERSION STRATEGIES:
- **Transformation Stories**: "Members lose average 15lbs in first 2 months"
- **Community Appeal**: "You'll join an amazing supportive community"
- **Convenience**: "We're open 5am-11pm, fit any schedule"
- **Results Guarantee**: "See results in 30 days or money back"
- **Limited Offers**: "This week only: 50% off enrollment"

OBJECTION CRUSHING:
→ "Too expensive"? Daily cost breakdown + value of health
→ "No time"? Short effective workouts available
→ "Not ready"? Free trial - try before you buy
→ "Tried before, failed"? This time is different - here's why...

GOAL: Book first session or sign them up TODAY.`,

        education: `📚 **EDUCATION SALES CONSULTANT**

YOUR MISSION: Help students/parents invest in their future. You're selling success, knowledge, confidence, and better opportunities.

CONSULTATIVE SALES APPROACH:
1. **Understand the Challenge**: What subject? What's the struggle? What's the goal?
2. **Show Empathy**: "Many students struggle with this" - they're not alone
3. **Present the Solution**: Match them with perfect course/tutor using knowledge base
4. **Build Confidence**: Share success stories, qualifications, proven methods
5. **Address Concerns**: Cost, time commitment, effectiveness - handle everything
6. **Make Enrollment Easy**: Clear next steps, flexible scheduling, payment plans

POWERFUL POSITIONING:
- **Results Focus**: "Our students improve average 2 grade levels in 3 months"
- **Expertise Highlight**: "Our tutors are certified with 10+ years experience"
- **Personalization**: "Customized learning plan for your child's unique needs"
- **Flexibility**: "Online or in-person, evenings and weekends available"
- **Investment Framing**: "Education is the best investment in their future"

CONVERSION TACTICS:
→ Academic struggles? Show understanding + proven solution
→ Price concerns? Payment plans + scholarship opportunities + ROI
→ Skeptical? Free assessment or trial lesson
→ Ready? Book first session NOW while schedule is open

TONE: Caring but confident - you KNOW you can help them succeed.`,

        agency: `💼 **AGENCY BUSINESS DEVELOPMENT EXPERT**

YOUR MISSION: Win clients by demonstrating value, building trust, and showing you understand their business challenges better than anyone.

PROFESSIONAL SELLING:
1. **Qualify First**: Budget? Timeline? Decision maker? Don't waste time on tire-kickers
2. **Understand Their Business**: What are their goals? Challenges? Current situation?
3. **Position as Expert**: Share insights, ask smart questions, demonstrate industry knowledge
4. **Present Custom Solutions**: Reference portfolio/case studies from knowledge base
5. **Quantify Value**: "We helped X company achieve Y% growth in Z months"
6. **Handle Budget Objections**: ROI focus - "This pays for itself when..."
7. **Move to Proposal**: Book discovery call, send proposal, get commitment

B2B SALES TACTICS:
- **Case Studies**: "We did this for [similar company]"
- **ROI Calculator**: Show potential return on investment
- **Social Proof**: Logos of clients, testimonials, awards
- **Urgency Creation**: "Our calendar fills up fast" / "Can start in 2 weeks if we decide now"
- **Risk Reversal**: Guarantees, phased approach, trial projects

GOAL: Book discovery call or send proposal - advance the deal.`,

        saas: `💻 **SAAS SALES SPECIALIST**

YOUR MISSION: Convert interest into demos, demos into trials, trials into paying customers. Sell the transformation, not the features.

MODERN SAAS SELLING:
1. **Identify Pain Point**: What problem are they trying to solve?
2. **Qualify Hard**: Company size? Current solution? Budget? Decision process?
3. **Demo the Value**: "Let me show you how this solves exactly your problem"
4. **Use Cases**: "Companies like yours use this to..."
5. **Free Trial**: Remove risk - "Try it free for 14 days, no credit card"
6. **Handle Objections**: Integration concerns? Migration? Support? Address it all
7. **Close on Trial**: Get them USING the product - that's how you win

POWER STRATEGIES:
- **ROI Focus**: "Save X hours per week" / "Reduce costs by Y%"
- **Comparison**: "Vs [competitor], we offer..." (if you have that info)
- **Scalability**: "Grows with your business"
- **Support**: "24/7 support + dedicated account manager"
- **Social Proof**: "Trusted by X companies" / "4.9/5 stars"

CONVERSION FLOW:
→ General interest? Ask about their current process and pain points
→ Feature questions? Connect features to THEIR specific needs
→ Pricing questions? Show ROI, offer right plan, trial if hesitant
→ Ready? Book demo or start free trial IMMEDIATELY

GOAL: Demo booked or trial started = success.`,

        healthcare: `🏥 **HEALTHCARE & WELLNESS SALES ADVISOR**

YOUR MISSION: Help patients prioritize their health by making appointments easy and showing genuine care.

EMPATHETIC SELLING:
1. **Listen with Care**: Health concerns require extra empathy and understanding
2. **Build Trust**: Professional, knowledgeable, reassuring tone
3. **Explain Clearly**: Services, procedures, what to expect - remove uncertainty
4. **Handle Insurance**: Accepted plans, costs, payment options
5. **Easy Scheduling**: "I have availability Tuesday at 10am, does that work?"
6. **Follow-Up**: Remind about appointments, check in after visits

HEALTHCARE SELLING TACTICS:
- **Accessibility**: "New patients welcome, short wait times"
- **Expertise**: "Board-certified specialists with X years experience"
- **Modern Facilities**: "State-of-the-art equipment and comfortable environment"
- **Insurance**: "We accept most major insurance plans"
- **Urgency When Needed**: "Early detection is key" (but never fear-monger)

GOAL: Appointment booked = successful conversation.`,

        automotive: `🚗 **AUTOMOTIVE SALES PROFESSIONAL**

YOUR MISSION: Help buyers find their perfect vehicle and drive off the lot with confidence.

CAR SALES EXCELLENCE:
1. **Understand Their Needs**: Family car? Performance? Fuel efficiency? Budget?
2. **Know Inventory**: Features, specs, benefits of every model in knowledge base
3. **Test Drive Push**: "Best way to know is to drive it - when can you come in?"
4. **Value Proposition**: Safety, reliability, resale value, warranty, features
5. **Financing**: "Monthly payment as low as $X with our current offer"
6. **Trade-In**: "What are you driving now? We offer competitive trade-ins"
7. **Close the Deal**: "Ready to make this yours today?"

AUTOMOTIVE TACTICS:
- **Create Desire**: "Imagine yourself behind the wheel"
- **Limited Stock**: "This model is moving fast"
- **Seasonal Offers**: "End of year clearance" / "Summer sale"
- **Technology Focus**: "Latest safety tech" / "Infotainment system"
- **Total Cost**: Fuel savings, low maintenance, insurance

GOAL: Test drive scheduled or deal closed.`,

        coaching: `🎯 **COACHING & CONSULTING SALES EXPERT**

YOUR MISSION: Sell transformation and results. Help people invest in themselves and their growth.

HIGH-TICKET SELLING:
1. **Deep Discovery**: Current situation? Desired outcome? What's blocking them?
2. **Create Gap Awareness**: Help them see the distance between where they are and where they want to be
3. **Position as Guide**: You've helped others achieve this exact transformation
4. **Paint the Future**: "In 90 days, you'll be..."
5. **Investment Mindset**: This isn't a cost, it's an investment in themselves
6. **Overcome Money Objections**: "Can you afford NOT to change?"
7. **Close on Discovery Call**: "Let's schedule a free strategy session"

TRANSFORMATION SELLING:
- **Success Stories**: Detailed before/after client transformations
- **Guarantee**: "Results in X days or money back"
- **Exclusivity**: "I only take X clients per month"
- **Urgency**: "Next cohort starts soon, only 2 spots left"
- **Payment Plans**: "Invest just $X/month in your future"

GOAL: Discovery call booked = foot in the door.`,
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

      // Build the full system prompt
      const systemPrompt = `${systemPrompts[aiTone as keyof typeof systemPrompts]}
${specializedPrompt ? `\n${specializedPrompt}\n` : ''}
${knowledgeSection}
${goalInstructions[conversationGoal] || ''}

═══════════════════════════════════════════════════════════════════════

🎯 **MASTER SALES PSYCHOLOGY & CONVERSATION EXCELLENCE**

You are a PROFESSIONAL sales expert who understands human psychology, builds genuine relationships, and drives conversions naturally. You're not a pushy salesperson - you're a trusted advisor who helps people make the right decision.

**CORE PRINCIPLES:**

1. **KNOWLEDGE BASE IS YOUR BIBLE**
   - EVERY answer about the business MUST come from your knowledge base
   - NEVER guess, assume, or make up information
   - If it's in the knowledge base → Use it (specific, accurate, detailed)
   - If it's NOT in the knowledge base → Be honest: "Let me get you the exact information on that"
   - The knowledge base was scraped from their website, so it contains EVERYTHING they want you to know

2. **READ THE CUSTOMER LIKE A BOOK**
   - What's their real need? (not just what they're asking)
   - What's their emotional state? (excited, skeptical, confused, ready to buy?)
   - What's their urgency level? (browsing vs. ready to decide)
   - What's their biggest concern? (price, quality, trust, timing?)

3. **ADAPT YOUR COMMUNICATION STYLE**
   - Match their language and tone (formal, casual, technical, simple)
   - Match their energy level (enthusiastic, calm, direct)
   - Match their language (if they write in Spanish, German, Arabic, etc. - respond in that language)
   - Voice messages are transcribed to text - respond naturally
   - Keep messages CONCISE (60-100 words max) - people are on mobile!

4. **BUILD TRUST BEFORE SELLING**
   - First, be helpful and knowledgeable
   - Show you understand their situation
   - Answer questions thoroughly and honestly
   - THEN guide toward the sale naturally

5. **HANDLE OBJECTIONS LIKE A PRO**
   - Price concerns? → Show value, ROI, payment options, guarantees
   - Quality doubts? → Share testimonials, guarantees, credentials from knowledge base
   - Timing issues? → Create urgency (limited stock, offers ending, seasonal demand)
   - Competitor comparison? → Differentiate with unique value props
   - "Let me think about it"? → "What specific concerns can I address?" (find the REAL objection)

6. **CLOSE CONVERSATIONS EFFECTIVELY**
   - EVERY message should end with a question or call-to-action
   - Move them forward: book appointment, place order, share contact info, visit website
   - Use trial closes: "Does this sound like what you're looking for?"
   - Then final close: "Ready to move forward?" / "Shall I book that for you?" / "When works best for you?"

7. **CREATE ENGAGEMENT & URGENCY**
   - Limited availability: "We're booking up fast for this week"
   - Social proof: "This is our most popular option" (if from knowledge base)
   - Scarcity: "Only a few left" / "Offer ends soon" (ONLY if true/in knowledge base)
   - FOMO: "Don't miss out on..."
   - But NEVER lie or manipulate - only use what's TRUE

═══════════════════════════════════════════════════════════════════════

📱 **MESSAGE BEST PRACTICES:**

✅ DO:
- Reference specific info from knowledge base (products, prices, services, company details)
- Ask qualifying questions to understand needs
- Highlight benefits (what's in it for them), not just features
- Use 1-2 relevant emojis per message (keep it human but professional)
- End with engaging question or clear next step
- Show enthusiasm and confidence
- Be conversational and warm (like texting a knowledgeable friend)

❌ DON'T:
- Make up products, prices, or business information not in knowledge base
- Give generic/vague answers when specific info is available
- Send long paragraphs (break into bullet points or short sentences)
- Be pushy or aggressive (builds resistance)
- Use excessive emojis (unprofessional)
- Let conversation die without next step
- Give legal, medical, or financial advice unless you're that type of business

═══════════════════════════════════════════════════════════════════════

💬 **CONVERSATION STRUCTURE:**

**OPENING (First Message):**
Warm greeting + brief introduction + understand their need
Example: "Hi! I'm ${agentName}${businessType && businessType !== 'general' ? ` with ${businessType}` : ''}. How can I help you today? 😊"

**DISCOVERY PHASE:**
Ask 2-3 smart questions to understand:
- What they need
- Their situation/context
- Their timeline
- Their budget (if relevant)

**PRESENTATION PHASE:**
Present solution from knowledge base:
- Specific to their needs
- Benefits-focused
- Backed by social proof if available
- Clear and concise

**OBJECTION HANDLING:**
Listen → Acknowledge → Address → Reconfirm interest

**CLOSING PHASE:**
Trial close → Handle final concerns → Ask for commitment → Next steps

**IF THEY GO SILENT:**
Don't give up! (Follow-up system will handle this)

═══════════════════════════════════════════════════════════════════════

🎓 **EXAMPLES OF EXCELLENT RESPONSES:**

BAD: "We have many products. What are you looking for?"
GOOD: "I can help you find the perfect fit! Are you looking for [specific category from knowledge base] or [another option]? And is this for personal use or a gift?"

BAD: "The price is $X."
GOOD: "It's $X, which includes [benefit 1], [benefit 2], and [benefit 3]. Most customers tell us it pays for itself within [timeframe from knowledge base]. Does that work with your budget?"

BAD: "Okay, let me know if you have questions."
GOOD: "I think the [product] would be perfect for what you described. Want me to reserve one for you? I can have it ready for pickup today! 🎉"

═══════════════════════════════════════════════════════════════════════

🏆 **YOUR SUCCESS METRICS:**
- Did you use knowledge base information accurately? ✓
- Did you qualify the customer (understand their needs)? ✓
- Did you build trust and rapport? ✓
- Did you handle objections effectively? ✓
- Did you move them toward conversion? ✓
- Did you end with a clear call-to-action? ✓

═══════════════════════════════════════════════════════════════════════

Remember: You're a PROFESSIONAL sales expert with deep knowledge (from the knowledge base), genuine care for customers, and natural ability to guide people to the right decision. Every conversation is an opportunity to help someone AND drive revenue. Be confident, be helpful, be human, and CLOSE DEALS. 💪

Let's make this conversation count!`;

      // Estimate tokens for quota check
      const estimatedInputTokens = estimateTokens(systemPrompt + chatHistory.map(m => m.content).join('\n'));
      const estimatedOutputTokens = 300; // max_tokens setting
      const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

      // Check token quota before making API call
      const quotaCheck = await TokenUsageService.checkQuota(conversation.userId, estimatedTotalTokens);
      if (!quotaCheck.allowed) {
        console.warn(`Token quota exceeded for user ${conversation.userId}:`, quotaCheck.reason);
        // Don't generate AI response if quota exceeded
        return;
      }

      // Check rate limit
      const rateLimitCheck = await TokenUsageService.checkRateLimit(conversation.userId);
      if (!rateLimitCheck.allowed) {
        console.warn(`Rate limit exceeded for user ${conversation.userId}:`, rateLimitCheck.reason);
        // Don't generate AI response if rate limited
        return;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...chatHistory,
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiReply = response.choices[0].message.content || '';

      // Track actual token usage after API call
      const actualInputTokens = response.usage?.prompt_tokens || estimatedInputTokens;
      const actualOutputTokens = response.usage?.completion_tokens || estimateTokens(aiReply);
      await TokenUsageService.trackUsage(conversation.userId, actualInputTokens, actualOutputTokens);

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
        // Create usage record if it doesn't exist - fetch user's plan for correct limits
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { planType: true },
        });
        const userPlanLimits = getPlanLimits(user?.planType || 'starter');

        await prisma.messageUsage.create({
          data: {
            userId,
            month: currentMonth,
            messagesUsed: 1,
            messageLimit: userPlanLimits.messageLimit,
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

  /**
   * Clean up event listeners for a session to prevent memory leaks
   */
  private cleanupEventListeners(agentId: string): void {
    const session = this.sessions.get(agentId);

    if (!session?.sock) return;

    try {
      // Remove all event listeners
      session.sock.ev.removeAllListeners('connection.update');
      session.sock.ev.removeAllListeners('creds.update');
      session.sock.ev.removeAllListeners('messages.upsert');
      session.sock.ev.removeAllListeners('messages.update');

      console.log(`🧹 Cleaned up event listeners for agent ${agentId}`);

      // Clear tracked listeners
      if (session.eventListeners) {
        session.eventListeners.clear();
      }
    } catch (error) {
      console.error(`Error cleaning up event listeners for ${agentId}:`, error);
    }
  }

  async disconnectWhatsApp(agentId: string): Promise<void> {
    const session = this.sessions.get(agentId);

    if (session?.sock) {
      // Clean up event listeners BEFORE logout to prevent memory leaks
      this.cleanupEventListeners(agentId);

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

    console.log(`✅ Successfully disconnected and cleaned up agent ${agentId}`);
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

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';

interface WhatsAppSession {
  sock: any;
  qr: string | null;
  isConnected: boolean;
  agentId: string;
  userId: string;
  isReconnecting?: boolean; // Flag to prevent duplicate reconnections
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
          keys: makeCacheableSignalKeyStore(state.keys, console),
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

          console.log('📱 Connection update:', { connection, hasQR: !!qr, agentId });

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

          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('🔌 Connection closed:', {
              statusCode,
              shouldReconnect,
              reason: lastDisconnect?.error?.message,
            });

            // Check for conflict error (multiple sessions)
            const isConflict =
              statusCode === 440 ||
              lastDisconnect?.error?.message?.includes('conflict') ||
              lastDisconnect?.error?.message?.includes('Stream Errored (conflict)');

            if (isConflict) {
              console.log('⚠️ Conflict detected (another session is active). Not reconnecting to avoid loop.');
              // Don't reconnect on conflict - just clean up
              this.sessions.delete(agentId);
              await this.updateConnectionStatus(agentId, false, null);
              clearTimeout(timeout);
              resolve(null);
              return;
            }

            // Check if it's a bad session / connection failure (expired credentials)
            const isBadSession =
              statusCode === DisconnectReason.badSession ||
              statusCode === DisconnectReason.timedOut ||
              lastDisconnect?.error?.message?.includes('Connection Failure') ||
              lastDisconnect?.error?.message?.includes('Connection Error');

            if (isBadSession) {
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

              // Mark as reconnecting and retry
              const tempSession: WhatsAppSession = {
                sock: null,
                qr: null,
                isConnected: false,
                agentId,
                userId,
                isReconnecting: true,
              };
              this.sessions.set(agentId, tempSession);

              // Retry connection after a short delay (will generate new QR)
              setTimeout(() => {
                this.connectWhatsApp(userId, agentId);
              }, 2000);
            } else if (shouldReconnect) {
              console.log('🔄 Connection lost, will reconnect...');

              // Mark as reconnecting
              const session = this.sessions.get(agentId);
              if (session) {
                session.isReconnecting = true;
              }

              // Other connection issues - retry without clearing
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
              session.sock = sock; // Update socket reference
            }

            // Import previous chats in background
            setTimeout(() => {
              this.importPreviousChats(userId, agentId, sock).catch(console.error);
            }, 5000);

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

  async importPreviousChats(userId: string, agentId: string, sock: any): Promise<void> {
    try {
      console.log('Starting to import previous chats...');

      // Get WhatsApp connection from database
      const whatsappConnection = await prisma.whatsAppConnection.findFirst({
        where: { agentId, userId },
      });

      if (!whatsappConnection) {
        console.log('No WhatsApp connection found');
        return;
      }

      // This is simplified - Baileys doesn't directly expose chat list
      // In production, you'd listen for chat updates
      console.log('Previous chat import completed');
    } catch (error) {
      console.error('Error importing previous chats:', error);
    }
  }

  async handleIncomingMessage(userId: string, agentId: string, sock: any, msg: any): Promise<void> {
    try {
      const messageText = this.extractMessageText(msg);
      const customerPhone = msg.key.remoteJid?.split('@')[0] || '';

      console.log(`📱 Extracted message - phone: ${customerPhone}, text: ${messageText}`);

      if (!messageText || !customerPhone) {
        console.log('⚠️ Missing message text or customer phone, skipping');
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

      // Generate AI response if enabled
      if (conversation.aiEnabled) {
        console.log('🤖 AI is enabled for this conversation, checking limits...');
        const { canUserSendMessage } = await import('./trial-checker');
        const canSend = await canUserSendMessage(userId);

        if (canSend.allowed) {
          console.log('✅ User can send messages, generating AI response...');
          await this.generateAIResponse(userId, agentId, conversation.id, sock, msg.key.remoteJid);
        } else {
          console.log(`❌ Cannot send AI reply: ${canSend.reason}`);
        }
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

      const aiTone = conversation.agent?.aiTone || 'friendly';

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

      const systemPrompts = {
        professional: 'You are a professional business assistant. Be formal, clear, and concise.',
        friendly: 'You are a friendly and helpful assistant. Be warm, approachable, and conversational.',
        direct: 'You are a direct sales assistant. Be quick, to-the-point, and sales-focused.',
        warm: 'You are a warm and supportive assistant. Be empathetic, caring, and helpful.',
      };

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompts[aiTone as keyof typeof systemPrompts]}

Business Information:
${businessKnowledge || 'No specific business information provided yet.'}

Instructions:
- Reply in under 100 words
- Be helpful and try to convert leads
- Match the customer's language
- Use emojis sparingly and naturally`,
          },
          ...chatHistory,
        ],
        max_tokens: 200,
      });

      const aiReply = response.choices[0].message.content || '';

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

  extractMessageText(msg: any): string {
    const message = msg.message;

    if (message?.conversation) return message.conversation;
    if (message?.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message?.imageMessage?.caption) return message.imageMessage.caption;
    if (message?.videoMessage?.caption) return message.videoMessage.caption;

    return '';
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

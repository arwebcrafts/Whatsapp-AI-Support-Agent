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
}

class WhatsAppServiceFixed {
  private sessions: Map<string, WhatsAppSession> = new Map(); // key: agentId
  private authDir = path.join(process.cwd(), 'whatsapp_sessions');

  constructor() {
    // Create auth directory if it doesn't exist
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  async connectWhatsApp(userId: string, agentId: string): Promise<{ qr: string | null; status: string }> {
    try {
      console.log(`Connecting WhatsApp for agent ${agentId}`);

      const agentAuthDir = path.join(this.authDir, agentId);

      if (!fs.existsSync(agentAuthDir)) {
        fs.mkdirSync(agentAuthDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(agentAuthDir);
      const { version } = await fetchLatestBaileysVersion();

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

      // Handle QR code generation
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log('Connection update:', { connection, hasQR: !!qr });

        if (qr) {
          try {
            // Generate QR code as data URL
            qrCode = await QRCode.toDataURL(qr);
            const session = this.sessions.get(agentId);
            if (session) {
              session.qr = qrCode;
            }
            console.log('QR Code generated successfully');
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        }

        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          console.log('Connection closed, should reconnect:', shouldReconnect);

          if (shouldReconnect) {
            // Retry connection after a delay
            setTimeout(() => {
              this.connectWhatsApp(userId, agentId);
            }, 3000);
          } else {
            // Logged out - update database
            await this.updateConnectionStatus(agentId, false, null);
            this.sessions.delete(agentId);
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connected successfully for agent:', agentId);

          // Get phone number
          const phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id || '';

          // Update database
          await this.updateConnectionStatus(agentId, true, phoneNumber);

          // Update session
          const session = this.sessions.get(agentId);
          if (session) {
            session.isConnected = true;
            session.qr = null; // Clear QR once connected
          }

          // Import previous chats in background
          setTimeout(() => {
            this.importPreviousChats(userId, agentId, sock).catch(console.error);
          }, 5000);
        }
      });

      // Handle credentials update
      sock.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
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

      if (!messageText || !customerPhone) return;

      console.log(`Incoming message from ${customerPhone}: ${messageText}`);

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
        const { canUserSendMessage } = await import('./trial-checker');
        const canSend = await canUserSendMessage(userId);

        if (canSend.allowed) {
          await this.generateAIResponse(userId, agentId, conversation.id, sock, msg.key.remoteJid);
        } else {
          console.log(`Cannot send AI reply: ${canSend.reason}`);
        }
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
        await prisma.whatsAppConnection.update({
          where: { id: existing.id },
          data: {
            isConnected,
            phoneNumber,
            lastActive: new Date(),
          },
        });
      }
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
}

// Singleton instance
export const whatsappServiceFixed = new WhatsAppServiceFixed();

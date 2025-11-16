import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappServiceFixed } from '@/lib/whatsapp-service-fixed';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get agentId from query params
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({ message: 'Agent ID is required' }, { status: 400 });
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
    });

    if (!agent) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    // Get session from memory for this specific agent
    const sessionData = whatsappServiceFixed.getSession(agentId);

    // Get connection from database for this agent
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { agentId: agentId },
    });

    const isConnected = connection?.isConnected || false;
    const hasSession = !!sessionData;
    const sessionConnected = sessionData?.isConnected || false;

    // Log for debugging
    console.log('📊 Status check:', {
      agentId,
      dbConnected: isConnected,
      hasSession,
      sessionConnected,
      hasQR: !!sessionData?.qr,
      phoneNumber: connection?.phoneNumber,
    });

    // FIX: If DB shows connected but no in-memory session exists (server restart/logout scenario)
    // Try to reconnect using saved auth files
    if (isConnected && !hasSession) {
      console.log('🔄 DB shows connected but no session in memory - attempting reconnection...');

      // Trigger reconnection in background (don't await)
      whatsappServiceFixed.connectWhatsApp(user.id, agentId)
        .catch(err => console.error('Auto-reconnect failed:', err));

      // Return status showing reconnecting state
      return NextResponse.json({
        isConnected: false,
        reconnecting: true,
        phoneNumber: connection?.phoneNumber || null,
        lastActive: connection?.lastActive || null,
        qr: null,
        debug: {
          hasSession,
          sessionConnected,
          dbConnected: isConnected,
          autoReconnecting: true,
        }
      });
    }

    return NextResponse.json({
      isConnected: isConnected && hasSession && sessionConnected,
      phoneNumber: connection?.phoneNumber || null,
      lastActive: connection?.lastActive || null,
      qr: sessionData?.qr || null,
      debug: {
        hasSession,
        sessionConnected,
        dbConnected: isConnected,
      }
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { message: 'Failed to get status' },
      { status: 500 }
    );
  }
}

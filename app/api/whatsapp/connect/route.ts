import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappServiceFixed } from '@/lib/whatsapp-service-fixed';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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

    // Parse JSON body with error handling
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return NextResponse.json({ message: 'Request body is required' }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ message: 'Agent ID is required. Please provide an agentId in the request body.' }, { status: 400 });
    }

    console.log(`📱 API: Connect request for agent ${agentId} from user ${user.email}`);

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id,
      },
      include: {
        whatsappConnection: true,
      },
    });

    if (!agent) {
      console.log(`❌ API: Agent ${agentId} not found or doesn't belong to user ${user.id}`);
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    console.log(`✅ API: Agent ${agent.name} found, existing connection: ${agent.whatsappConnection?.isConnected ? 'connected' : 'not connected'}`);

    // Connect WhatsApp for this specific agent
    const result = await whatsappServiceFixed.connectWhatsApp(user.id, agentId);

    console.log(`📱 API: Connect result for agent ${agentId}: status=${result.status}, hasQR=${!!result.qr}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    return NextResponse.json(
      { message: 'Failed to connect WhatsApp', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

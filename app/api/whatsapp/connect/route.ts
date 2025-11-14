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

    const body = await req.json();
    const { agentId } = body;

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

    // Connect WhatsApp for this specific agent
    const result = await whatsappServiceFixed.connectWhatsApp(user.id, agentId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('WhatsApp connect error:', error);
    return NextResponse.json(
      { message: 'Failed to connect WhatsApp', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

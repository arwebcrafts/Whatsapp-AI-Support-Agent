import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/whatsapp/default-agent - Get or create user's default agent
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

    // Try to get existing agent
    let agent = await prisma.agent.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        whatsappConnection: true,
        agentKnowledge: {
          include: {
            knowledge: true,
          },
        },
      },
    });

    // If no agent exists, create a default one
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          userId: user.id,
          name: 'My WhatsApp AI',
          description: 'AI assistant for WhatsApp messages',
          aiTone: 'friendly',
          isActive: true,
        },
        include: {
          whatsappConnection: true,
          agentKnowledge: {
            include: {
              knowledge: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error getting default agent:', error);
    return NextResponse.json(
      { message: 'Failed to get agent' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsapp-service';
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

    await whatsappService.disconnectWhatsApp(user.id);

    return NextResponse.json({ message: 'Disconnected successfully' });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    return NextResponse.json(
      { message: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

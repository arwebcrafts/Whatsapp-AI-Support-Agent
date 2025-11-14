import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsapp-service';
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

    // Get session from memory
    const sessionData = whatsappService.getSession(user.id);

    // Get connection from database
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { userId: user.id },
    });

    return NextResponse.json({
      isConnected: connection?.isConnected || false,
      phoneNumber: connection?.phoneNumber,
      lastActive: connection?.lastActive,
      qr: sessionData?.qr || null,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      { message: 'Failed to get status' },
      { status: 500 }
    );
  }
}

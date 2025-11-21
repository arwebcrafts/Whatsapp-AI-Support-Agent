import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/support/tickets
 * Get all tickets for the logged-in user (or all tickets if admin)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[API] GET /api/support/tickets - Request received');
    const session = await getServerSession(authOptions);
    console.log('[API] Session:', session ? 'exists' : 'null');
    console.log('[API] User email:', session?.user?.email);

    if (!session?.user?.email) {
      console.log('[API] No session or email, returning 401');
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[API] Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    console.log('[API] User found:', user ? `id=${user.id}, role=${user.role}` : 'null');

    if (!user) {
      console.log('[API] User not found in database, returning 404');
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log('[API] Fetching tickets for user role:', user.role);
    // Admin can see all tickets, users only see their own
    const tickets = await prisma.supportTicket.findMany({
      where: user.role === 'admin' ? {} : { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: [
        { status: 'asc' }, // Open tickets first
        { updatedAt: 'desc' }
      ]
    });
    console.log('[API] Tickets fetched successfully, count:', tickets.length);

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching tickets:", error);
    console.error("[API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { subject, description, category, priority } = body;

    // Validation
    if (!subject || !description) {
      return NextResponse.json(
        { message: "Subject and description are required" },
        { status: 400 }
      );
    }

    if (subject.length > 500) {
      return NextResponse.json(
        { message: "Subject must be less than 500 characters" },
        { status: 400 }
      );
    }

    if (description.length > 10000) {
      return NextResponse.json(
        { message: "Description must be less than 10,000 characters" },
        { status: 400 }
      );
    }

    // Create ticket with initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        description,
        category: category || 'bug',
        priority: priority || 'medium',
        status: 'open',
        messages: {
          create: {
            userId: user.id,
            message: description,
            isAdminResponse: false,
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        messages: true,
      }
    });

    return NextResponse.json(
      {
        message: "Ticket created successfully",
        ticket
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

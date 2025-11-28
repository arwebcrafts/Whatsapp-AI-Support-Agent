import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        whatsappConnection: true,
        agentKnowledge: {
          include: {
            knowledge: true,
          },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    if (!agent || agent.userId !== user.id) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Get agent error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
    });

    if (!agent || agent.userId !== user.id) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, businessName, description, aiTone, responseDelay, isActive } = body;

    const updated = await prisma.agent.update({
      where: { id: params.id },
      data: {
        name,
        businessName,
        description,
        aiTone,
        responseDelay,
        isActive,
      },
    });

    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error("Update agent error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
    });

    if (!agent || agent.userId !== user.id) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    await prisma.agent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Delete agent error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

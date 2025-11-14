import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const body = await req.json();
    const { leadScore } = body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
    });

    if (!conversation || conversation.userId !== user.id) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.conversation.update({
      where: { id: params.id },
      data: { leadScore },
    });

    return NextResponse.json({ message: "Lead score updated successfully" });
  } catch (error) {
    console.error("Update lead score error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; faqId: string } }
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

    const faq = await prisma.fAQ.findUnique({
      where: { id: params.faqId },
    });

    if (!faq || faq.userId !== user.id) {
      return NextResponse.json({ message: "FAQ not found" }, { status: 404 });
    }

    const body = await req.json();
    const { question, answer, category } = body;

    const updatedFaq = await prisma.fAQ.update({
      where: { id: params.faqId },
      data: {
        ...(question && { question }),
        ...(answer && { answer }),
        ...(category && { category }),
      },
    });

    return NextResponse.json({ faq: updatedFaq }, { status: 200 });
  } catch (error) {
    console.error("Update FAQ error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; faqId: string } }
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

    const faq = await prisma.fAQ.findUnique({
      where: { id: params.faqId },
    });

    if (!faq || faq.userId !== user.id) {
      return NextResponse.json({ message: "FAQ not found" }, { status: 404 });
    }

    await prisma.fAQ.delete({
      where: { id: params.faqId },
    });

    return NextResponse.json({ message: "FAQ deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete FAQ error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

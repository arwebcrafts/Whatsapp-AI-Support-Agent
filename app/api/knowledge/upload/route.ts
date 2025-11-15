import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentProcessor } from "@/lib/document-processor";

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Process file
    const result = await documentProcessor.processFile(file);

    // Save to knowledge base
    const knowledge = await prisma.knowledgeBase.create({
      data: {
        userId: user.id,
        title: result.fileName,
        content: documentProcessor.sanitizeContent(result.content),
        sourceType: result.fileType,
        fileName: result.fileName,
        fileSize: result.fileSize,
      },
    });

    // Link to agent if specified
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (agent && agent.userId === user.id) {
        await prisma.agentKnowledge.create({
          data: {
            agentId,
            knowledgeId: knowledge.id,
          },
        });
      }
    }

    return NextResponse.json({ knowledge }, { status: 201 });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

// Route segment config for Next.js 14 App Router
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file uploads

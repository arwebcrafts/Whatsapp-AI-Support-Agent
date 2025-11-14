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

    const body = await req.json();
    const { url, agentId } = body;

    if (!url) {
      return NextResponse.json(
        { message: "URL is required" },
        { status: 400 }
      );
    }

    // Scrape website
    const result = await documentProcessor.scrapeWebsite(url);

    // Save to knowledge base
    const knowledge = await prisma.knowledgeBase.create({
      data: {
        userId: user.id,
        title: result.title,
        content: documentProcessor.sanitizeContent(result.content),
        sourceType: 'website',
        sourceUrl: url,
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
    console.error("Website scrape error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to scrape website" },
      { status: 500 }
    );
  }
}

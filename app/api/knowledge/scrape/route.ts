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

    // Normalize URL (remove trailing slash for consistency)
    const normalizedUrl = url.trim().replace(/\/$/, '');

    // Check if this URL already exists for this user/agent
    if (agentId) {
      const existingKnowledge = await prisma.knowledgeBase.findFirst({
        where: {
          userId: user.id,
          sourceUrl: normalizedUrl,
          agentKnowledge: {
            some: {
              agentId: agentId
            }
          }
        },
        include: {
          agentKnowledge: true
        }
      });

      if (existingKnowledge) {
        return NextResponse.json(
          {
            message: "This website has already been scraped for this agent",
            knowledge: existingKnowledge,
            alreadyExists: true
          },
          { status: 200 }
        );
      }
    } else {
      // Check for duplicate URL for this user (no agent specified)
      const existingKnowledge = await prisma.knowledgeBase.findFirst({
        where: {
          userId: user.id,
          sourceUrl: normalizedUrl,
        }
      });

      if (existingKnowledge) {
        return NextResponse.json(
          {
            message: "This website has already been scraped",
            knowledge: existingKnowledge,
            alreadyExists: true
          },
          { status: 200 }
        );
      }
    }

    // Scrape website
    const result = await documentProcessor.scrapeWebsite(normalizedUrl);

    // Save to knowledge base
    const knowledge = await prisma.knowledgeBase.create({
      data: {
        userId: user.id,
        title: result.title,
        content: documentProcessor.sanitizeContent(result.content),
        sourceType: 'website',
        sourceUrl: normalizedUrl,
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

    return NextResponse.json({ knowledge, alreadyExists: false }, { status: 201 });
  } catch (error: any) {
    console.error("Website scrape error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to scrape website" },
      { status: 500 }
    );
  }
}

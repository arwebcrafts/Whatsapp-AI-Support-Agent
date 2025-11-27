import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard-layout";
import ConversationsClient from "@/components/conversations-client";

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  // Check if trial has expired
  if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
    if (new Date() > user.trialEndsAt) {
      redirect("/dashboard/billing?trialExpired=true");
    }
  }

  // Check if subscription is active
  if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'cancelled') {
    redirect("/dashboard/billing?subscriptionInactive=true");
  }

  // Fetch conversations with pagination and optimized message loading
  // SCALABILITY FIX: Limit conversations per page and only load last message initially
  // This prevents N+1 query issue where 100 conversations × 50 messages = 5,000 rows
  const CONVERSATIONS_PER_PAGE = 20;

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Only load the last message for list view (not 50!)
      },
      agent: {
        select: { name: true, id: true }
      }
    },
    orderBy: { lastMessageAt: "desc" },
    take: CONVERSATIONS_PER_PAGE, // Pagination: load 20 conversations at a time
  });

  // Serialize data for client component
  const serializedConversations = conversations.map((conv) => ({
    id: conv.id,
    customerName: conv.customerName,
    customerPhone: conv.customerPhone,
    leadScore: conv.leadScore,
    engagementScore: conv.engagementScore,
    conversationGoal: conv.conversationGoal,
    aiEnabled: conv.aiEnabled,
    aiMode: conv.aiMode,
    notes: conv.notes,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    agentName: conv.agent?.name || 'Unknown',
    agentId: conv.agent?.id,
    // Only include last message for list view - full messages loaded on demand
    messages: conv.messages.map((msg) => ({
      id: msg.id,
      senderType: msg.senderType,
      messageText: msg.messageText || "",
      createdAt: msg.createdAt.toISOString(),
    })),
  }));

  return (
    <DashboardLayout>
      <ConversationsClient initialConversations={serializedConversations} />
    </DashboardLayout>
  );
}

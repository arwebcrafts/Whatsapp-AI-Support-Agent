import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminUsersClient from "@/components/admin-users-client";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (user?.role !== 'admin') {
    redirect("/dashboard");
  }

  // Get all users with their stats
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      planType: true,
      _count: {
        select: {
          agents: true,
          conversations: true,
          whatsappConnections: true,
        },
      },
      messageUsage: {
        orderBy: {
          month: 'desc',
        },
        take: 1,
        select: {
          messagesUsed: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Serialize ALL data to strings to prevent any numeric rendering issues
  const serializedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    subscriptionStatus: user.subscriptionStatus,
    planType: user.planType,
    _count: {
      agents: String(user._count.agents),
      conversations: String(user._count.conversations),
      whatsappConnections: String(user._count.whatsappConnections),
    },
    messageUsage: user.messageUsage.map(usage => ({
      messagesUsed: String(usage.messagesUsed),
    })),
  }));

  return <AdminUsersClient users={serializedUsers} />;
}

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

  // DETAILED DEBUG LOGGING - DO NOT REMOVE
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SERVER SIDE RENDERING - DETAILED DEBUG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Total users fetched:', users.length);
  console.log('Total serialized users:', serializedUsers.length);

  if (serializedUsers.length > 0) {
    console.log('\n📊 FIRST USER COMPLETE DATA:');
    const firstUser = serializedUsers[0];
    console.log(JSON.stringify(firstUser, null, 2));

    console.log('\n🔬 FIRST USER TYPE ANALYSIS:');
    console.log('- id type:', typeof firstUser.id, '| value:', firstUser.id);
    console.log('- email type:', typeof firstUser.email, '| value:', firstUser.email);
    console.log('- name type:', typeof firstUser.name, '| value:', firstUser.name);
    console.log('- role type:', typeof firstUser.role, '| value:', firstUser.role);
    console.log('- planType type:', typeof firstUser.planType, '| value:', firstUser.planType);
    console.log('- subscriptionStatus type:', typeof firstUser.subscriptionStatus, '| value:', firstUser.subscriptionStatus);
    console.log('- _count.agents type:', typeof firstUser._count.agents, '| value:', firstUser._count.agents);
    console.log('- _count.conversations type:', typeof firstUser._count.conversations, '| value:', firstUser._count.conversations);
    console.log('- _count.whatsappConnections type:', typeof firstUser._count.whatsappConnections, '| value:', firstUser._count.whatsappConnections);
    console.log('- messageUsage[0]?.messagesUsed type:', typeof firstUser.messageUsage[0]?.messagesUsed, '| value:', firstUser.messageUsage[0]?.messagesUsed);

    // Check if admin user exists
    const adminUser = serializedUsers.find(u => u.planType === 'admin_access');
    if (adminUser) {
      console.log('\n👑 ADMIN USER FOUND:');
      console.log('- email:', adminUser.email);
      console.log('- planType:', adminUser.planType, '| type:', typeof adminUser.planType);
      console.log('- role:', adminUser.role, '| type:', typeof adminUser.role);
      console.log('- subscriptionStatus:', adminUser.subscriptionStatus, '| type:', typeof adminUser.subscriptionStatus);
    }

    // Check ALL users for any numeric values
    console.log('\n🔍 SCANNING ALL USERS FOR NUMERIC VALUES:');
    serializedUsers.forEach((u, idx) => {
      const numericFields = [];
      if (typeof u.id === 'number') numericFields.push('id');
      if (typeof u._count.agents === 'number') numericFields.push('_count.agents');
      if (typeof u._count.conversations === 'number') numericFields.push('_count.conversations');
      if (typeof u._count.whatsappConnections === 'number') numericFields.push('_count.whatsappConnections');
      if (u.messageUsage[0] && typeof u.messageUsage[0].messagesUsed === 'number') numericFields.push('messageUsage[0].messagesUsed');

      if (numericFields.length > 0) {
        console.log(`❌ User ${idx} (${u.email}) has NUMERIC fields:`, numericFields);
      }
    });
  }

  console.log('\n✅ SERVER SERIALIZATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return <AdminUsersClient users={serializedUsers} />;
}

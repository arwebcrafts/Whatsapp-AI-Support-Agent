import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Bot,
  Smartphone,
  Shield,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
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

  // Get platform stats
  const [
    totalUsers,
    activeUsers,
    trialUsers,
    totalAgents,
    totalConversations,
    totalMessages,
    activeConnections,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Active paid users
    prisma.user.count({
      where: {
        subscriptionStatus: { in: ['active', 'lifetime'] },
      },
    }),

    // Trial users
    prisma.user.count({
      where: {
        subscriptionStatus: 'trial',
      },
    }),

    // Total agents
    prisma.agent.count(),

    // Total conversations
    prisma.conversation.count(),

    // Total messages
    prisma.message.count(),

    // Active WhatsApp connections
    prisma.whatsAppConnection.count({
      where: {
        isConnected: true,
      },
    }),
  ]);

  // Get this month's message usage
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyUsage = await prisma.messageUsage.aggregate({
    where: {
      month: currentMonth,
    },
    _sum: {
      messagesUsed: true,
    },
  });

  // Get revenue estimate (based on subscriptions)
  const planRevenue = {
    starter: 29,
    professional: 99,
    business: 299,
  };

  const subscriptionBreakdown = await prisma.user.groupBy({
    by: ['planType'],
    where: {
      subscriptionStatus: { in: ['active', 'lifetime'] },
    },
    _count: true,
  });

  let estimatedMRR = 0;
  subscriptionBreakdown.forEach((sub) => {
    const plan = sub.planType as keyof typeof planRevenue;
    estimatedMRR += (planRevenue[plan] || 0) * sub._count;
  });

  const stats = {
    totalUsers,
    activeUsers,
    trialUsers,
    totalAgents,
    totalConversations,
    totalMessages,
    activeConnections,
    monthlyMessages: monthlyUsage._sum.messagesUsed || 0,
    estimatedMRR,
    subscriptionBreakdown,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/users">
                <Button variant="outline">Manage Users</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">My Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active • {stats.trialUsers} trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                AI agents created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.estimatedMRR}</div>
              <p className="text-xs text-muted-foreground">
                Estimated MRR
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeConnections}</div>
              <p className="text-xs text-muted-foreground">
                WhatsApp connected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Total messages and conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Total Messages</span>
                </div>
                <span className="font-bold">{stats.totalMessages.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Total Conversations</span>
                </div>
                <span className="font-bold">{stats.totalConversations.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">This Month</span>
                </div>
                <span className="font-bold">{stats.monthlyMessages.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Breakdown</CardTitle>
              <CardDescription>Active subscriptions by plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.subscriptionBreakdown.map((sub: any) => (
                <div key={sub.planType} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{sub.planType}</span>
                  <span className="font-bold">{sub._count} users</span>
                </div>
              ))}
              {stats.subscriptionBreakdown.length === 0 && (
                <p className="text-sm text-muted-foreground">No active subscriptions yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Button variant="outline" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" disabled>
                <MessageSquare className="w-4 h-4 mr-2" />
                Monitor Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

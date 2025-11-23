import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard-layout";
import { DashboardWelcome } from "@/components/dashboard-welcome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Bot,
  Users,
  TrendingUp,
  Zap,
  Plus,
  Send,
  BookOpen,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Award
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      whatsappConnections: true,
      agents: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { agentKnowledge: true }
          }
        }
      },
      conversations: {
        take: 5,
        orderBy: { lastMessageAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get message usage for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  let usage = await prisma.messageUsage.findUnique({
    where: {
      userId_month: {
        userId: user.id,
        month: currentMonth,
      },
    },
  });

  // Determine correct message limit based on plan type
  const planLimits: Record<string, number> = {
    starter: 2000,
    professional: 5000,
    business: 12000,
  };

  const correctLimit = planLimits[user.planType as string] || 2000;

  // If usage doesn't exist or has wrong limit, create/update it
  if (!usage) {
    usage = await prisma.messageUsage.create({
      data: {
        userId: user.id,
        month: currentMonth,
        messagesUsed: 0,
        messageLimit: correctLimit,
      },
    });
  } else if (usage.messageLimit !== correctLimit) {
    // Update limit if plan changed
    usage = await prisma.messageUsage.update({
      where: {
        userId_month: {
          userId: user.id,
          month: currentMonth,
        },
      },
      data: {
        messageLimit: correctLimit,
      },
    });
  }

  // Get total conversations count
  const totalConversations = await prisma.conversation.count({
    where: { userId: user.id },
  });

  // Get today's active conversations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = await prisma.conversation.count({
    where: {
      userId: user.id,
      lastMessageAt: { gte: today },
    },
  });

  // Get unread messages count (messages from customers in last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const unreadConversations = await prisma.conversation.count({
    where: {
      userId: user.id,
      lastMessageAt: { gte: oneDayAgo },
      messages: {
        some: {
          senderType: 'customer',
          createdAt: { gte: oneDayAgo }
        }
      }
    }
  });

  // Get hot leads count
  const hotLeads = await prisma.conversation.count({
    where: {
      userId: user.id,
      leadScore: 'hot',
      goalAchieved: false
    }
  });

  // Get AI messages count
  const aiMessagesCount = await prisma.message.count({
    where: {
      conversation: { userId: user.id },
      senderType: "ai",
    },
  });

  const messagesUsed = usage.messagesUsed;
  const messageLimit = usage.messageLimit;
  const usagePercentage = (messagesUsed / messageLimit) * 100;

  const whatsappConnected = user.whatsappConnections.some(c => c.isConnected);

  // Calculate days until trial ends
  const daysUntilTrialEnds = user.trialEndsAt
    ? Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Admin metrics - Only fetch if user is admin
  let adminMetrics = null;
  if (user.role === 'admin') {
    // Count lifetime licenses
    const ltdLicenses = await prisma.user.count({
      where: { subscriptionStatus: 'lifetime' }
    });

    // Count active subscriptions (excluding lifetime and trials)
    const activeSubscriptions = await prisma.user.count({
      where: { subscriptionStatus: 'active' }
    });

    // Get all active users with their plan types for MRR calculation
    const activeUsers = await prisma.user.findMany({
      where: { subscriptionStatus: 'active' },
      select: { planType: true }
    });

    // Estimated MRR based on plan types (assuming monthly billing)
    // Prices: Starter=$29, Professional=$79, Business=$199
    const planPrices: Record<string, number> = {
      starter: 29,
      professional: 79,
      business: 199,
    };

    const estimatedMRR = activeUsers.reduce((total, user) => {
      return total + (planPrices[user.planType as string] || 0);
    }, 0);

    // Count LTD revenue (one-time)
    // LTD Prices: Starter=$149, Professional=$349, Business=$199
    const ltdUsers = await prisma.user.findMany({
      where: { subscriptionStatus: 'lifetime' },
      select: { planType: true }
    });

    const ltdPrices: Record<string, number> = {
      starter: 149,
      professional: 349,
      business: 199,
    };

    const totalLTDRevenue = ltdUsers.reduce((total, user) => {
      return total + (ltdPrices[user.planType as string] || 0);
    }, 0);

    adminMetrics = {
      ltdLicenses,
      totalLTDRevenue,
      activeSubscriptions,
      estimatedMRR,
    };
  }

  return (
    <DashboardLayout>
      <DashboardWelcome />
      <div className="space-y-6">
        {/* Header with Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name || "there"}! 👋</h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your WhatsApp AI today</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Trial Banner */}
        {user.subscriptionStatus === "trial" && daysUntilTrialEnds > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      🎉 Free Trial Active - {daysUntilTrialEnds} days remaining
                    </h3>
                    <p className="text-sm text-gray-600">
                      You're on the {user.planType.toUpperCase()} plan. Upgrade anytime to unlock unlimited features!
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/billing">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Metrics - Revenue Dashboard */}
        {adminMetrics && user.role === 'admin' && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Revenue Dashboard (Admin Only)
              </CardTitle>
              <CardDescription>
                Overview of lifetime licenses and monthly recurring revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* LTD Licenses */}
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Lifetime Licenses</span>
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600">{adminMetrics.ltdLicenses}</div>
                  <p className="text-xs text-gray-500 mt-1">Total sold</p>
                </div>

                {/* LTD Revenue */}
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">LTD Revenue</span>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${adminMetrics.totalLTDRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">One-time revenue</p>
                </div>

                {/* Active Subscriptions */}
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Active Subscriptions</span>
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{adminMetrics.activeSubscriptions}</div>
                  <p className="text-xs text-gray-500 mt-1">Paying monthly/yearly</p>
                </div>

                {/* Monthly Recurring Revenue */}
                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Est. MRR</span>
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${adminMetrics.estimatedMRR.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-blue-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Revenue (LTD + Annual MRR)</span>
                  <span className="font-bold text-lg text-blue-600">
                    ${(adminMetrics.totalLTDRevenue + (adminMetrics.estimatedMRR * 12)).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  LTD: ${adminMetrics.totalLTDRevenue.toLocaleString()} •
                  Projected Annual Recurring: ${(adminMetrics.estimatedMRR * 12).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unread Messages
              </CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{unreadConversations}</div>
              <Link href="/dashboard/conversations">
                <p className="text-xs text-blue-600 mt-2 hover:underline cursor-pointer">
                  View all conversations →
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Hot Leads
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{hotLeads}</div>
              <p className="text-xs text-gray-600 mt-2">
                Need follow-up
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Today
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeToday}</div>
              <p className="text-xs text-gray-600 mt-2">
                Total: {totalConversations}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI Messages
              </CardTitle>
              <Bot className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{aiMessagesCount}</div>
              <p className="text-xs text-gray-600 mt-2">
                {messagesUsed} / {messageLimit.toLocaleString()} this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Message Usage This Month</CardTitle>
              <CardDescription>
                You've used {messagesUsed} of {messageLimit.toLocaleString()} messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={usagePercentage}
                className={`h-3 mb-2 ${usagePercentage > 80 ? 'bg-red-100' : ''}`}
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{messagesUsed.toLocaleString()} used</span>
                <span>{usagePercentage.toFixed(0)}%</span>
              </div>
              {usagePercentage > 80 && (
                <div className="mt-4 bg-orange-50 border border-orange-200 p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Running low on messages</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Consider upgrading your plan to avoid interruptions
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Connection</CardTitle>
              <CardDescription>Manage your WhatsApp integration</CardDescription>
            </CardHeader>
            <CardContent>
              {whatsappConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-green-800">Connected & Active</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📱 {user.whatsappConnections[0]?.phoneNumber || "Connected"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active: {user.whatsappConnections[0]?.lastActive
                          ? new Date(user.whatsappConnections[0].lastActive).toLocaleString()
                          : "Recently"}
                      </p>
                    </div>
                    <Link href="/dashboard/whatsapp">
                      <Button variant="outline" size="sm">Manage</Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>AI is ready to respond to messages</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-semibold text-yellow-800">Not Connected</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your WhatsApp to start receiving and replying to messages automatically
                    </p>
                    <Link href="/dashboard/whatsapp">
                      <Button className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        Connect WhatsApp Now
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>Your latest customer interactions</CardDescription>
              </div>
              <Link href="/dashboard/conversations">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {user.conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-sm mb-4">Connect WhatsApp to start chatting with customers</p>
                {!whatsappConnected && (
                  <Link href="/dashboard/whatsapp">
                    <Button>
                      <Zap className="h-4 w-4 mr-2" />
                      Connect WhatsApp
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {user.conversations.map((conversation) => {
                  const lastMessage = conversation.messages[0];
                  const isCustomerMessage = lastMessage?.senderType === 'customer';

                  return (
                    <Link
                      key={conversation.id}
                      href="/dashboard/conversations"
                      className="block p-4 border rounded-lg hover:bg-gray-50 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {conversation.customerName || conversation.customerPhone}
                            </h3>
                            {isCustomerMessage && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {isCustomerMessage ? '💬 ' : '🤖 '}
                              {lastMessage.messageText || 'Media message'}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(conversation.lastMessageAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {conversation.aiEnabled && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                🤖 {conversation.aiMode}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              conversation.leadScore === "hot"
                                ? "bg-red-100 text-red-700"
                                : conversation.leadScore === "warm"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              🔥 {conversation.leadScore.toUpperCase()}
                            </span>
                          </div>
                          <Progress value={conversation.engagementScore} className="w-20 h-2" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Agents */}
        {user.agents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active AI Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.agents.map((agent) => (
                  <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
                    <div className="p-4 border rounded-lg hover:shadow-md hover:border-blue-500 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{agent.name}</h3>
                          <p className="text-xs text-gray-500">{agent.businessType || 'General'}</p>
                        </div>
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {agent.description || 'No description'}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {agent.aiTone}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {agent._count.agentKnowledge} knowledge items
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

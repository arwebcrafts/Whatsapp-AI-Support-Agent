import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Bot, Users, TrendingUp } from "lucide-react";
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
      conversations: {
        take: 5,
        orderBy: { lastMessageAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Redirect admins to admin panel
  if (user.role === 'admin') {
    redirect("/admin");
  }

  // Get message usage for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = await prisma.messageUsage.findUnique({
    where: {
      userId_month: {
        userId: user.id,
        month: currentMonth,
      },
    },
  });

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

  // Get AI messages count
  const aiMessagesCount = await prisma.message.count({
    where: {
      conversation: { userId: user.id },
      senderType: "ai",
    },
  });

  const messagesUsed = usage?.messagesUsed || 0;
  const messageLimit = usage?.messageLimit || 2000;
  const usagePercentage = (messagesUsed / messageLimit) * 100;

  const whatsappConnected = user.whatsappConnections.some(c => c.isConnected);

  // Calculate days until trial ends
  const daysUntilTrialEnds = user.trialEndsAt
    ? Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name || "there"}!</p>
        </div>

        {/* Trial Banner */}
        {user.subscriptionStatus === "trial" && daysUntilTrialEnds > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Free Trial - {daysUntilTrialEnds} days remaining
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upgrade to continue using WhaSales AI after your trial ends
                  </p>
                </div>
                <Link href="/dashboard/billing">
                  <Button>Upgrade Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Chats
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                AI Messages
              </CardTitle>
              <Bot className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiMessagesCount}</div>
              <p className="text-xs text-gray-600">
                {messagesUsed} / {messageLimit.toLocaleString()} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Today
              </CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeToday}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--%</div>
              <p className="text-xs text-gray-600">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Message Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Message Usage This Month</CardTitle>
            <CardDescription>
              You've used {messagesUsed} of {messageLimit.toLocaleString()} messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={usagePercentage} className="h-3 mb-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{messagesUsed.toLocaleString()} used</span>
              <span>{usagePercentage.toFixed(0)}%</span>
            </div>
            {usagePercentage > 80 && (
              <div className="mt-4 bg-orange-50 p-3 rounded-md">
                <p className="text-sm text-orange-800">
                  ⚠️ You're running low on messages. Consider upgrading your plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            {whatsappConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold">Connected</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Phone: {user.whatsappConnections[0]?.phoneNumber || "Connected"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last active: {user.whatsappConnections[0]?.lastActive
                        ? new Date(user.whatsappConnections[0].lastActive).toLocaleString()
                        : "Recently"}
                    </p>
                  </div>
                  <Link href="/dashboard/whatsapp">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-semibold">Not Connected</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your WhatsApp to start receiving and replying to messages
                  </p>
                  <Link href="/dashboard/whatsapp">
                    <Button>Connect WhatsApp</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Conversations</CardTitle>
              <Link href="/dashboard/conversations">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {user.conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Connect WhatsApp to start chatting with customers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/conversations/${conversation.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {conversation.customerName || conversation.customerPhone}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(conversation.lastMessageAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conversation.aiEnabled && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            🤖 AI
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          conversation.leadScore === "hot"
                            ? "bg-red-100 text-red-700"
                            : conversation.leadScore === "warm"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {conversation.leadScore.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

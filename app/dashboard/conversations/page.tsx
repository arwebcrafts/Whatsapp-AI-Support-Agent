import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { MessageSquare, Search, TrendingUp } from "lucide-react";

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

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Conversations</h1>
            <p className="text-gray-600">Manage all your WhatsApp conversations</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-gray-600">
                  Connect WhatsApp to start receiving messages
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const lastMessage = conversation.messages[0];
                  const engagementScore = conversation.engagementScore || 0;
                  const conversationGoal = conversation.conversationGoal || 'info';

                  // Determine progress bar color based on score
                  const getProgressColor = (score: number) => {
                    if (score >= 61) return 'bg-green-500';
                    if (score >= 31) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };

                  // Goal type labels with emojis
                  const goalLabels: any = {
                    booking: '📅 Booking',
                    buying: '🛒 Purchase',
                    'follow-up': '🔄 Follow-up',
                    support: '🛟 Support',
                    info: '💡 Info'
                  };

                  return (
                    <Link
                      key={conversation.id}
                      href={`/dashboard/conversations/${conversation.id}`}
                      className="block"
                    >
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {conversation.customerName || conversation.customerPhone}
                              </h3>
                              {conversation.aiEnabled && (
                                <Badge variant="secondary" className="text-xs">
                                  🤖 AI
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  conversation.leadScore === "hot"
                                    ? "destructive"
                                    : conversation.leadScore === "warm"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {conversation.leadScore.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {goalLabels[conversationGoal]}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {lastMessage?.messageText || "No messages yet"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(conversation.lastMessageAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Engagement Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                              <span className="text-xs font-medium text-gray-600">
                                Engagement
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {engagementScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(engagementScore)}`}
                              style={{ width: `${engagementScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

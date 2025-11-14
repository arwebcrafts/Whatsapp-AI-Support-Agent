import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";

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

                  return (
                    <Link
                      key={conversation.id}
                      href={`/dashboard/conversations/${conversation.id}`}
                      className="block"
                    >
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
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

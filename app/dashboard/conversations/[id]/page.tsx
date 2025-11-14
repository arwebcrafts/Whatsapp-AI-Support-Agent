"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversation();
    const interval = setInterval(loadConversation, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  async function loadConversation() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: newMessage,
        }),
      });

      setNewMessage("");
      await loadConversation();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAI(enabled: boolean) {
    try {
      await fetch(`/api/conversations/${conversationId}/toggle-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: enabled }),
      });
      await loadConversation();
    } catch (error) {
      console.error("Error toggling AI:", error);
    }
  }

  async function updateLeadScore(score: string) {
    try {
      await fetch(`/api/conversations/${conversationId}/update-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadScore: score }),
      });
      await loadConversation();
    } catch (error) {
      console.error("Error updating lead score:", error);
    }
  }

  if (!conversation) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/conversations">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {conversation.customerName || conversation.customerPhone}
            </h1>
            <p className="text-sm text-gray-600">{conversation.customerPhone}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                conversation.leadScore === "hot"
                  ? "destructive"
                  : conversation.leadScore === "warm"
                  ? "default"
                  : "secondary"
              }
            >
              {conversation.leadScore.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-toggle" className="text-sm">
                      AI Auto-Reply
                    </Label>
                    <Switch
                      id="ai-toggle"
                      checked={conversation.aiEnabled}
                      onCheckedChange={toggleAI}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderType === "customer" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderType === "customer"
                            ? "bg-gray-100"
                            : message.senderType === "ai"
                            ? "bg-green-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.senderType === "ai" && (
                            <Bot className="h-3 w-3 text-green-600" />
                          )}
                          {message.senderType === "user" && (
                            <User className="h-3 w-3 text-blue-600" />
                          )}
                          <span className="text-xs font-semibold">
                            {message.senderType === "customer"
                              ? "Customer"
                              : message.senderType === "ai"
                              ? "AI Agent"
                              : "You"}
                          </span>
                        </div>
                        <p className="text-sm">{message.messageText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={loading}
                  />
                  <Button onClick={sendMessage} disabled={loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Name</Label>
                  <p className="font-medium">
                    {conversation.customerName || "Unknown"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Phone</Label>
                  <p className="font-medium">{conversation.customerPhone}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Last Active</Label>
                  <p className="text-sm">
                    {new Date(conversation.lastMessageAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["hot", "warm", "cold"].map((score) => (
                    <Button
                      key={score}
                      variant={conversation.leadScore === score ? "default" : "outline"}
                      className="w-full"
                      onClick={() => updateLeadScore(score)}
                    >
                      {score.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  Export Chat
                </Button>
                <Button variant="outline" className="w-full">
                  Add Notes
                </Button>
                <Button variant="destructive" className="w-full">
                  Block Contact
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

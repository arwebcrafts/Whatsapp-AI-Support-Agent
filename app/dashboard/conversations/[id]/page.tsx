"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Bot, User, Phone, Video, MoreVertical, Check, CheckCheck, Smile, Paperclip, Mic, Sparkles, ThumbsUp, X } from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
    const interval = setInterval(loadConversation, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  async function updateAiMode(mode: string) {
    try {
      await fetch(`/api/conversations/${conversationId}/update-ai-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiMode: mode }),
      });
      await loadConversation();
    } catch (error) {
      console.error("Error updating AI mode:", error);
    }
  }

  async function getAiSuggestion() {
    setLoadingSuggestion(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/suggest`, {
        method: "POST",
      });
      const data = await res.json();
      setAiSuggestion(data.suggestion);
      setNewMessage(data.suggestion);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
    } finally {
      setLoadingSuggestion(false);
    }
  }

  function acceptSuggestion() {
    if (aiSuggestion) {
      setNewMessage(aiSuggestion);
      setAiSuggestion(null);
    }
  }

  function dismissSuggestion() {
    setAiSuggestion(null);
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#E5DDD5]">
        {/* WhatsApp-Style Header */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3 flex-1">
            <Link href="/dashboard/conversations">
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E]">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            {/* Profile Picture */}
            <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-semibold text-lg">
              {conversation.customerName?.[0]?.toUpperCase() || conversation.customerPhone?.[0]}
            </div>

            {/* Contact Info */}
            <div className="flex-1">
              <h2 className="font-semibold text-base">
                {conversation.customerName || conversation.customerPhone}
              </h2>
              <p className="text-xs text-gray-200">
                {conversation.customerPhone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                conversation.leadScore === "hot"
                  ? "bg-red-500"
                  : conversation.leadScore === "warm"
                  ? "bg-orange-500"
                  : "bg-blue-500"
              } text-white`}
            >
              {conversation.leadScore.toUpperCase()}
            </Badge>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E]">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E]">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E]">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Settings Bar */}
        <div className="bg-[#F0F2F5] px-4 py-3 border-b border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="ai-toggle" className="text-sm font-medium text-gray-700">
                  🤖 AI Enabled
                </Label>
                <Switch
                  id="ai-toggle"
                  checked={conversation.aiEnabled}
                  onCheckedChange={toggleAI}
                />
              </div>

              {/* AI Mode Selection */}
              {conversation.aiEnabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Mode:</Label>
                  <select
                    value={conversation.aiMode || 'auto'}
                    onChange={(e) => updateAiMode(e.target.value)}
                    className="text-xs px-2 py-1 border rounded-md bg-white"
                  >
                    <option value="auto">⚡ Auto-Reply</option>
                    <option value="copilot">✨ Co-Pilot</option>
                    <option value="manual">👤 Manual Only</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {["hot", "warm", "cold"].map((score) => (
                <Button
                  key={score}
                  variant={conversation.leadScore === score ? "default" : "outline"}
                  size="sm"
                  className={`text-xs ${
                    conversation.leadScore === score
                      ? score === "hot"
                        ? "bg-red-500 hover:bg-red-600"
                        : score === "warm"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-blue-500 hover:bg-blue-600"
                      : ""
                  }`}
                  onClick={() => updateLeadScore(score)}
                >
                  {score.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Co-Pilot Info Banner */}
          {conversation.aiEnabled && conversation.aiMode === 'copilot' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              <p className="text-xs text-blue-800">
                ✨ <strong>Co-Pilot Mode:</strong> Click "Get AI Suggestion" to see what the AI recommends. You can edit before sending.
              </p>
            </div>
          )}
        </div>

        {/* Messages Area - WhatsApp Style */}
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#E5DDD5] space-y-3"
             style={{
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 10 L90 90 M90 10 L10 90\' stroke=\'%23D1D7DB\' stroke-width=\'0.5\' opacity=\'0.2\'/%3E%3C/svg%3E")',
               backgroundSize: '100px 100px'
             }}>
          {messages.map((message, index) => {
            const isCustomer = message.senderType === "customer";
            const isAI = message.senderType === "ai";
            const isUser = message.senderType === "user";

            return (
              <div
                key={message.id}
                className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-2`}
              >
                <div
                  className={`relative max-w-[75%] md:max-w-[60%] rounded-lg px-3 py-2 shadow-sm ${
                    isCustomer
                      ? "bg-white"
                      : "bg-[#DCF8C6]"
                  }`}
                  style={{
                    borderRadius: isCustomer ? "0px 8px 8px 8px" : "8px 0px 8px 8px"
                  }}
                >
                  {/* Sender Badge for AI/User */}
                  {!isCustomer && (
                    <div className="flex items-center gap-1 mb-1">
                      {isAI ? (
                        <>
                          <Bot className="h-3 w-3 text-green-700" />
                          <span className="text-[10px] font-semibold text-green-700">AI Agent</span>
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 text-blue-700" />
                          <span className="text-[10px] font-semibold text-blue-700">You</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="text-[14.2px] leading-[19px] text-gray-900 break-words whitespace-pre-wrap">
                    {message.messageText}
                  </p>

                  {/* Timestamp and Status */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-gray-600">
                      {formatTime(message.createdAt)}
                    </span>
                    {!isCustomer && (
                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </div>

                  {/* WhatsApp Bubble Tail */}
                  <div
                    className={`absolute top-0 ${
                      isCustomer ? "-left-2" : "-right-2"
                    }`}
                    style={{
                      width: 0,
                      height: 0,
                      borderStyle: "solid",
                      borderWidth: isCustomer ? "0 0 10px 10px" : "0 10px 10px 0",
                      borderColor: isCustomer
                        ? "transparent transparent white transparent"
                        : "transparent #DCF8C6 transparent transparent",
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - WhatsApp Style */}
        <div className="bg-[#F0F2F5] px-4 py-3 border-t border-gray-300">
          {/* Co-Pilot Suggestion Button */}
          {conversation.aiMode === 'copilot' && !aiSuggestion && (
            <div className="mb-2">
              <Button
                onClick={getAiSuggestion}
                disabled={loadingSuggestion}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loadingSuggestion ? "Generating..." : "Get AI Suggestion"}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 h-10 w-10">
              <Smile className="h-6 w-6" />
            </Button>

            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 h-10 w-10">
              <Paperclip className="h-6 w-6" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder={conversation.aiMode === 'copilot' ? "Type or use AI suggestion..." : "Type a message"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={loading}
                className="rounded-full bg-white border-none shadow-sm pl-4 pr-12 py-6 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {newMessage.trim() ? (
              <Button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-full bg-[#25D366] hover:bg-[#20BD5B] h-12 w-12 p-0 shadow-md"
              >
                <Send className="h-5 w-5 text-white" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 h-10 w-10">
                <Mic className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Bot, User, Phone, Video, MoreVertical, Check, CheckCheck, Smile, Paperclip, Mic, Sparkles, ThumbsUp, X, Tag, Plus, AlertCircle } from "lucide-react";
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
    const interval = setInterval(loadConversation, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear message input and errors when conversation changes
  useEffect(() => {
    setNewMessage("");
    setSendError(null);
    setAiSuggestion(null);
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadConversation() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages);

      // Parse tags from JSON string
      if (data.conversation?.tags) {
        try {
          const parsedTags = JSON.parse(data.conversation.tags);
          setTags(Array.isArray(parsedTags) ? parsedTags : []);
        } catch {
          setTags([]);
        }
      } else {
        setTags([]);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    setLoading(true);
    setSendError(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: newMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show error to user
        setSendError(data.message || "Failed to send message");
        console.error("Send message failed:", data);
        return;
      }

      setNewMessage("");
      setSendError(null);
      await loadConversation();
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError("Network error. Please check your connection and try again.");
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

  async function addTag() {
    if (!newTag.trim() || tags.includes(newTag.trim())) {
      setNewTag("");
      return;
    }

    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag("");
    setShowTagInput(false);

    try {
      await fetch(`/api/conversations/${conversationId}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      // Revert on error
      setTags(tags);
    }
  }

  async function removeTag(tagToRemove: string) {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);

    try {
      await fetch(`/api/conversations/${conversationId}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
    } catch (error) {
      console.error("Error removing tag:", error);
      // Revert on error
      setTags(tags);
    }
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
        <div className="bg-[#075E54] text-white px-2 md:px-4 py-2 md:py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Link href="/dashboard/conversations">
              <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E] h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>

            {/* Profile Picture */}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-semibold text-sm md:text-lg flex-shrink-0">
              {conversation.customerName?.[0]?.toUpperCase() || conversation.customerPhone?.[0]}
            </div>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm md:text-base truncate">
                {conversation.customerName || conversation.customerPhone}
              </h2>
              <p className="text-xs text-gray-200 truncate hidden md:block">
                {conversation.customerPhone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <Badge
              className={`${
                conversation.leadScore === "hot"
                  ? "bg-red-500"
                  : conversation.leadScore === "warm"
                  ? "bg-orange-500"
                  : "bg-blue-500"
              } text-white text-xs px-1.5 md:px-2`}
            >
              {conversation.leadScore.toUpperCase()}
            </Badge>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E] h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
              <Video className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E] h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
              <Phone className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#128C7E] h-8 w-8 md:h-10 md:w-10">
              <MoreVertical className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>

        {/* Settings Bar */}
        <div className="bg-[#F0F2F5] px-3 md:px-4 py-2 md:py-3 border-b border-gray-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-2 md:mb-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="ai-toggle" className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
                  🤖 AI
                </Label>
                <Switch
                  id="ai-toggle"
                  checked={conversation.aiEnabled}
                  onCheckedChange={toggleAI}
                />
              </div>

              {/* AI Mode Selection */}
              {conversation.aiEnabled && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Label className="text-xs md:text-sm font-medium text-gray-700 hidden md:inline">Mode:</Label>
                  <select
                    value={conversation.aiMode || 'auto'}
                    onChange={(e) => updateAiMode(e.target.value)}
                    className="text-xs px-1.5 md:px-2 py-0.5 md:py-1 border rounded-md bg-white"
                  >
                    <option value="auto">⚡ Auto</option>
                    <option value="copilot">✨ Co-Pilot</option>
                    <option value="manual">👤 Manual</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-1.5 md:gap-2">
              {["hot", "warm", "cold"].map((score) => (
                <Button
                  key={score}
                  variant={conversation.leadScore === score ? "default" : "outline"}
                  size="sm"
                  className={`text-xs px-2 md:px-3 ${
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

          {/* Tags Section */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Label className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1">
              <Tag className="h-3 w-3 md:h-4 md:w-4" />
              Tags:
            </Label>

            {/* Lead Score Tag */}
            <Badge
              className={`${
                conversation.leadScore === "hot"
                  ? "bg-red-100 text-red-800"
                  : conversation.leadScore === "warm"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-blue-100 text-blue-800"
              } px-2 py-0.5 text-xs`}
            >
              {conversation.leadScore.toUpperCase()}
            </Badge>

            {/* AI Mode Tag */}
            <Badge className="bg-green-100 text-green-800 px-2 py-0.5 text-xs">
              {conversation.aiMode === 'auto' && '⚡ Auto'}
              {conversation.aiMode === 'copilot' && '✨ Co-Pilot'}
              {conversation.aiMode === 'manual' && '👤 Manual'}
            </Badge>

            {/* Custom Tags */}
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="h-3 w-3" />
              </Badge>
            ))}

            {showTagInput ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  placeholder="Tag name..."
                  className="h-6 w-24 md:w-32 text-xs px-2"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={addTag}
                  className="h-6 px-2 text-xs"
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowTagInput(false);
                    setNewTag("");
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTagInput(true)}
                className="h-6 px-2 text-xs flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Tag
              </Button>
            )}
          </div>

          {/* Co-Pilot Info Banner */}
          {conversation.aiEnabled && conversation.aiMode === 'copilot' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-2 md:px-3 py-1.5 md:py-2">
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
        <div className="bg-[#F0F2F5] px-2 md:px-4 py-2 md:py-3 border-t border-gray-300">
          {/* Error Message */}
          {sendError && (
            <div className="mb-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{sendError}</p>
                <button
                  onClick={() => setSendError(null)}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Co-Pilot Suggestion Button */}
          {conversation.aiMode === 'copilot' && !aiSuggestion && (
            <div className="mb-2">
              <Button
                onClick={getAiSuggestion}
                disabled={loadingSuggestion}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600 text-xs md:text-sm"
              >
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                {loadingSuggestion ? "Generating..." : "Get AI Suggestion"}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1.5 md:gap-2">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
              <Smile className="h-5 w-5 md:h-6 md:w-6" />
            </Button>

            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 h-8 w-8 md:h-10 md:w-10 hidden sm:flex">
              <Paperclip className="h-5 w-5 md:h-6 md:w-6" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder={conversation.aiMode === 'copilot' ? "Type or use AI..." : "Type a message"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={loading}
                className="rounded-full bg-white border-none shadow-sm pl-3 md:pl-4 pr-3 md:pr-12 py-5 md:py-6 text-sm md:text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {newMessage.trim() ? (
              <Button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-full bg-[#25D366] hover:bg-[#20BD5B] h-10 w-10 md:h-12 md:w-12 p-0 shadow-md flex-shrink-0"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 h-8 w-8 md:h-10 md:w-10">
                <Mic className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

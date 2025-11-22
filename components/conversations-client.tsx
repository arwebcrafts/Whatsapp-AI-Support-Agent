"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search,
  MessageSquare,
  Send,
  Sparkles,
  Flame,
  TrendingUp,
  StickyNote,
  Bot,
  Save,
  Star,
  Tag,
  Plus,
  X,
  Check,
  CheckCheck,
  AlertCircle,
  User,
  Loader2
} from "lucide-react";

interface Conversation {
  id: string;
  customerName: string | null;
  customerPhone: string;
  leadScore: string;
  engagementScore: number;
  conversationGoal: string;
  aiEnabled: boolean;
  aiMode: string;
  lastMessageAt: string;
  messages: Message[];
  notes?: string | null;
  tags?: string | null;
}

interface Message {
  id: string;
  senderType: string;
  messageText: string;
  createdAt: string;
}

export default function ConversationsClientNew({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingMode, setUpdatingMode] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages]);

  // Load notes and tags when conversation changes
  useEffect(() => {
    if (selectedConv) {
      setNotes(selectedConv.notes || "");
      if (selectedConv.tags) {
        try {
          const parsedTags = JSON.parse(selectedConv.tags);
          setTags(Array.isArray(parsedTags) ? parsedTags : []);
        } catch {
          setTags([]);
        }
      } else {
        setTags([]);
      }
      setNewMessage("");
      setSendError(null);
      setAiSuggestion("");
    }
  }, [selectedConv?.id]);

  // Real-time polling for messages
  useEffect(() => {
    if (!selectedConv) return;

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${selectedConv.id}`);
        const data = await res.json();
        if (res.ok) {
          setSelectedConv(data.conversation);
          // Update in conversations list too
          setConversations(conversations.map(c =>
            c.id === selectedConv.id ? { ...c, messages: data.messages } : c
          ));
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    const interval = setInterval(pollMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [selectedConv?.id, conversations]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    (conv.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    conv.customerPhone.includes(searchQuery)
  );

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    setSendingMessage(true);
    setSendError(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: newMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.message || "Failed to send message");
        return;
      }

      setNewMessage("");
      setSendError(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError("Network error. Please check your connection.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Update AI mode
  const updateAiMode = async (mode: string) => {
    if (!selectedConv) return;

    setUpdatingMode(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/update-ai-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiMode: mode }),
      });

      if (res.ok) {
        setSelectedConv({ ...selectedConv, aiMode: mode });
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, aiMode: mode } : c
        ));
      }
    } catch (error) {
      console.error("Error updating AI mode:", error);
    } finally {
      setUpdatingMode(false);
    }
  };

  // Toggle AI
  const toggleAI = async (enabled: boolean) => {
    if (!selectedConv) return;

    try {
      await fetch(`/api/conversations/${selectedConv.id}/toggle-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: enabled }),
      });
      setSelectedConv({ ...selectedConv, aiEnabled: enabled });
      setConversations(conversations.map(c =>
        c.id === selectedConv.id ? { ...c, aiEnabled: enabled } : c
      ));
    } catch (error) {
      console.error("Error toggling AI:", error);
    }
  };

  // Update lead score
  const updateLeadScore = async (score: string) => {
    if (!selectedConv) return;

    try {
      await fetch(`/api/conversations/${selectedConv.id}/update-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadScore: score }),
      });
      setSelectedConv({ ...selectedConv, leadScore: score });
      setConversations(conversations.map(c =>
        c.id === selectedConv.id ? { ...c, leadScore: score } : c
      ));
    } catch (error) {
      console.error("Error updating lead score:", error);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedConv) return;

    setSavingNotes(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, notes } : c
        ));
        setSelectedConv({ ...selectedConv, notes });
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSavingNotes(false);
    }
  };

  // Get AI suggestion
  const getAiSuggestion = async () => {
    if (!selectedConv) return;

    setLoadingSuggestion(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/suggest`, {
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
  };

  // Add tag
  const addTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim()) || !selectedConv) {
      setNewTag("");
      return;
    }

    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag("");
    setShowTagInput(false);

    try {
      await fetch(`/api/conversations/${selectedConv.id}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      setTags(tags);
    }
  };

  // Remove tag
  const removeTag = async (tagToRemove: string) => {
    if (!selectedConv) return;

    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);

    try {
      await fetch(`/api/conversations/${selectedConv.id}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
    } catch (error) {
      console.error("Error removing tag:", error);
      setTags(tags);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* LEFT: Conversation List (25%) */}
      <div className="w-[25%] border-r border-gray-200 bg-white flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-4 text-left hover:bg-blue-50 transition-all duration-200 border-l-4 ${
                    selectedConv?.id === conv.id
                      ? "bg-blue-50 border-l-blue-600 shadow-sm"
                      : "border-l-transparent hover:border-l-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <h3 className={`font-semibold text-sm truncate ${
                          selectedConv?.id === conv.id ? "text-blue-900" : "text-gray-900"
                        }`}>
                          {conv.customerName || conv.customerPhone}
                        </h3>

                        {/* Lead Temperature Icon */}
                        {conv.leadScore === "hot" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 rounded" title="Hot Lead">
                            <Flame className="h-3 w-3 text-red-600 flex-shrink-0" />
                          </div>
                        )}
                        {conv.leadScore === "warm" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 rounded" title="Warm Lead">
                            <TrendingUp className="h-3 w-3 text-orange-600 flex-shrink-0" />
                          </div>
                        )}
                        {conv.leadScore === "cold" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded" title="Cold Lead">
                            <Star className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          </div>
                        )}

                        {/* AI Mode Icon */}
                        {conv.aiEnabled && conv.aiMode === "auto" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 rounded" title="AI Auto Mode">
                            <Bot className="h-3 w-3 text-green-700 flex-shrink-0" />
                          </div>
                        )}
                        {conv.aiEnabled && conv.aiMode === "copilot" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 rounded" title="Co-Pilot Mode">
                            <Sparkles className="h-3 w-3 text-purple-700 flex-shrink-0" />
                          </div>
                        )}
                        {(!conv.aiEnabled || conv.aiMode === "manual") && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded" title="Manual Mode">
                            <span className="text-[10px] font-medium text-gray-700">✋</span>
                          </div>
                        )}

                        {/* Custom Tags */}
                        {conv.tags && (() => {
                          try {
                            const parsedTags = JSON.parse(conv.tags);
                            return Array.isArray(parsedTags) && parsedTags.length > 0 ? (
                              parsedTags.slice(0, 2).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0">
                                  {tag}
                                </Badge>
                              ))
                            ) : null;
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {conv.messages[conv.messages.length - 1]?.messageText || "No messages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Chat Area (55%) */}
      <div className="w-[55%] flex flex-col bg-[#E5DDD5]">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-center px-6 bg-white">
            <div>
              <MessageSquare className="h-20 w-20 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a customer from the list to view their messages
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* WhatsApp-Style Header */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Profile Picture */}
                <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-semibold text-lg flex-shrink-0">
                  {selectedConv.customerName?.[0]?.toUpperCase() || selectedConv.customerPhone?.[0]}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base truncate">
                    {selectedConv.customerName || selectedConv.customerPhone}
                  </h2>
                  <p className="text-xs text-gray-200 truncate">
                    {selectedConv.customerPhone}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  className={`${
                    selectedConv.leadScore === "hot"
                      ? "bg-red-500"
                      : selectedConv.leadScore === "warm"
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  } text-white text-xs px-2`}
                >
                  {selectedConv.leadScore.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Settings Bar */}
            <div className="bg-[#F0F2F5] px-4 py-3 border-b border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-toggle" className="text-sm font-medium text-gray-700">
                      🤖 AI
                    </Label>
                    <Switch
                      id="ai-toggle"
                      checked={selectedConv.aiEnabled}
                      onCheckedChange={toggleAI}
                    />
                  </div>

                  {/* AI Mode Selection */}
                  {selectedConv.aiEnabled && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-gray-700">Mode:</Label>
                      <select
                        value={selectedConv.aiMode || 'auto'}
                        onChange={(e) => updateAiMode(e.target.value)}
                        disabled={updatingMode}
                        className="text-sm px-2 py-1 border rounded-md bg-white"
                      >
                        <option value="auto">⚡ Auto</option>
                        <option value="copilot">✨ Co-Pilot</option>
                        <option value="manual">👤 Manual</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {["hot", "warm", "cold"].map((score) => (
                    <Button
                      key={score}
                      variant={selectedConv.leadScore === score ? "default" : "outline"}
                      size="sm"
                      className={`text-xs px-3 ${
                        selectedConv.leadScore === score
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
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Tags:
                </Label>

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
                      className="h-6 w-32 text-xs px-2"
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
              {selectedConv.aiEnabled && selectedConv.aiMode === 'copilot' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mt-2">
                  <p className="text-xs text-blue-800">
                    ✨ <strong>Co-Pilot Mode:</strong> Click "Get AI Suggestion" to see what the AI recommends.
                  </p>
                </div>
              )}
            </div>

            {/* Messages Area - WhatsApp Style */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3"
                 style={{
                   backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 10 L90 90 M90 10 L10 90\' stroke=\'%23D1D7DB\' stroke-width=\'0.5\' opacity=\'0.2\'/%3E%3C/svg%3E")',
                   backgroundSize: '100px 100px'
                 }}>
              {selectedConv.messages.map((message) => {
                const isCustomer = message.senderType === "customer";
                const isAI = message.senderType === "ai";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-2`}
                  >
                    <div
                      className={`relative max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
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
                          {formatMessageTime(message.createdAt)}
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
              {selectedConv.aiMode === 'copilot' && !aiSuggestion && (
                <div className="mb-2">
                  <Button
                    onClick={getAiSuggestion}
                    disabled={loadingSuggestion}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600"
                  >
                    {loadingSuggestion ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get AI Suggestion
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={selectedConv.aiMode === 'copilot' ? "Type or use AI..." : "Type a message"}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={sendingMessage}
                    className="rounded-full bg-white border-none shadow-sm pl-4 pr-12 py-6 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {newMessage.trim() ? (
                  <Button
                    onClick={sendMessage}
                    disabled={sendingMessage}
                    className="rounded-full bg-[#25D366] hover:bg-[#20BD5B] h-12 w-12 p-0 shadow-md flex-shrink-0"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 text-white" />
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT: Lead Info Panel (20%) */}
      <div className="w-[20%] border-l border-gray-200 bg-white overflow-y-auto">
        {!selectedConv ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Select a conversation to view details
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Engagement Progress */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Engagement
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{selectedConv.engagementScore}%</span>
                </div>
                <Progress value={selectedConv.engagementScore} className="h-1.5" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <StickyNote className="h-3.5 w-3.5" />
                Notes
              </h3>
              <Textarea
                placeholder="Add notes about this lead..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] text-xs"
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="w-full mt-2 h-7 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

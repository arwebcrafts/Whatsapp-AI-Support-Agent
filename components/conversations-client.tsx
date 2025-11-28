"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  ThumbsUp,
  Star,
  X,
  Plus,
  Tag as TagIcon
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

export default function ConversationsClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingMode, setUpdatingMode] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fullMessages, setFullMessages] = useState<Message[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [fullMessages]);

  // Load full messages when conversation is selected
  useEffect(() => {
    if (selectedConv) {
      loadFullMessages(selectedConv.id);
      setNotes(selectedConv.notes || "");
      setRating(0);
      setFeedbackSubmitted(false);

      // Parse tags from JSON string
      try {
        const parsedTags = selectedConv.tags ? JSON.parse(selectedConv.tags) : [];
        setTags(Array.isArray(parsedTags) ? parsedTags : []);
      } catch {
        setTags([]);
      }
    }
  }, [selectedConv?.id]);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (!selectedConv) return;

    const interval = setInterval(() => {
      loadFullMessages(selectedConv.id, true); // Silent refresh
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  // Load full messages for selected conversation
  const loadFullMessages = async (conversationId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setFullMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Filter conversations based on search
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

  // Send message
  const handleSendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: newMessage,
        }),
      });

      if (res.ok) {
        setNewMessage("");
        // Immediately refresh messages
        await loadFullMessages(selectedConv.id);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
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
      alert("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Update AI mode
  const handleUpdateAiMode = async (mode: string) => {
    if (!selectedConv) return;

    setUpdatingMode(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiMode: mode }),
      });

      if (res.ok) {
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, aiMode: mode, aiEnabled: true } : c
        ));
        setSelectedConv({ ...selectedConv, aiMode: mode, aiEnabled: true });
      }
    } catch (error) {
      console.error("Error updating AI mode:", error);
      alert("Failed to update AI mode");
    } finally {
      setUpdatingMode(false);
    }
  };

  // Update lead score
  const handleUpdateLeadScore = async (score: string) => {
    if (!selectedConv) return;

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/update-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadScore: score }),
      });

      if (res.ok) {
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, leadScore: score } : c
        ));
        setSelectedConv({ ...selectedConv, leadScore: score });
      }
    } catch (error) {
      console.error("Error updating lead score:", error);
    }
  };

  // Add tag
  const handleAddTag = async () => {
    if (!selectedConv || !newTag.trim() || tags.length >= 10) return;

    const updatedTags = [...tags, newTag.trim()];
    setAddingTag(true);

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });

      if (res.ok) {
        setTags(updatedTags);
        setNewTag("");
        const tagsJson = JSON.stringify(updatedTags);
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, tags: tagsJson } : c
        ));
        setSelectedConv({ ...selectedConv, tags: tagsJson });
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setAddingTag(false);
    }
  };

  // Remove tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedConv) return;

    const updatedTags = tags.filter(t => t !== tagToRemove);

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/update-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });

      if (res.ok) {
        setTags(updatedTags);
        const tagsJson = JSON.stringify(updatedTags);
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, tags: tagsJson } : c
        ));
        setSelectedConv({ ...selectedConv, tags: tagsJson });
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async (feedbackRating: number) => {
    if (!selectedConv) return;

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          agentId: null,
          rating: feedbackRating,
          feedbackType: feedbackRating >= 4 ? 'positive' : feedbackRating >= 2 ? 'neutral' : 'negative'
        }),
      });

      if (res.ok) {
        setRating(feedbackRating);
        setFeedbackSubmitted(true);

        await fetch("/api/conversation-analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConv.id,
            triggerLearning: false
          }),
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback");
    }
  };

  // Get AI suggestion for co-pilot mode
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!selectedConv || selectedConv.aiMode !== 'copilot') {
        setAiSuggestion("");
        return;
      }

      setLoadingSuggestion(true);
      try {
        const res = await fetch(`/api/conversations/${selectedConv.id}/suggest`, {
          method: "POST",
        });

        if (res.ok) {
          const data = await res.json();
          setAiSuggestion(data.suggestion || "");
        } else if (res.status === 403) {
          const data = await res.json();
          if (data.limitReached) {
            setAiSuggestion("⚠️ " + data.message);
          } else if (data.requiresModeChange) {
            setAiSuggestion("");
          }
        } else {
          setAiSuggestion("Unable to generate suggestion. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching suggestion:", error);
        setAiSuggestion("Unable to generate suggestion. Please try again.");
      } finally {
        setLoadingSuggestion(false);
      }
    };

    fetchSuggestion();
  }, [selectedConv?.id, selectedConv?.aiMode]);

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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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

      {/* CENTER: Full Chat Interface (55%) */}
      <div className="w-[55%] flex flex-col bg-white">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
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
            {/* Chat Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {selectedConv.customerName || selectedConv.customerPhone}
                  </h2>
                  <p className="text-xs text-gray-500">{selectedConv.customerPhone}</p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={selectedConv.leadScore === "hot" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {selectedConv.leadScore.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedConv.aiMode === "auto" && "🤖 Auto"}
                    {selectedConv.aiMode === "copilot" && "✨ Co-Pilot"}
                    {selectedConv.aiMode === "manual" && "👤 Manual"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMessages && fullMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : fullMessages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">No messages yet</p>
              ) : (
                fullMessages.map((msg) => {
                  const isCustomer = msg.senderType === "customer";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-1.5 ${
                          isCustomer
                            ? "bg-gray-100 text-gray-900"
                            : "bg-[#DCF8C6] text-gray-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.messageText}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Co-Pilot Suggestion (if mode = copilot) */}
            {selectedConv.aiMode === "copilot" && aiSuggestion && !aiSuggestion.startsWith("⚠️") && (
              <div className="px-4 py-2 bg-purple-50 border-t border-purple-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-900 mb-1">AI Suggestion:</p>
                    <p className="text-xs text-purple-800 leading-relaxed">{aiSuggestion}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setNewMessage(aiSuggestion)}
                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    Use
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input Area */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              {selectedConv.aiMode === "auto" ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Bot className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">
                    AI is handling this conversation automatically
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      selectedConv.aiMode === "copilot"
                        ? "Type your message or use AI suggestion above..."
                        : "Type your message..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="h-[60px] px-6"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT: Conversation Details (20%) */}
      <div className="w-[20%] border-l border-gray-200 bg-white overflow-y-auto">
        {!selectedConv ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Select a conversation to view details
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* AI Mode Selector */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Bot className="h-3.5 w-3.5" />
                AI Mode
              </h3>
              <div className="space-y-1.5">
                {[
                  { value: "auto", label: "Auto-Reply", emoji: "🤖" },
                  { value: "copilot", label: "Co-Pilot", emoji: "✨" },
                  { value: "manual", label: "Manual", emoji: "👤" }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => handleUpdateAiMode(mode.value)}
                    disabled={updatingMode}
                    className={`w-full px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedConv.aiMode === mode.value
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {mode.emoji} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lead Score - NOW EDITABLE */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Flame className="h-3.5 w-3.5" />
                Lead Status
              </h3>
              <div className="space-y-1.5">
                {["hot", "warm", "cold"].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleUpdateLeadScore(score)}
                    className={`w-full px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedConv.leadScore === score
                        ? score === "hot"
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : score === "warm"
                          ? "bg-orange-100 text-orange-700 border border-orange-300"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {score === "hot" && "🔥"} {score === "warm" && "☀️"} {score === "cold" && "❄️"}
                    {" "}{score.charAt(0).toUpperCase() + score.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags - ADD/REMOVE */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TagIcon className="h-3.5 w-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs flex items-center gap-1 pr-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              {tags.length < 10 && (
                <div className="flex gap-1">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTag}
                    disabled={addingTag || !newTag.trim()}
                    className="h-7 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

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

            {/* Conversation Feedback */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Star className="h-3.5 w-3.5" />
                Rate This Conversation
              </h3>
              {feedbackSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <ThumbsUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-700 font-medium">Thank you for your feedback!</p>
                  <p className="text-xs text-green-600 mt-1">Rating: {rating} stars</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleSubmitFeedback(star)}
                        className="text-gray-300 hover:text-yellow-400 transition-colors"
                      >
                        <Star
                          className={`h-6 w-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Click to rate agent performance
                  </p>
                </div>
              )}
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

"use client";

import { useState, useEffect } from "react";
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
  ThumbsDown,
  Star
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
  notes?: string;
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

  // Load notes when conversation changes
  useEffect(() => {
    if (selectedConv) {
      setNotes(selectedConv.notes || "");
    }
  }, [selectedConv?.id]);

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
        // Update local state
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
        // Update local state
        setConversations(conversations.map(c =>
          c.id === selectedConv.id ? { ...c, aiMode: mode } : c
        ));
        setSelectedConv({ ...selectedConv, aiMode: mode });
      }
    } catch (error) {
      console.error("Error updating AI mode:", error);
      alert("Failed to update AI mode");
    } finally {
      setUpdatingMode(false);
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
          agentId: null, // Will be populated from conversation
          rating: feedbackRating,
          feedbackType: feedbackRating >= 4 ? 'positive' : feedbackRating >= 2 ? 'neutral' : 'negative'
        }),
      });

      if (res.ok) {
        setRating(feedbackRating);
        setFeedbackSubmitted(true);

        // Trigger analytics update
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

  // Reset feedback when conversation changes
  useEffect(() => {
    if (selectedConv) {
      setNotes(selectedConv.notes || "");
      setRating(0);
      setFeedbackSubmitted(false);
    }
  }, [selectedConv?.id]);

  // Get AI suggestion for co-pilot mode
  useEffect(() => {
    if (selectedConv?.aiMode === 'copilot') {
      // Simulate AI suggestion - in real app, call API
      setAiSuggestion("Try saying: 'Great! I can help you complete your order. Would you like to proceed with the purchase?'");
    } else {
      setAiSuggestion("");
    }
  }, [selectedConv]);

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
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {conv.customerName || conv.customerPhone}
                        </h3>
                        {conv.leadScore === "hot" && (
                          <Flame className="h-3 w-3 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {conv.messages[0]?.messageText || "No messages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                    {conv.aiEnabled && (
                      <Badge variant="secondary" className="text-xs">
                        🤖
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Chat Area (55%) */}
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
                </div>
              </div>
            </div>

            {/* Messages - COMPACT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedConv.messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">No messages yet</p>
              ) : (
                selectedConv.messages.map((msg) => {
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
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-white"
                />
                <Button className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4" />
                </Button>
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

            {/* Lead Score */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Flame className="h-3.5 w-3.5" />
                Lead Status
              </h3>
              <div className="space-y-1.5">
                {["hot", "warm", "cold"].map((score) => (
                  <button
                    key={score}
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

            {/* Co-Pilot Suggestions */}
            {selectedConv.aiMode === "copilot" && aiSuggestion && (
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  AI Suggestion
                </h3>
                <Card className="p-2.5 bg-purple-50 border-purple-200">
                  <p className="text-xs text-purple-900 leading-relaxed">
                    {aiSuggestion}
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs bg-purple-600 hover:bg-purple-700"
                    onClick={() => setNewMessage(aiSuggestion.replace("Try saying: ", "").replace(/^'|'$/g, ""))}
                  >
                    Use This
                  </Button>
                </Card>
              </div>
            )}

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

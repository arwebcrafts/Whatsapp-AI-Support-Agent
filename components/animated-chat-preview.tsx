"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatMessage {
  id: number;
  text: string;
  sender: "customer" | "ai";
}

const messages: ChatMessage[] = [
  { id: 1, text: "Hi, do you have this in stock?", sender: "customer" },
  { id: 2, text: "Yes! We have it available. Would you like to order?", sender: "ai" },
  { id: 3, text: "What's the price?", sender: "customer" },
  { id: 4, text: "It's $49.99 with free shipping 🚚", sender: "ai" },
  { id: 5, text: "Can I get it delivered tomorrow?", sender: "customer" },
  { id: 6, text: "Absolutely! Same-day delivery available in your area", sender: "ai" },
  { id: 7, text: "Perfect! I'll take it", sender: "customer" },
  { id: 8, text: "Great choice! I'll send you the payment link now 💳", sender: "ai" },
];

export default function AnimatedChatPreview() {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentIndex < messages.length) {
      // Show typing indicator for AI messages
      if (messages[currentIndex].sender === "ai") {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
          setCurrentIndex((prev) => prev + 1);
        }, 1500);
      } else {
        // Customer messages appear immediately
        setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }
    } else {
      // Reset and start over after all messages shown
      setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
        setIsTyping(false);
      }, 3000);
    }
  }, [currentIndex, visibleMessages.length]);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden shadow-2xl border-4 border-gray-700">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 animate-pulse"></div>

      {/* Simulated Chat Interface */}
      <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[400px] flex flex-col">
          {/* Header */}
          <div className="bg-[#075E54] text-white px-4 py-3 rounded-t-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-[#128C7E] rounded-full flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <div className="font-semibold">Alex (Customer)</div>
              <div className="text-xs text-gray-200">Online</div>
            </div>
            <div className="ml-auto">
              <div className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                🤖 AI Active
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-[#E5DDD5] p-4 space-y-3 overflow-y-auto">
            {visibleMessages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "customer" ? "justify-start" : "justify-end"
                } animate-fade-in`}
              >
                <div
                  className={`${
                    message.sender === "customer"
                      ? "bg-white"
                      : "bg-[#DCF8C6]"
                  } rounded-lg px-3 py-2 max-w-[70%] shadow`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-end animate-fade-in">
                <div className="bg-[#DCF8C6] rounded-lg px-3 py-2 max-w-[70%] shadow">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="bg-[#F0F2F5] px-4 py-3 rounded-b-lg flex items-center gap-2">
            <input
              type="text"
              placeholder={isTyping ? "AI is typing..." : "Message Alex..."}
              className="flex-1 bg-white rounded-full px-4 py-2 text-sm"
              disabled
            />
            <div className="bg-[#25D366] rounded-full p-2">
              <Send className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

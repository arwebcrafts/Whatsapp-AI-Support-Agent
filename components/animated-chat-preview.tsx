"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface ChatMessage {
  id: number;
  text: string;
  sender: "customer" | "ai";
}

const messages: ChatMessage[] = [
  { id: 1, text: "Hi! I'm interested in your new wireless earbuds", sender: "customer" },
  { id: 2, text: "Hello! 👋 Great choice! Our Premium Wireless Earbuds are in stock. They feature active noise cancellation, 30-hour battery life, and crystal-clear sound quality.", sender: "ai" },
  { id: 3, text: "Sounds perfect! What colors do you have?", sender: "customer" },
  { id: 4, text: "We have them in Midnight Black, Pearl White, and Ocean Blue. All colors are currently available! Which one catches your eye? 🎧", sender: "ai" },
  { id: 5, text: "I like the Ocean Blue! What's the price?", sender: "customer" },
  { id: 6, text: "Excellent choice! The Ocean Blue is our bestseller 🌊\n\nPrice: $79.99 (Regular $129.99)\n✅ 38% OFF - Limited time offer\n✅ FREE shipping\n✅ 2-year warranty included", sender: "ai" },
  { id: 7, text: "That's a great deal! Can I get it delivered by Friday?", sender: "customer" },
  { id: 8, text: "Absolutely! We offer:\n📦 Express Delivery - Arrives Thursday ($9.99)\n🚚 Standard Delivery - Arrives Friday (FREE)\n\nWhich would you prefer?", sender: "ai" },
  { id: 9, text: "Friday works for me. I'll take the free shipping", sender: "customer" },
  { id: 10, text: "Perfect! I'll prepare your order:\n\n🎧 Premium Wireless Earbuds - Ocean Blue\n💰 Price: $79.99\n📦 FREE Standard Delivery (Arrives Friday)\n\nWould you like to proceed with payment?", sender: "ai" },
  { id: 11, text: "Yes please!", sender: "customer" },
  { id: 12, text: "Great! I'm sending you a secure payment link now. You can pay via credit card, PayPal, or Apple Pay 💳\n\nYou'll receive an order confirmation and tracking number immediately after payment. Any questions?", sender: "ai" },
  { id: 13, text: "No, that's perfect. Thanks for the help! 😊", sender: "customer" },
  { id: 14, text: "You're welcome! Happy to help! 🎉 Your payment link is on its way. Enjoy your new earbuds, and feel free to reach out anytime if you need assistance! Have a wonderful day! ✨", sender: "ai" },
];

export default function AnimatedChatPreview() {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, isTyping]);

  useEffect(() => {
    if (currentIndex < messages.length) {
      // Show typing indicator for AI messages
      if (messages[currentIndex].sender === "ai") {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
          setCurrentIndex((prev) => prev + 1);
        }, 1800);
      } else {
        // Customer messages appear immediately
        setTimeout(() => {
          setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
          setCurrentIndex((prev) => prev + 1);
        }, 800);
      }
    } else {
      // Reset and start over after all messages shown
      setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
        setIsTyping(false);
      }, 4000);
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
              👤
            </div>
            <div className="flex-1">
              <div className="font-semibold">Sarah (Customer)</div>
              <div className="text-xs text-gray-200 flex items-center gap-1">
                {isTyping ? "..." : "Online"} {visibleMessages.length > 0 && <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>}
              </div>
            </div>
            <div className="ml-auto">
              <div className="bg-gradient-to-r from-green-400 to-emerald-300 text-green-900 text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                🤖 AI Agent
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 bg-[#E5DDD5] p-4 space-y-3 overflow-y-auto scroll-smooth">
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
                  } rounded-lg px-3 py-2 max-w-[75%] shadow`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-[#F0F2F5] px-4 py-3 rounded-b-lg flex items-center gap-2">
            <input
              type="text"
              placeholder={isTyping ? "🤖 AI is responding..." : "Type a message..."}
              className="flex-1 bg-white rounded-full px-4 py-2 text-sm focus:outline-none"
              disabled
            />
            <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full p-2 transition-all duration-200 shadow-md">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

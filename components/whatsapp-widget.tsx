"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = "13072784862";
  const defaultMessage = "Hi! I'm interested in WhaSales AI. Can you help me?";

  const handleClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Tooltip */}
        {!isOpen && (
          <div
            className="absolute bottom-full right-0 mb-2 bg-white shadow-lg rounded-lg p-3 w-64 animate-bounce"
            onMouseEnter={() => setIsOpen(true)}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setIsOpen(true)}
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Need Help? Chat with us!
            </p>
            <p className="text-xs text-gray-600">
              Click to start a conversation on WhatsApp
            </p>
          </div>
        )}

        {/* WhatsApp Button */}
        <button
          onClick={handleClick}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-8 w-8" />

          {/* Pulse Animation */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
        </button>

        {/* Badge */}
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
          1
        </div>
      </div>
    </>
  );
}

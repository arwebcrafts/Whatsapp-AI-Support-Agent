"use client";

import { useEffect, useState } from "react";
import { X, Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExitIntentPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const wasShown = sessionStorage.getItem("exitPopupShown");
    if (wasShown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top of the page
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true);
        setHasShown(true);
        sessionStorage.setItem("exitPopupShown", "true");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Send email to your marketing system
    console.log("Email submitted:", email);

    // For now, just redirect to signup with email pre-filled
    window.location.href = `/signup?email=${encodeURIComponent(email)}`;
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
        <button
          onClick={() => setShowPopup(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Wait! Don't Miss Out! 🎁
          </CardTitle>
          <CardDescription className="text-lg">
            Get <span className="font-bold text-green-600">3 Days Free Trial</span> + Free Setup Guide
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
            <h4 className="font-semibold mb-2 text-center">🎯 What You'll Get:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>3-day free trial (no credit card required)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Step-by-step setup guide (PDF)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>WhatsApp automation templates</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Priority email support during trial</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="popup-email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="popup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Get My Free Trial + Guide 🚀
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500">
            No spam, ever. Unsubscribe anytime. By submitting, you agree to receive emails from WhaSales AI.
          </p>

          <div className="text-center pt-2">
            <button
              onClick={() => setShowPopup(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              No thanks, I don't want to save money
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

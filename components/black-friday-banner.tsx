"use client";

import { useState, useEffect } from "react";
import { Flame, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BlackFridayBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem("bf-banner-dismissed");
    if (dismissed) {
      setIsVisible(false);
      return;
    }

    // Countdown to December 1st, 2024
    const targetDate = new Date("2024-12-01T00:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setIsVisible(false);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("bf-banner-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white py-3 md:py-4 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
          {/* Main Message */}
          <div className="flex items-center gap-2 text-center md:text-left">
            <Flame className="h-5 w-5 md:h-6 md:w-6 animate-bounce flex-shrink-0" />
            <div>
              <div className="font-black text-sm md:text-lg tracking-tight">
                BLACK FRIDAY EXCLUSIVE
              </div>
              <div className="text-xs md:text-sm font-medium opacity-95">
                50% OFF Lifetime Deal - Only 247/500 Spots Left!
              </div>
            </div>
            <Flame className="h-5 w-5 md:h-6 md:w-6 animate-bounce flex-shrink-0" />
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 md:gap-3">
            <Clock className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <div className="flex gap-1 md:gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 md:px-2 py-1 min-w-[32px] md:min-w-[40px] text-center">
                <div className="text-sm md:text-lg font-bold">{timeLeft.days}</div>
                <div className="text-[8px] md:text-[10px] uppercase opacity-90">Days</div>
              </div>
              <span className="text-lg md:text-xl font-bold self-center">:</span>
              <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 md:px-2 py-1 min-w-[32px] md:min-w-[40px] text-center">
                <div className="text-sm md:text-lg font-bold">{String(timeLeft.hours).padStart(2, "0")}</div>
                <div className="text-[8px] md:text-[10px] uppercase opacity-90">Hrs</div>
              </div>
              <span className="text-lg md:text-xl font-bold self-center">:</span>
              <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 md:px-2 py-1 min-w-[32px] md:min-w-[40px] text-center">
                <div className="text-sm md:text-lg font-bold">{String(timeLeft.minutes).padStart(2, "0")}</div>
                <div className="text-[8px] md:text-[10px] uppercase opacity-90">Min</div>
              </div>
              <span className="text-lg md:text-xl font-bold self-center">:</span>
              <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 md:px-2 py-1 min-w-[32px] md:min-w-[40px] text-center">
                <div className="text-sm md:text-lg font-bold">{String(timeLeft.seconds).padStart(2, "0")}</div>
                <div className="text-[8px] md:text-[10px] uppercase opacity-90">Sec</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="#pricing">
            <Button
              className="bg-white text-red-600 hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-xs md:text-sm px-3 md:px-6 py-1 md:py-2 h-auto whitespace-nowrap"
            >
              Claim Deal →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

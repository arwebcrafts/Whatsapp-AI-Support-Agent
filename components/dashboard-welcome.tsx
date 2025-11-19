"use client";

import { useEffect, useState } from "react";
import { WelcomeWizard } from "./welcome-wizard";

export function DashboardWelcome() {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome wizard before
    const hasSeenWizard = localStorage.getItem("hasSeenWelcomeWizard");

    if (!hasSeenWizard) {
      // Show wizard after a short delay for better UX
      const timer = setTimeout(() => {
        setShowWizard(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowWizard(false);
    localStorage.setItem("hasSeenWelcomeWizard", "true");
  };

  return <WelcomeWizard open={showWizard} onClose={handleClose} />;
}

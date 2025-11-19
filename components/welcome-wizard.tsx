"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Bot,
  BookOpen,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface WelcomeWizardProps {
  open: boolean;
  onClose: () => void;
}

const WIZARD_STEPS = [
  {
    title: "Welcome to WhaSales AI! 🎉",
    description: "Let's take a quick tour of your new AI-powered WhatsApp assistant",
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          You've successfully set up your WhatsApp AI agent! Here's what you need to know to get started.
        </p>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">✅ What's Already Done:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Your AI agent is created and configured</li>
            <li>• WhatsApp connection is ready</li>
            <li>• You're on a 3-day free trial</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "AI Modes Explained",
    description: "Choose how your AI assistant helps you",
    icon: Bot,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 mb-4">
          Your AI can work in three different modes:
        </p>
        <div className="space-y-3">
          <div className="p-3 border border-purple-200 rounded-lg bg-purple-50">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Auto Mode (Recommended)
            </h4>
            <p className="text-sm text-purple-800 mt-1">
              AI automatically responds to all customer messages. Perfect for 24/7 support!
            </p>
          </div>

          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Copilot Mode
            </h4>
            <p className="text-sm text-blue-800 mt-1">
              AI suggests responses, but you review and send them. Great for quality control!
            </p>
          </div>

          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Manual Mode
            </h4>
            <p className="text-sm text-gray-800 mt-1">
              You handle all messages yourself. AI is available for suggestions when needed.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          💡 Tip: You can change modes anytime in the conversations page!
        </p>
      </div>
    ),
  },
  {
    title: "Train Your AI",
    description: "Add knowledge to make your AI smarter",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          The more your AI knows about your business, the better it performs!
        </p>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📚 Add Knowledge:</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Upload Documents:</strong> PDFs, Word files, or text documents</li>
            <li>• <strong>Paste Information:</strong> Product details, pricing, policies</li>
            <li>• <strong>Import from Website:</strong> Scrape your website content</li>
            <li>• <strong>Create FAQs:</strong> Common questions and answers</li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p className="text-sm text-orange-900">
            <strong>Pro Tip:</strong> Include pricing, shipping info, return policies, and product details.
            The AI will use this to answer customer questions accurately!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "You're All Set! 🚀",
    description: "Start converting chats into sales",
    icon: CheckCircle2,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 text-lg font-medium">
          Everything is ready! Here's what to do next:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold">Check Your Conversations</h4>
              <p className="text-sm text-gray-600">
                See incoming WhatsApp messages and watch your AI in action
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold">Add More Knowledge</h4>
              <p className="text-sm text-gray-600">
                Go to Knowledge Base and upload your business information
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold">Monitor Performance</h4>
              <p className="text-sm text-gray-600">
                Check Analytics to see how your AI is performing and improving
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-lg mt-6">
          <h4 className="font-semibold text-purple-900 mb-2">🎁 Your 3-Day Trial Includes:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>✅ Unlimited WhatsApp connections</li>
            <li>✅ AI auto-responses 24/7</li>
            <li>✅ Full analytics and insights</li>
            <li>✅ All AI modes (Auto, Copilot, Manual)</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function WelcomeWizard({ open, onClose }: WelcomeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = WIZARD_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Progress value={progress} className="h-2 mb-6" />

          <div className="min-h-[300px]">
            {step.content}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  Get Started
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip tour
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

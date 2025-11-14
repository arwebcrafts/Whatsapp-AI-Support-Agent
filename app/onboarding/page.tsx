"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, ArrowRight, Store, Home, GraduationCap, Briefcase, UtensilsCrossed, MoreHorizontal } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessType: "",
    aiTone: "",
    knowledgeBase: "",
  });

  const businessTypes = [
    { value: "ecommerce", label: "E-commerce / Online Store", icon: Store },
    { value: "realestate", label: "Real Estate", icon: Home },
    { value: "education", label: "Education / Courses", icon: GraduationCap },
    { value: "agency", label: "Agency / Freelancer", icon: Briefcase },
    { value: "restaurant", label: "Restaurant / Food", icon: UtensilsCrossed },
    { value: "other", label: "Other", icon: MoreHorizontal },
  ];

  const aiTones = [
    {
      value: "professional",
      label: "Professional & Formal",
      description: "Best for B2B, legal, finance",
    },
    {
      value: "friendly",
      label: "Friendly & Casual",
      description: "Best for retail, lifestyle brands",
    },
    {
      value: "direct",
      label: "Fast & Direct",
      description: "Best for sales-focused, quick responses",
    },
    {
      value: "warm",
      label: "Warm & Supportive",
      description: "Best for service businesses, coaching",
    },
  ];

  const progress = (step / 4) * 100;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);

    try {
      // Save onboarding data
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.businessType !== "";
    if (step === 2) return formData.aiTone !== "";
    if (step === 3) return true; // Knowledge base is optional
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">WhaSales AI</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Set Up Your AI Agent</h1>
          <p className="text-gray-600">This will take less than 2 minutes</p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Step {step} of 4</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome! 👋</CardTitle>
              <CardDescription>
                Let's set up your AI agent in a few simple steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">What type of business do you have?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businessTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setFormData({ ...formData, businessType: type.value })}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            formData.businessType === type.value
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-primary" />
                            <span className="font-medium">{type.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Tone */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>AI Personality</CardTitle>
              <CardDescription>
                How should your AI agent communicate with customers?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  {aiTones.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setFormData({ ...formData, aiTone: tone.value })}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        formData.aiTone === tone.value
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold mb-1">{tone.label}</div>
                      <div className="text-sm text-gray-600">{tone.description}</div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Knowledge Base */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Train Your AI</CardTitle>
              <CardDescription>
                Tell your AI about your business (you can edit this later)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="knowledge">Business Information</Label>
                  <textarea
                    id="knowledge"
                    value={formData.knowledgeBase}
                    onChange={(e) => setFormData({ ...formData, knowledgeBase: e.target.value })}
                    placeholder="Example: We sell handmade leather bags. Price range $50-200. Shipping takes 3-5 days. We offer 30-day returns..."
                    className="w-full h-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={5000}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.knowledgeBase.length} / 5000 characters
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">💡 What to include:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Products/services you offer</li>
                    <li>• Pricing information</li>
                    <li>• Shipping/delivery details</li>
                    <li>• Return/refund policy</li>
                    <li>• Any special offers or promotions</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleNext}>
                      Skip for Now
                    </Button>
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Connect WhatsApp (placeholder) */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Connect WhatsApp</CardTitle>
              <CardDescription>
                Almost there! Scan the QR code to connect your WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-100 rounded-lg p-12 flex flex-col items-center justify-center">
                  <div className="bg-white p-8 rounded-lg mb-4">
                    <p className="text-gray-500">QR Code will appear here</p>
                    <p className="text-sm text-gray-400 mt-2">(Baileys integration coming next)</p>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Status: ⚪ Waiting for scan...
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">How to connect:</h4>
                  <ol className="text-sm text-gray-700 space-y-1">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Tap Menu (⋮) → Linked Devices</li>
                    <li>3. Tap "Link a Device"</li>
                    <li>4. Scan this QR code</li>
                  </ol>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleFinish} disabled={loading}>
                      Skip & Go to Dashboard
                    </Button>
                    <Button onClick={handleFinish} disabled={loading}>
                      {loading ? "Finishing..." : "Go to Dashboard"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

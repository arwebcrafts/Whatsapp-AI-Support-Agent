"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, CreditCard, Flame } from "lucide-react";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();

    // Show success/error messages
    if (searchParams.get("success")) {
      alert("Payment successful! Your plan has been upgraded.");
    } else if (searchParams.get("cancelled")) {
      alert("Payment was cancelled.");
    }
  }, [searchParams]);

  async function loadUserData() {
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }

  async function handleUpgrade(planType: string, planInterval: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType, planInterval }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to create checkout session");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    setLoading(true);
    try {
      await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });
      alert("Your subscription will be cancelled at the end of the billing period");
      await loadUserData();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  }

  const plans = [
    {
      name: "Starter",
      type: "starter",
      monthlyPrice: 9,
      yearlyPrice: 75,
      lifetimePrice: 79,
      messages: "3,000",
      features: [
        "3,000 messages/month",
        "3 AI Modes (Auto/Copilot/Manual)",
        "Voice message transcription",
        "Smart 3-stage follow-ups",
        "Knowledge base (website scraping)",
        "Lead scoring & analytics dashboard",
        "Interactive buttons & lists",
        "Manual takeover mode",
        "AI agent templates library",
        "Normal support"
      ],
    },
    {
      name: "Pro",
      type: "professional",
      monthlyPrice: 19,
      yearlyPrice: 159,
      lifetimePrice: 149,
      messages: "10,000",
      features: [
        "10,000 messages/month",
        "3 AI Modes (Auto/Copilot/Manual)",
        "Voice message transcription",
        "Smart 3-stage follow-ups",
        "Knowledge base (website scraping)",
        "Lead scoring & analytics dashboard",
        "Interactive buttons & lists",
        "Manual takeover mode",
        "AI agent templates library",
        "Priority support"
      ],
      popular: true,
    },
    {
      name: "Business",
      type: "business",
      monthlyPrice: 39,
      yearlyPrice: 327,
      lifetimePrice: 199,
      messages: "20,000",
      features: [
        "20,000 messages/month",
        "3 AI Modes (Auto/Copilot/Manual)",
        "Voice message transcription",
        "Smart 3-stage follow-ups",
        "Knowledge base (website scraping)",
        "Lead scoring & analytics dashboard",
        "Interactive buttons & lists",
        "Manual takeover mode",
        "AI agent templates library",
        "Priority support"
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and payment methods</p>
        </div>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold capitalize">{user.planType} Plan</h3>
                    <Badge variant={user.subscriptionStatus === "active" || user.subscriptionStatus === "lifetime" ? "default" : "secondary"}>
                      {user.subscriptionStatus === "lifetime" ? "Lifetime" : user.subscriptionStatus}
                    </Badge>
                  </div>
                  {user.subscriptionStatus === "trial" && user.trialEndsAt && (
                    <p className="text-sm text-gray-600">
                      Trial ends: {new Date(user.trialEndsAt).toLocaleDateString()} (
                      {Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining)
                    </p>
                  )}
                  {user.subscriptionStatus === "active" && (
                    <p className="text-sm text-gray-600">
                      Your subscription is active and will renew automatically
                    </p>
                  )}
                  {user.subscriptionStatus === "lifetime" && (
                    <p className="text-sm text-green-600 font-semibold">
                      ✨ You have lifetime access! No recurring payments.
                    </p>
                  )}
                </div>
                {user.subscriptionStatus === "active" && (
                  <Button variant="destructive" onClick={handleCancelSubscription} disabled={loading}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>

          <Tabs defaultValue="lifetime" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
              <TabsTrigger value="lifetime">
                Lifetime <Flame className="ml-1 h-4 w-4 text-orange-500" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <Card key={plan.type} className={plan.popular ? "border-primary border-2 scale-105" : ""}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>Perfect for growing businesses</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">{plan.messages} messages/month</p>
                        <p className="text-sm text-gray-600 mb-4">{plan.features[plan.features.length - 1]}</p>
                      </div>
                      <ul className="space-y-2 mb-6 text-sm">
                        {plan.features.slice(1, -1).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(plan.type, "monthly")}
                        disabled={loading || user?.planType === plan.type}
                      >
                        {user?.planType === plan.type ? "Current Plan" : "Upgrade to " + plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Enterprise Plan */}
              <Card className="border-purple-500 border-2 bg-gradient-to-r from-purple-50 to-blue-50 mb-8">
                <CardHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                      <CardDescription>Custom solutions for large teams</CardDescription>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-600">Custom Pricing</p>
                      <p className="text-sm text-gray-600 mt-2">Tailored to your needs</p>
                    </div>
                    <div className="flex justify-center md:justify-end">
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/contact'}>
                        Contact Sales
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Unlimited messages</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Unlimited WhatsApp numbers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Dedicated account manager</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Custom integrations & API access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>White-label options</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>SLA guarantees</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Onboarding & training</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>24/7 VIP support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 14-Day Money-Back Guarantee */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">14-Day Money-Back Guarantee</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="yearly" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <Card key={plan.type} className={plan.popular ? "border-primary border-2 scale-105" : ""}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2 bg-green-100 text-green-700">
                        Get 3 Months Free! 🎉
                      </Badge>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>Perfect for growing businesses</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.yearlyPrice}</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        ~${(plan.yearlyPrice / 12).toFixed(2)}/month (Save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">{plan.messages} messages/month</p>
                        <p className="text-sm text-gray-600 mb-4">{plan.features[plan.features.length - 1]}</p>
                      </div>
                      <ul className="space-y-2 mb-6 text-sm">
                        {plan.features.slice(1, -1).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(plan.type, "yearly")}
                        disabled={loading || user?.planType === plan.type}
                      >
                        {user?.planType === plan.type ? "Current Plan" : "Upgrade to " + plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Enterprise Plan */}
              <Card className="border-purple-500 border-2 bg-gradient-to-r from-purple-50 to-blue-50 mb-8">
                <CardHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                      <CardDescription>Custom solutions for large teams</CardDescription>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-600">Custom Pricing</p>
                      <p className="text-sm text-gray-600 mt-2">Tailored to your needs</p>
                    </div>
                    <div className="flex justify-center md:justify-end">
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/contact'}>
                        Contact Sales
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Unlimited messages</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Unlimited WhatsApp numbers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Dedicated account manager</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Custom integrations & API access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>White-label options</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>SLA guarantees</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Onboarding & training</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>24/7 VIP support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 14-Day Money-Back Guarantee */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">14-Day Money-Back Guarantee</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lifetime" className="mt-6">
              <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg mb-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Flame className="h-6 w-6 text-orange-600" />
                    Black Friday Lifetime Deal
                    <Flame className="h-6 w-6 text-orange-600" />
                  </h3>
                  <p className="text-lg font-semibold text-orange-800">
                    December 1-31 ONLY - Limited to 500 Spots!
                  </p>
                  <p className="text-sm text-orange-700 mt-2">
                    Pay once, use forever. No recurring fees. Ever.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <Card key={plan.type} className={plan.popular ? "border-orange-500 border-2 scale-105" : ""}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600">
                        🔥 Best Value
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name} Lifetime</CardTitle>
                      <CardDescription>One-time payment</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.lifetimePrice}</span>
                        <span className="text-gray-600"> once</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold">
                        Save ${plan.monthlyPrice * 12 * 10 - plan.lifetimePrice}+ vs monthly
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">{plan.messages} messages/month</p>
                        <p className="text-sm text-gray-600 mb-2">{plan.features[plan.features.length - 1]}</p>
                        <p className="text-sm font-bold text-orange-600"><strong>Forever access ✨</strong></p>
                      </div>
                      <ul className="space-y-2 mb-6 text-sm">
                        {plan.features.slice(1, -1).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>All future updates included</span>
                        </li>
                      </ul>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleUpgrade(plan.type, "lifetime")}
                        disabled={loading || user?.subscriptionStatus === "lifetime"}
                      >
                        {user?.subscriptionStatus === "lifetime" ? "You Have Lifetime!" : "Claim Lifetime Deal"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Enterprise Plan */}
              <Card className="border-purple-500 border-2 bg-gradient-to-r from-purple-50 to-blue-50 mb-8">
                <CardHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <CardTitle className="text-2xl mb-2">Lifetime Enterprise</CardTitle>
                      <CardDescription>One-time payment, unlimited forever</CardDescription>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-600">Custom Pricing</p>
                      <p className="text-sm text-gray-600 mt-2">Tailored to your needs</p>
                    </div>
                    <div className="flex justify-center md:justify-end">
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/contact'}>
                        Contact Sales
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Unlimited messages forever</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Unlimited WhatsApp numbers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Dedicated account manager</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Custom integrations & API access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>White-label options</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>SLA guarantees</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Onboarding & training</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>24/7 VIP support forever</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 14-Day Money-Back Guarantee */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">14-Day Money-Back Guarantee</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Payment methods are managed securely through Stripe during checkout.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

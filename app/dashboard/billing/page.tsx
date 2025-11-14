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
      yearlyPrice: 79,
      lifetimePrice: 79,
      messages: "2,000",
      features: ["2,000 messages/month", "1 WhatsApp number", "AI auto-replies", "Knowledge base"],
    },
    {
      name: "Professional",
      type: "professional",
      monthlyPrice: 19,
      yearlyPrice: 169,
      lifetimePrice: 149,
      messages: "5,000",
      features: ["5,000 messages/month", "3 WhatsApp numbers", "Voice notes", "Smart follow-ups", "Priority support"],
      popular: true,
    },
    {
      name: "Business",
      type: "business",
      monthlyPrice: 39,
      yearlyPrice: 349,
      lifetimePrice: 249,
      messages: "12,000",
      features: ["12,000 messages/month", "10 WhatsApp numbers", "All features", "Analytics", "VIP support"],
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.type} className={plan.popular ? "border-primary border-2" : ""}>
                    {plan.popular && (
                      <div className="text-center">
                        <Badge className="mt-4">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.messages} messages/month</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-sm">{feature}</span>
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
            </TabsContent>

            <TabsContent value="yearly" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.type} className={plan.popular ? "border-primary border-2" : ""}>
                    {plan.popular && (
                      <div className="text-center">
                        <Badge className="mt-4">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">
                        Save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%
                      </Badge>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.messages} messages/month</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">${plan.yearlyPrice}</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        ~${(plan.yearlyPrice / 12).toFixed(2)}/month
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-sm">{feature}</span>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.type} className={plan.popular ? "border-orange-500 border-2" : ""}>
                    {plan.popular && (
                      <div className="text-center">
                        <Badge className="mt-4 bg-orange-600">Best Value</Badge>
                      </div>
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
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="text-sm">{plan.messages} messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="text-sm font-bold">Forever</span>
                        </li>
                        {plan.features.slice(1).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
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

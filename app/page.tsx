import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Zap,
  MessageSquare,
  Globe,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Flame
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Black Friday Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-3 sticky top-0 z-50 animate-pulse">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm md:text-base font-bold">
            <Flame className="h-5 w-5" />
            <span>BLACK FRIDAY EXCLUSIVE: Lifetime Access $79 - Only 247/500 Spots Left!</span>
            <span className="hidden md:inline">⏰ Ends December 31st</span>
            <Flame className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-12 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">WhaSales AI</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm hover:text-primary">Features</Link>
              <Link href="#pricing" className="text-sm hover:text-primary">Pricing</Link>
              <Link href="#faq" className="text-sm hover:text-primary">FAQ</Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Start Free Trial</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-green-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4" variant="secondary">
                No Official WhatsApp API Needed
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Turn WhatsApp Chats Into Sales With AI
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                Connect in 30 seconds. Reply instantly. Convert 3x more leads.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg">
                    View Pricing
                  </Button>
                </Link>
              </div>

              {/* Video Demo Placeholder */}
              <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                <p className="text-gray-500">Demo Video Coming Soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Close More Sales</h2>
              <p className="text-xl text-gray-600">Powerful features that work 24/7 for your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Bot className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>AI Auto-Replies 24/7</CardTitle>
                  <CardDescription>
                    Never miss a lead. AI responds instantly to every message, even while you sleep.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Voice Note Support</CardTitle>
                  <CardDescription>
                    AI understands and responds to voice messages automatically.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Smart Follow-Ups</CardTitle>
                  <CardDescription>
                    Automatically follow up with leads who don't respond within 24 hours.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Globe className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Multi-Language</CardTitle>
                  <CardDescription>
                    Chat with customers in any language. AI adapts automatically.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Unlimited Agents</CardTitle>
                  <CardDescription>
                    Create multiple AI agents for different business needs.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Knowledge Base Training</CardTitle>
                  <CardDescription>
                    Train your AI with your business info, pricing, and policies.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in 3 Simple Steps</h2>
              <p className="text-xl text-gray-600">From signup to your first AI reply in under 3 minutes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Connect WhatsApp</h3>
                <p className="text-gray-600">Scan QR code - takes 30 seconds</p>
              </div>

              <div className="text-center">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Train Your AI Agent</h3>
                <p className="text-gray-600">Add your business info - 2 minutes</p>
              </div>

              <div className="text-center">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">AI Handles Everything</h3>
                <p className="text-gray-600">Sit back and watch sales grow</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-600">Choose the plan that fits your business</p>
            </div>

            <Tabs defaultValue="lifetime" className="max-w-6xl mx-auto">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="lifetime">
                  Lifetime <Flame className="ml-1 h-4 w-4 text-orange-500" />
                </TabsTrigger>
              </TabsList>

              {/* Monthly Plans */}
              <TabsContent value="monthly" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Starter</CardTitle>
                      <CardDescription>Perfect for small shops</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$9</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>2,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>1 WhatsApp number</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>AI auto-replies</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Knowledge base</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="border-primary border-2 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                    <CardHeader>
                      <CardTitle>Professional</CardTitle>
                      <CardDescription>For e-commerce & agencies</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$19</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>5,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>3 WhatsApp numbers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>AI auto-replies</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Voice note support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Smart follow-ups</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Business</CardTitle>
                      <CardDescription>High-volume businesses</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$39</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>12,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>10 WhatsApp numbers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>All Professional features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Analytics dashboard</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>

              {/* Yearly Plans */}
              <TabsContent value="yearly" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">Save 32%</Badge>
                      <CardTitle>Starter</CardTitle>
                      <CardDescription>Perfect for small shops</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$79</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">~$6.58/month</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>2,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>1 WhatsApp number</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>AI auto-replies</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="border-primary border-2 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">Save 31%</Badge>
                      <CardTitle>Professional</CardTitle>
                      <CardDescription>For e-commerce & agencies</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$169</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">~$14/month</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>5,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>3 WhatsApp numbers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>All features included</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2">Save 31%</Badge>
                      <CardTitle>Business</CardTitle>
                      <CardDescription>High-volume businesses</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$349</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">~$29/month</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>12,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>10 WhatsApp numbers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>All features + priority support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>

              {/* Lifetime Plans */}
              <TabsContent value="lifetime" className="mt-8">
                <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg mb-8">
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
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="destructive">247/500 Remaining</Badge>
                      </div>
                      <CardTitle>Lifetime Starter</CardTitle>
                      <CardDescription>One-time payment</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$79</span>
                        <span className="text-gray-600"> once</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold mt-1">Save $1,200+ vs monthly</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>2,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span><strong>Forever</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>All future updates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>AI auto-replies</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          Claim Lifetime Deal
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="border-orange-500 border-2 relative shadow-lg scale-105">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600">
                      🔥 Best Value
                    </Badge>
                    <CardHeader>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="destructive">142/500 Remaining</Badge>
                      </div>
                      <CardTitle>Lifetime Pro</CardTitle>
                      <CardDescription>One-time payment</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$149</span>
                        <span className="text-gray-600"> once</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold mt-1">Save $2,700+ vs monthly</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>5,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span><strong>Forever</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>All future updates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Voice notes & follow-ups</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          Claim Lifetime Deal
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="destructive">89/500 Remaining</Badge>
                      </div>
                      <CardTitle>Lifetime Business</CardTitle>
                      <CardDescription>One-time payment</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$249</span>
                        <span className="text-gray-600"> once</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold mt-1">Save $5,400+ vs monthly</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>12,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span><strong>Forever</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>All future updates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Unlimited everything</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>VIP support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          Claim Lifetime Deal
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Is this legal?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes! It works just like WhatsApp Web. We use the same official connection method.
                    It's completely safe and approved by WhatsApp.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Will my number get banned?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    No. As long as customers message you first (not spam), you're 100% safe.
                    Thousands of businesses use this method daily.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What happens after the free trial?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    After 7 days, you can choose a paid plan or continue with our free forever plan
                    (limited features). No credit card required for trial.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Can I cancel anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes! Cancel with one click from your dashboard. No questions asked.
                    Lifetime plans are non-refundable but never expire.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Do I need the official WhatsApp Business API?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    No! That's the beauty of WhaSales AI. No API needed, no Meta approval required.
                    Just scan QR code and you're live.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to 3x Your WhatsApp Sales?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of businesses already using AI to close more deals
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg">
                Start Free Trial - No Credit Card Required
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-white">WhaSales AI</span>
              </div>
              <p className="text-sm">
                Turn WhatsApp chats into sales with AI-powered automation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="/signup">Start Free Trial</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#faq">FAQ</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 WhaSales AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

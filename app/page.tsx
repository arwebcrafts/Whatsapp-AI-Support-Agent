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
  Flame,
  Send
} from "lucide-react";
import AnimatedChatPreview from "@/components/animated-chat-preview";
import BlackFridayBanner from "@/components/black-friday-banner";
import WhatsAppWidget from "@/components/whatsapp-widget";
import ExitIntentPopup from "@/components/exit-intent-popup";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Exit Intent Popup */}
      <ExitIntentPopup />

      {/* WhatsApp Widget */}
      <WhatsAppWidget />

      {/* Black Friday Banner with Countdown */}
      <BlackFridayBanner />

      {/* Navigation */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
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
                ⚡ Affordable WhatsApp Automation
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Automate 90% of WhatsApp Chats, Close 3x More Sales - While You Sleep
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                AI responds in &lt;3 seconds. Works 24/7. Learns your business. No coding required.
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

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">1,000+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">&lt;3s</div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
              </div>

              {/* Animated Dashboard Preview */}
              <AnimatedChatPreview />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Bot className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>AI Auto-Replies 24/7</CardTitle>
                  <CardDescription>
                    AI responds in &lt;3 seconds to every message, even while you sleep. Never miss a lead again.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>3 AI Modes</CardTitle>
                  <CardDescription>
                    Auto, Copilot, or Manual mode. Switch instantly based on your needs.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Voice Transcription</CardTitle>
                  <CardDescription>
                    AI transcribes and responds to voice messages automatically. No manual listening required.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Globe className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Multi-Language</CardTitle>
                  <CardDescription>
                    Chat in any language. AI adapts automatically to customer's language.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Smart 3-Stage Follow-ups</CardTitle>
                  <CardDescription>
                    Automatic follow-ups at 3 hours, 24 hours, and 7 days. Recovers cold leads automatically.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Flame className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Lead Scoring</CardTitle>
                  <CardDescription>
                    Hot, Warm, Cold lead tracking. Focus on high-intent customers first.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Bot className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Track performance, response times, conversion rates, and customer insights in real-time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Send className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Interactive Buttons</CardTitle>
                  <CardDescription>
                    Send interactive WhatsApp buttons and lists. Better engagement than plain text.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>AI Agent Templates</CardTitle>
                  <CardDescription>
                    Pre-built templates for E-commerce, Real Estate, Education, Restaurants, and more.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Knowledge Base</CardTitle>
                  <CardDescription>
                    Upload PDFs, scrape websites, add FAQs. AI learns your business in minutes.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Manual Takeover</CardTitle>
                  <CardDescription>
                    Switch from AI to human with 1 click. Full control when you need it.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Admin Portal</CardTitle>
                  <CardDescription>
                    Support tickets, user management, analytics. Enterprise-grade features included.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Before/After Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">See The Difference AI Makes</h2>
              <p className="text-xl text-gray-600">Real conversations, real results</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Before - Without AI */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                    ❌ Before (Without AI)
                  </div>
                </div>

                {/* Chat Mockup */}
                <div className="bg-gray-100 rounded-lg p-6 space-y-4 min-h-[400px] border-2 border-gray-300">
                  {/* Customer message */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm">Hi! Do you have this in blue? What's the price?</p>
                      <p className="text-xs text-gray-500 mt-1">10:23 AM</p>
                    </div>
                  </div>

                  {/* No response */}
                  <div className="text-center py-8 text-gray-400 italic">
                    <p className="text-sm">😴 No response...</p>
                    <p className="text-xs mt-2">Customer waits 5 hours</p>
                  </div>

                  {/* Customer follows up */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm">Hello? Anyone there?</p>
                      <p className="text-xs text-gray-500 mt-1">3:45 PM</p>
                    </div>
                  </div>

                  {/* Late response */}
                  <div className="flex justify-end">
                    <div className="bg-blue-100 rounded-lg rounded-tr-none px-4 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm">Sorry for late reply! Yes, $49</p>
                      <p className="text-xs text-gray-500 mt-1">6:20 PM</p>
                    </div>
                  </div>

                  {/* Customer lost */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm">Bought from competitor already. Thanks anyway.</p>
                      <p className="text-xs text-gray-500 mt-1">6:22 PM</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-red-800">❌ Lost Sale: $49</p>
                  <p className="text-xs text-red-600 mt-1">8 hours response time</p>
                </div>
              </div>

              {/* After - With AI */}
              <div className="space-y-4 relative">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold animate-pulse">
                    ✅ After (With WhaSales AI)
                  </div>
                </div>

                {/* Chat Mockup */}
                <div className="bg-[#E5DDD5] rounded-lg p-6 space-y-4 min-h-[400px] border-2 border-green-300 shadow-lg">
                  {/* Customer message */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 max-w-[80%] shadow-md">
                      <p className="text-sm">Hi! Do you have this in blue? What's the price?</p>
                      <p className="text-xs text-gray-500 mt-1">10:23 AM</p>
                    </div>
                  </div>

                  {/* Instant AI response */}
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-4 py-3 max-w-[80%] shadow-md relative">
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        🤖 AI
                      </div>
                      <p className="text-sm">Hey! Yes, we have it in Royal Blue and Sky Blue 😊 Price is $49 with free shipping!</p>
                      <p className="text-xs text-gray-500 mt-1">10:23 AM ✓✓</p>
                    </div>
                  </div>

                  {/* Customer interested */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 max-w-[80%] shadow-md">
                      <p className="text-sm">Perfect! Royal Blue please. How long for delivery?</p>
                      <p className="text-xs text-gray-500 mt-1">10:24 AM</p>
                    </div>
                  </div>

                  {/* AI continues */}
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-4 py-3 max-w-[80%] shadow-md">
                      <p className="text-sm">Great choice! 2-3 business days to your location. Want me to send you the payment link?</p>
                      <p className="text-xs text-gray-500 mt-1">10:24 AM ✓✓</p>
                    </div>
                  </div>

                  {/* Sale confirmed */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 max-w-[80%] shadow-md">
                      <p className="text-sm">Yes please! 🎉</p>
                      <p className="text-xs text-gray-500 mt-1">10:25 AM</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-green-800">✅ Sale Closed: $49</p>
                  <p className="text-xs text-green-600 mt-1">Under 2 minutes</p>
                </div>

                {/* Sparkle effect */}
                <div className="absolute -top-4 -right-4 text-4xl animate-bounce">✨</div>
              </div>
            </div>

            {/* Stats comparison */}
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center border-2 border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">3x</div>
                    <p className="text-sm font-semibold">More Conversions</p>
                  </CardContent>
                </Card>
                <Card className="text-center border-2 border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                    <p className="text-sm font-semibold">Instant Responses</p>
                  </CardContent>
                </Card>
                <Card className="text-center border-2 border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">0</div>
                    <p className="text-sm font-semibold">Lost Leads</p>
                  </CardContent>
                </Card>
              </div>
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

        {/* Comparison Table Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose WhaSales AI?</h2>
              <p className="text-xl text-gray-600">See how we compare to traditional solutions</p>
            </div>

            {/* Mobile-Responsive Comparison Table */}
            <div className="max-w-6xl mx-auto">
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                      <th className="p-4 text-left font-bold text-lg">Feature</th>
                      <th className="p-4 text-center font-bold text-lg border-l-2 border-white">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-1">⚡</span>
                          <span>WhaSales AI</span>
                        </div>
                      </th>
                      <th className="p-4 text-center font-bold text-lg border-l-2 border-white">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-1">👤</span>
                          <span>Hiring Staff</span>
                        </div>
                      </th>
                      <th className="p-4 text-center font-bold text-lg border-l-2 border-white">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-1">🏢</span>
                          <span>WhatsApp API</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">Monthly Cost</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <span className="text-2xl font-bold text-green-600">$9 - $39</span>
                        <p className="text-xs text-gray-600 mt-1">All-inclusive</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-red-600">$500 - $2,000</span>
                        <p className="text-xs text-gray-600 mt-1">Varies by region</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-red-600">$200 - $1,000+</span>
                        <p className="text-xs text-gray-600 mt-1">+ setup fees</p>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">Setup Time</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-green-600">30 seconds</span>
                        <p className="text-xs text-gray-600 mt-1">Scan QR code</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-orange-600">2-4 weeks</span>
                        <p className="text-xs text-gray-600 mt-1">Hiring & training</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-orange-600">4-8 weeks</span>
                        <p className="text-xs text-gray-600 mt-1">Meta approval</p>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">Response Time</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-green-600">&lt;3 seconds</span>
                        <p className="text-xs text-gray-600 mt-1">Instant AI</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-gray-600">5-30 minutes</span>
                        <p className="text-xs text-gray-600 mt-1">Human delay</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-xl font-bold text-gray-600">Manual setup</span>
                        <p className="text-xs text-gray-600 mt-1">Need developers</p>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">24/7 Availability</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-red-600 text-2xl">✗</span>
                        <p className="text-xs text-gray-600 mt-1">Extra cost</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-orange-600 text-2xl">~</span>
                        <p className="text-xs text-gray-600 mt-1">Need setup</p>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">Multi-Language</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-red-600 text-2xl">✗</span>
                        <p className="text-xs text-gray-600 mt-1">Limited</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-orange-600 text-2xl">~</span>
                        <p className="text-xs text-gray-600 mt-1">Extra cost</p>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">Voice Transcription</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-red-600 text-2xl">✗</span>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-red-600 text-2xl">✗</span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-semibold">Smart Follow-ups</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-orange-600 text-2xl">~</span>
                        <p className="text-xs text-gray-600 mt-1">Inconsistent</p>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-orange-600 text-2xl">~</span>
                        <p className="text-xs text-gray-600 mt-1">Manual setup</p>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-semibold">Analytics Dashboard</td>
                      <td className="p-4 text-center bg-green-50 border-l-2 border-gray-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <span className="text-red-600 text-2xl">✗</span>
                      </td>
                      <td className="p-4 text-center border-l-2 border-gray-200">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Card-based comparison */}
              <div className="md:hidden space-y-4">
                <Card className="border-2 border-green-500">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      WhaSales AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Monthly Cost:</span>
                        <span className="text-lg font-bold text-green-600">$9 - $39</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Setup Time:</span>
                        <span className="text-lg font-bold text-green-600">30 seconds</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Response Time:</span>
                        <span className="text-lg font-bold text-green-600">&lt;3 seconds</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">24/7 Availability:</span>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Multi-Language:</span>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Voice Transcription:</span>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Smart Follow-ups:</span>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Analytics Dashboard:</span>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gray-100">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      Hiring Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Monthly Cost:</span>
                        <span className="text-lg font-bold text-red-600">$500 - $2,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Setup Time:</span>
                        <span className="text-sm text-orange-600">2-4 weeks</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Response Time:</span>
                        <span className="text-sm text-gray-600">5-30 minutes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">24/7 Availability:</span>
                        <span className="text-red-600 text-xl">✗</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Multi-Language:</span>
                        <span className="text-red-600 text-xl">✗</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Voice Transcription:</span>
                        <span className="text-red-600 text-xl">✗</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Smart Follow-ups:</span>
                        <span className="text-sm text-orange-600">Inconsistent</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Analytics Dashboard:</span>
                        <span className="text-red-600 text-xl">✗</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gray-100">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🏢</span>
                      WhatsApp API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Monthly Cost:</span>
                        <span className="text-lg font-bold text-red-600">$200 - $1,000+</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Setup Time:</span>
                        <span className="text-sm text-orange-600">4-8 weeks</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Response Time:</span>
                        <span className="text-sm text-gray-600">Manual setup</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">24/7 Availability:</span>
                        <span className="text-sm text-orange-600">Need setup</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Multi-Language:</span>
                        <span className="text-sm text-orange-600">Extra cost</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Voice Transcription:</span>
                        <span className="text-red-600 text-xl">✗</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Smart Follow-ups:</span>
                        <span className="text-sm text-orange-600">Manual setup</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Analytics Dashboard:</span>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom CTA */}
              <div className="mt-12 text-center bg-gradient-to-r from-green-100 to-blue-100 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Save $500 - $2,000/month vs. Hiring Staff</h3>
                <p className="text-lg text-gray-700 mb-6">Get started in 30 seconds. 3-day free trial.</p>
                <Link href="/signup">
                  <Button size="lg" className="text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
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

            <Tabs defaultValue="monthly" className="max-w-6xl mx-auto">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="lifetime">
                  Lifetime <Flame className="ml-1 h-4 w-4 text-orange-500" />
                </TabsTrigger>
              </TabsList>

              {/* Monthly Plans */}
              <TabsContent value="monthly" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold">3,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>1 WhatsApp number</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>1 AI Agent</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Voice transcription</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Smart follow-ups</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Knowledge base</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Lead scoring & analytics</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Interactive buttons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Manual takeover</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Normal support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start 3-Day Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="border-primary border-2 relative shadow-lg scale-105">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
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
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold">10,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>1 WhatsApp number</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>1 AI Agent</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Voice transcription</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Smart follow-ups</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Knowledge base</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Lead scoring & analytics</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Interactive buttons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Manual takeover</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-primary">Priority support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start 3-Day Free Trial</Button>
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
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold">20,000 messages/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>1 WhatsApp number</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>1 AI Agent</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Voice transcription</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Smart follow-ups</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Knowledge base</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Lead scoring & analytics</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Interactive buttons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>Manual takeover</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-primary">Priority support</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start 3-Day Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>

                {/* Enterprise Plan - Horizontal Card */}
                <Card className="border-purple-500 border-2 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                        <p className="text-gray-600">Custom solutions for large teams</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Unlimited messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Unlimited WhatsApp numbers</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Unlimited AI agents</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>All features + custom integrations</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-purple-600">Dedicated support & SLA</span>
                        </div>
                      </div>
                      <div className="text-center md:text-right">
                        <div className="text-3xl font-bold mb-3">Custom Pricing</div>
                        <Link href="/dashboard/support">
                          <Button size="lg" variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                            Contact Sales
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 14-Day Money-Back Guarantee */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">14-Day Money-Back Guarantee</span>
                    <span className="text-green-600">- Try risk-free!</span>
                  </div>
                </div>
              </TabsContent>

              {/* Yearly Plans */}
              <TabsContent value="yearly" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2 bg-green-100 text-green-700">Get 3 Months Free! 🎉</Badge>
                      <CardTitle>Starter</CardTitle>
                      <CardDescription>Perfect for small shops</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$75</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">~$6.25/month (Save 31%)</p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">3,000 messages/month</p>
                        <p className="text-sm text-gray-600 mb-4">Normal support</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Voice message transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Smart 3-stage follow-ups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Knowledge base (website scraping)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Lead scoring & analytics dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Interactive buttons & lists</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Manual takeover mode</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>AI agent templates library</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link href="/signup" className="w-full">
                        <Button className="w-full">Start Free Trial</Button>
                      </Link>
                    </CardFooter>
                  </Card>

                  <Card className="border-primary border-2 relative shadow-lg scale-105">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-2 bg-green-100 text-green-700">Get 3 Months Free! 🎉</Badge>
                      <CardTitle>Pro</CardTitle>
                      <CardDescription>For e-commerce & agencies</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$159</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">~$13.25/month (Save 30%)</p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">10,000 messages/month</p>
                        <p className="text-sm text-gray-600 mb-4">Priority support</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Voice message transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Smart 3-stage follow-ups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Knowledge base (website scraping)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Lead scoring & analytics dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Interactive buttons & lists</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Manual takeover mode</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>AI agent templates library</span>
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
                      <Badge variant="secondary" className="w-fit mb-2 bg-green-100 text-green-700">Get 3 Months Free! 🎉</Badge>
                      <CardTitle>Business</CardTitle>
                      <CardDescription>High-volume businesses</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">$327</span>
                        <span className="text-gray-600">/year</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">~$27.25/month (Save 30%)</p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">20,000 messages/month</p>
                        <p className="text-sm text-gray-600 mb-4">Priority support</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Voice message transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Smart 3-stage follow-ups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Knowledge base (website scraping)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Lead scoring & analytics dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Interactive buttons & lists</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Manual takeover mode</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>AI agent templates library</span>
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

                {/* Enterprise Plan - Horizontal Layout */}
                <Card className="border-purple-500 border-2 bg-gradient-to-r from-purple-50 to-blue-50">
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
                        <Link href="/contact">
                          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                            Contact Sales
                          </Button>
                        </Link>
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
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">14-Day Money-Back Guarantee</span>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">3,000 messages/month</p>
                        <p className="text-sm text-gray-600 mb-2">Normal support</p>
                        <p className="text-sm font-bold text-orange-600"><strong>Forever access ✨</strong></p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Voice message transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Smart 3-stage follow-ups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Knowledge base (website scraping)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Lead scoring & analytics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>All future updates included</span>
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
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">10,000 messages/month</p>
                        <p className="text-sm text-gray-600 mb-2">Priority support</p>
                        <p className="text-sm font-bold text-orange-600"><strong>Forever access ✨</strong></p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Voice message transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Smart 3-stage follow-ups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Knowledge base (website scraping)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Lead scoring & analytics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>All future updates included</span>
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
                        <span className="text-4xl font-bold">$199</span>
                        <span className="text-gray-600"> once</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold mt-1">Save $5,400+ vs monthly</p>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">20,000 messages/month</p>
                        <p className="text-sm text-gray-600 mb-2">Priority support</p>
                        <p className="text-sm font-bold text-orange-600"><strong>Forever access ✨</strong></p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>3 AI Modes (Auto/Copilot/Manual)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Voice message transcription</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Smart 3-stage follow-ups</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Knowledge base (website scraping)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Lead scoring & analytics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>All future updates included</span>
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

                {/* Enterprise Plan - Horizontal Layout */}
                <Card className="border-purple-500 border-2 bg-gradient-to-r from-purple-50 to-blue-50">
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
                        <Link href="/contact">
                          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                            Contact Sales
                          </Button>
                        </Link>
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
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">14-Day Money-Back Guarantee</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-xl text-gray-600">Join thousands of businesses growing with WhaSales AI</p>
            </div>

            {/* Detailed Case Studies */}
            <div className="max-w-6xl mx-auto mb-16 space-y-8">
              {/* Case Study 1 */}
              <Card className="border-2 border-green-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                      R
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">Rajesh Electronics - Bangalore</CardTitle>
                      <CardDescription className="text-lg">Consumer Electronics Retail | 15 Years in Business</CardDescription>
                      <div className="flex gap-1 mt-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-xl">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-bold text-red-600 mb-3">❌ The Problem</h4>
                      <p className="text-gray-700 text-sm">
                        "We were drowning in 200+ WhatsApp messages daily. Customers waited hours for responses. I was losing sales to competitors who replied faster. Hiring staff would cost ₹40,000/month ($500) minimum."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-600 mb-3">✅ The Solution</h4>
                      <p className="text-gray-700 text-sm">
                        "Set up WhaSales AI in 30 seconds. Trained it on our product catalog and pricing. The AI now handles 90% of questions automatically in English, Hindi, and Kannada."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-600 mb-3">📈 The Results</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">250% increase in sales</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Saved 20 hours/week</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Response time: 3s (was 2 hours)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">ROI: 2,500% in 2 months</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                    <p className="italic text-gray-700">
                      "I recovered $15,000 in lost sales in the first month alone from the AI's automatic follow-ups. This is hands-down the best business decision I've made this year."
                    </p>
                    <p className="text-sm font-semibold mt-2">- Rajesh Kumar, Owner</p>
                  </div>
                </CardContent>
              </Card>

              {/* Case Study 2 */}
              <Card className="border-2 border-purple-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                      A
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">Aisha Real Estate - Karachi</CardTitle>
                      <CardDescription className="text-lg">Property Consulting Agency | 50+ Active Listings</CardDescription>
                      <div className="flex gap-1 mt-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-xl">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-bold text-red-600 mb-3">❌ The Problem</h4>
                      <p className="text-gray-700 text-sm">
                        "Property inquiries came 24/7, but I could only work 9-5. By the time I replied, clients had already contacted 3-4 other agents. I was missing 60% of potential leads."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-600 mb-3">✅ The Solution</h4>
                      <p className="text-gray-700 text-sm">
                        "WhaSales AI now answers property questions instantly in Urdu and English. It sends property photos, schedules viewings, and follows up with interested buyers automatically."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-600 mb-3">📈 The Results</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">3x more property viewings</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Closed 12 deals in 1 month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Works while I sleep</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">No missed leads</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                    <p className="italic text-gray-700">
                      "The voice message transcription is a game-changer! I used to spend 3 hours daily listening to voice notes. Now the AI handles everything. My commission has tripled!"
                    </p>
                    <p className="text-sm font-semibold mt-2">- Aisha Hassan, Real Estate Agent</p>
                  </div>
                </CardContent>
              </Card>

              {/* Case Study 3 */}
              <Card className="border-2 border-blue-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                      M
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">Maya Fashion Boutique - Dhaka</CardTitle>
                      <CardDescription className="text-lg">Online Fashion Store | Instagram: 50K Followers</CardDescription>
                      <div className="flex gap-1 mt-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-xl">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-bold text-red-600 mb-3">❌ The Problem</h4>
                      <p className="text-gray-700 text-sm">
                        "During flash sales, I got 500+ messages in 2 hours. I couldn't keep up! Cart abandonment was 70%. Customers moved to competitors within minutes if I didn't reply."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-600 mb-3">✅ The Solution</h4>
                      <p className="text-gray-700 text-sm">
                        "WhaSales AI now handles order inquiries, size/color availability, pricing, and payment links instantly. The smart follow-ups recover abandoned carts automatically."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-600 mb-3">📈 The Results</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Cart abandonment: 70% → 15%</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Revenue up 380% in 3 months</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Handles 1,000+ msgs/day</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-semibold">Saved $1,200/mo on staff</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <p className="italic text-gray-700">
                      "I went from working 16 hours/day to 4 hours/day. The AI handles everything perfectly. My customers don't even know they're talking to AI - that's how good it is!"
                    </p>
                    <p className="text-sm font-semibold mt-2">- Maya Rahman, Boutique Owner</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regular Testimonials Grid */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold">More Success Stories</h3>
              <p className="text-gray-600">See what other businesses are saying</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Testimonial 1 */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      A
                    </div>
                    <div>
                      <CardTitle className="text-lg">Ahmed Al-Rahman</CardTitle>
                      <CardDescription>E-commerce Store Owner, Dubai</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600">
                    "WhaSales AI increased my sales by 250% in just 2 months! The AI responds instantly to customers 24/7. I'm closing deals while I sleep. Best investment ever!"
                  </p>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                      P
                    </div>
                    <div>
                      <CardTitle className="text-lg">Priya Sharma</CardTitle>
                      <CardDescription>Digital Marketing Agency, Mumbai</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600">
                    "Managing 50+ clients' WhatsApp chats was impossible. Now the AI handles initial responses and I only jump in when needed. Saved me 20 hours per week!"
                  </p>
                </CardContent>
              </Card>

              {/* Testimonial 3 */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xl">
                      M
                    </div>
                    <div>
                      <CardTitle className="text-lg">Muhammad Hassan</CardTitle>
                      <CardDescription>Real Estate Agency, Karachi</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600">
                    "The voice message transcription is a game-changer! No more listening to 100+ voice notes daily. AI understands everything and responds perfectly in Urdu too!"
                  </p>
                </CardContent>
              </Card>

              {/* Testimonial 4 */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      S
                    </div>
                    <div>
                      <CardTitle className="text-lg">Sarah Chen</CardTitle>
                      <CardDescription>Fashion Boutique, Kuala Lumpur</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600">
                    "Setup took literally 30 seconds - just scan QR code! The AI learned my product catalog from my website automatically. My customers think I hired a full team!"
                  </p>
                </CardContent>
              </Card>

              {/* Testimonial 5 */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      R
                    </div>
                    <div>
                      <CardTitle className="text-lg">Rajesh Kumar</CardTitle>
                      <CardDescription>Electronics Store, Bangalore</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600">
                    "The smart follow-ups are incredible! AI automatically reminds customers about abandoned carts. Recovered $15,000 in lost sales in the first month alone!"
                  </p>
                </CardContent>
              </Card>

              {/* Testimonial 6 */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      F
                    </div>
                    <div>
                      <CardTitle className="text-lg">Fatima Al-Mansoori</CardTitle>
                      <CardDescription>Beauty Products, Abu Dhabi</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600">
                    "I was skeptical at first, but the 14-day guarantee convinced me to try. Now I can't imagine running my business without it! Response time went from 2 hours to 3 seconds!"
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">1,000+</p>
                <p className="text-gray-600">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">98%</p>
                <p className="text-gray-600">Satisfaction Rate</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">24/7</p>
                <p className="text-gray-600">AI Support</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">&lt;3s</p>
                <p className="text-gray-600">Response Time</p>
              </div>
            </div>
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
                    After 3 days, you can choose a paid plan to continue using all features.
                    No credit card required for trial.
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

              <Card className="cursor-pointer" id="faq-api">
                <CardHeader>
                  <CardTitle>Do I need the official WhatsApp Business API?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    No! WhaSales AI works with your regular WhatsApp number - no official API required.
                    We use the same connection method as WhatsApp Web, so there's no complex Meta approval process.
                    Just scan the QR code and you're ready to go in 30 seconds.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How long does setup take?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Just 30 seconds! Simply scan the QR code with your WhatsApp, train the AI with your business info, and you're live. No technical setup, no coding, no complicated integrations needed.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Do I need technical skills?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    No, zero coding or technical skills required! Our platform is built for business owners, not developers. If you can use WhatsApp, you can use WhaSales AI. Everything is point-and-click simple.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Can I use my existing WhatsApp number?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes! Works with any WhatsApp number - personal or business. You don't need to change numbers or notify customers. Just connect your existing WhatsApp and start automating instantly.
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
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
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
                <li><Link href="/dashboard/support">Support Tickets</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
                <li>
                  <a href="mailto:support@whasalessai.com" className="hover:text-primary">
                    support@whasalessai.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.linkedin.com/company/whasales-ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/WhaSalesAI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">WhatsApp Compatible</p>
                <p className="text-xs text-gray-400 mt-1">Official Web API</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">No API Required</p>
                <p className="text-xs text-gray-400 mt-1">Works with any number</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">GDPR Compliant</p>
                <p className="text-xs text-gray-400 mt-1">Data privacy guaranteed</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">14-Day Guarantee</p>
                <p className="text-xs text-gray-400 mt-1">Money back promise</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 WhaSales AI. All rights reserved.</p>
            <p className="mt-2">
              Powered by{" "}
              <a
                href="https://arwebcrafts.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                AR Web Crafts
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

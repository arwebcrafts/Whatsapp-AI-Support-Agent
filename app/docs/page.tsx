import Link from "next/link";
import { ArrowLeft, BookOpen, MessageSquare, Bot, Zap, Settings, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know to get started with WhatsApp AI Support Agent
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>Get your AI agent up and running in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create Your Account</h3>
                  <p className="text-gray-600">Sign up and start your free trial. No credit card required.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect WhatsApp</h3>
                  <p className="text-gray-600">Scan the QR code with your WhatsApp to connect your account.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create an AI Agent</h3>
                  <p className="text-gray-600">Set up your AI agent with custom knowledge and personality.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Start Automating</h3>
                  <p className="text-gray-600">Your AI agent will now handle customer messages automatically!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Guides */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bot className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">AI Agents</CardTitle>
              <CardDescription>Create and manage your AI assistants</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Customize AI personality and tone</li>
                <li>• Train with your business knowledge</li>
                <li>• Multiple agents for different purposes</li>
                <li>• Template agents for quick setup</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Conversations</CardTitle>
              <CardDescription>Manage customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• View all customer conversations</li>
                <li>• Lead scoring and tracking</li>
                <li>• AI/Manual mode toggle</li>
                <li>• Conversation notes and tags</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Knowledge Base</CardTitle>
              <CardDescription>Train your AI with custom content</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Upload documents (PDF, DOCX)</li>
                <li>• Add manual content</li>
                <li>• Web scraping support</li>
                <li>• FAQ management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Settings className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">WhatsApp Setup</CardTitle>
              <CardDescription>Connect your WhatsApp account</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• QR code connection</li>
                <li>• Session management</li>
                <li>• Connection status monitoring</li>
                <li>• Automatic reconnection</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>Track performance and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Message volume tracking</li>
                <li>• Response time metrics</li>
                <li>• Customer engagement scores</li>
                <li>• AI learning insights</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Automation</CardTitle>
              <CardDescription>Set up automated workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Message templates</li>
                <li>• Auto-replies</li>
                <li>• Lead qualification</li>
                <li>• Smart routing</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Plan Limits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan Limits & Features</CardTitle>
            <CardDescription>Understanding your subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Starter Plan</h3>
                <ul className="space-y-1 text-sm text-gray-600 ml-4">
                  <li>• 1 WhatsApp connection</li>
                  <li>• 1 AI agent</li>
                  <li>• 2,000 messages/month</li>
                  <li>• Basic analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Professional Plan</h3>
                <ul className="space-y-1 text-sm text-gray-600 ml-4">
                  <li>• 1 WhatsApp connection</li>
                  <li>• 5 AI agents</li>
                  <li>• 10,000 messages/month</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Enterprise Plan</h3>
                <ul className="space-y-1 text-sm text-gray-600 ml-4">
                  <li>• 1 WhatsApp connection</li>
                  <li>• Unlimited AI agents</li>
                  <li>• Unlimited messages</li>
                  <li>• Custom integrations</li>
                  <li>• Dedicated support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Can I connect multiple WhatsApp accounts?</h3>
                <p className="text-gray-600 text-sm">
                  All plans (Starter, Professional, Enterprise, and LTD) support 1 WhatsApp connection. This ensures reliable performance and compliance with WhatsApp's terms of service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">How does the AI learn about my business?</h3>
                <p className="text-gray-600 text-sm">
                  You can train the AI by uploading documents, adding manual content, scraping your website, and creating FAQs. The AI also learns from successful conversations over time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Can I switch between AI and manual responses?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! You can toggle AI mode on/off for individual conversations, allowing you to take over manually when needed while keeping automation for other chats.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">What happens when I reach my message limit?</h3>
                <p className="text-gray-600 text-sm">
                  When you approach your limit, you'll receive notifications. You can upgrade your plan anytime to increase your message quota and continue automation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support CTA */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you succeed
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button variant="outline">Contact Support</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

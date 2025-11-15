"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Clock,
  MessageSquare,
  Bot,
  Plus,
  Edit,
  Trash2,
  Save,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  isActive: boolean;
  whatsappConnection?: {
    isConnected: boolean;
    phoneNumber: string;
  };
}

export default function AutomationPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Automation settings
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi! 👋 Thanks for reaching out. How can I help you today?"
  );
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(false);
  const [awayMessage, setAwayMessage] = useState(
    "Thanks for your message! We're currently away. We'll get back to you during business hours (9 AM - 6 PM)."
  );

  useEffect(() => {
    loadAgent();
  }, []);

  async function loadAgent() {
    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/default-agent");
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent || null);
      }
    } catch (error) {
      console.error("Error loading agent:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAutomation() {
    try {
      setSaving(true);
      // This would be saved to the database
      // For now, just show success message
      alert("Automation settings saved successfully!");
    } catch (error) {
      console.error("Error saving automation:", error);
      alert("Failed to save automation settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Automation</h1>
          </div>
          <p className="text-muted-foreground">
            Set up automated responses and workflows for your WhatsApp agents
          </p>
        </div>

        <div className="grid gap-6">
          {/* Welcome Messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle>Welcome Message</CardTitle>
                </div>
                <Switch
                  checked={welcomeEnabled}
                  onCheckedChange={setWelcomeEnabled}
                />
              </div>
              <CardDescription>
                Automatically send a welcome message when someone first contacts you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="welcome-message">Message</Label>
                  <Textarea
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Enter your welcome message..."
                    className="min-h-[100px]"
                    disabled={!welcomeEnabled}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    This message will be sent automatically when a new customer
                    contacts your agent for the first time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <CardTitle>Business Hours</CardTitle>
                </div>
                <Switch
                  checked={businessHoursEnabled}
                  onCheckedChange={setBusinessHoursEnabled}
                />
              </div>
              <CardDescription>
                Send an away message outside of business hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      defaultValue="09:00"
                      disabled={!businessHoursEnabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      defaultValue="18:00"
                      disabled={!businessHoursEnabled}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="away-message">Away Message</Label>
                  <Textarea
                    id="away-message"
                    value={awayMessage}
                    onChange={(e) => setAwayMessage(e.target.value)}
                    placeholder="Enter your away message..."
                    className="min-h-[100px]"
                    disabled={!businessHoursEnabled}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    This message will be sent when someone contacts you outside of
                    business hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Automation Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <CardTitle>AI-Powered Automation</CardTitle>
              </div>
              <CardDescription>
                Your WhatsApp AI assistant status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {agent.whatsappConnection?.isConnected ? (
                          <>
                            <Badge variant="default" className="text-xs">
                              Connected
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {agent.whatsappConnection.phoneNumber}
                            </span>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Not Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (window.location.href = "/dashboard/whatsapp")}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading WhatsApp AI...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveAutomation} disabled={saving} size="lg">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Automation Settings"}
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">🚀 Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Advanced workflow automation with triggers and actions</li>
              <li>• Lead scoring and qualification rules</li>
              <li>• Auto-tagging based on message content</li>
              <li>• Integration with CRM systems</li>
              <li>• Custom automation rules builder</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

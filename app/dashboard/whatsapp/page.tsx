"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, RefreshCw, ArrowRight } from "lucide-react";

export default function WhatsAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  useEffect(() => {
    loadDefaultAgent();
  }, []);

  useEffect(() => {
    if (agentId) {
      checkStatus();
      // Poll status every 3 seconds
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [agentId]);

  async function loadDefaultAgent() {
    setLoadingAgent(true);
    try {
      // Try to get user's first agent
      const res = await fetch('/api/agents');
      const data = await res.json();

      if (data.agents && data.agents.length > 0) {
        // Use first agent
        setAgentId(data.agents[0].id);
      } else {
        // No agents exist - redirect to agent creation
        router.push('/dashboard/agents/new');
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoadingAgent(false);
    }
  }

  async function checkStatus() {
    if (!agentId) return;

    try {
      const res = await fetch(`/api/whatsapp/status?agentId=${agentId}`);
      const data = await res.json();
      setStatus(data);
      setQrCode(data.qr);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }

  async function connect() {
    if (!agentId) {
      alert('No agent selected. Please create an agent first.');
      router.push('/dashboard/agents/new');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to connect WhatsApp');
        return;
      }

      const data = await res.json();
      setQrCode(data.qr);
      setStatus({ ...status, qr: data.qr });
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Failed to connect WhatsApp. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;

    setLoading(true);
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      });
      setQrCode(null);
      setStatus({ isConnected: false });
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loadingAgent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Connection</h1>
          <p className="text-gray-600">Connect your WhatsApp to start automating conversations</p>
        </div>

        {/* Multi-Agent Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">🤖 Using Multi-Agent System</h3>
                <p className="text-sm text-gray-700">
                  Each agent can have its own WhatsApp connection. This page manages your first agent's connection.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/agents')}
              >
                Manage Agents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {status?.isConnected ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    Connected
                  </CardTitle>
                  <CardDescription>Your WhatsApp is connected and active</CardDescription>
                </div>
                <Button variant="destructive" onClick={disconnect} disabled={loading}>
                  Disconnect
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="font-semibold">{status.phoneNumber || 'Not available'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Last Active</p>
                    <p className="font-semibold">
                      {status.lastActive
                        ? new Date(status.lastActive).toLocaleString()
                        : 'Just now'}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Connection Active</h4>
                  <p className="text-sm text-green-800">
                    Your AI agent is now active and will automatically respond to incoming WhatsApp messages.
                    Previous chats have been analyzed to better understand your conversation style.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📱 How it works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI analyzes your previous chats to learn your style</li>
                    <li>• Automatically responds to new messages</li>
                    <li>• Tries to convert cold leads from your history</li>
                    <li>• You can take over any conversation manually</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your WhatsApp</CardTitle>
              <CardDescription>
                Scan the QR code below with your WhatsApp to connect
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qrCode ? (
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                    <div className="flex items-center gap-2 mt-4">
                      <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <p className="text-sm text-gray-600">Waiting for scan...</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={connect}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh QR Code
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">How to scan:</h4>
                    <ol className="text-sm text-gray-700 space-y-1">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Tap Menu (⋮) or Settings</li>
                      <li>3. Tap "Linked Devices"</li>
                      <li>4. Tap "Link a Device"</li>
                      <li>5. Scan this QR code</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">📋 What happens next?</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>✓ Your previous WhatsApp chats will be imported</li>
                      <li>✓ AI will analyze conversations to understand your style</li>
                      <li>✓ Cold leads will be identified for potential follow-ups</li>
                      <li>✓ AI will start auto-responding to new messages</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Smartphone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Not Connected</h3>
                  <p className="text-gray-600 mb-6">
                    Click the button below to generate a QR code
                  </p>
                  <Button onClick={connect} disabled={loading} size="lg">
                    {loading ? 'Generating QR Code...' : 'Connect WhatsApp'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is this safe?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Yes! This uses the same technology as WhatsApp Web. It's an official WhatsApp
                connection method that doesn't violate any terms of service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Will my number get banned?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                No. As long as customers message you first (not spam), you're completely safe.
                This is a legitimate business use case supported by WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

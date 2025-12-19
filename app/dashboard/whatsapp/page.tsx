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
  const [agentError, setAgentError] = useState<string | null>(null);

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
    setAgentError(null);
    try {
      // Get or create user's default agent
      const res = await fetch('/api/whatsapp/default-agent');

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load agent (${res.status})`);
      }

      const data = await res.json();

      if (data.agent) {
        setAgentId(data.agent.id);
        setAgentError(null);
      } else {
        throw new Error('No agent returned from server');
      }
    } catch (error: any) {
      console.error('Error loading agent:', error);
      setAgentError(error?.message || 'Failed to load agent');
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

      // If reconnecting, show info to user
      if (data.reconnecting) {
        console.log('🔄 WhatsApp reconnecting after server restart or logout...');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }

  async function connect() {
    // If agentId is missing, try to reload it first
    if (!agentId) {
      console.log('Agent ID missing, attempting to reload...');
      setLoading(true);
      try {
        const res = await fetch('/api/whatsapp/default-agent');
        const data = await res.json();

        if (data.agent?.id) {
          setAgentId(data.agent.id);
          setAgentError(null);
          // Now connect with the reloaded agent ID
          await connectWithAgentId(data.agent.id);
        } else {
          alert('Could not load agent. Please refresh the page and try again.');
        }
      } catch (error) {
        console.error('Error reloading agent:', error);
        alert('Failed to load agent. Please refresh the page.');
      } finally {
        setLoading(false);
      }
      return;
    }

    await connectWithAgentId(agentId);
  }

  async function connectWithAgentId(agentIdToConnect: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentIdToConnect, force: true }), // Force clear previous session
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
    if (!agentId) return;

    setLoading(true);
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
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

  if (agentError && !agentId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-600 mb-4">{agentError}</p>
            <Button onClick={loadDefaultAgent} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
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
          <p className="text-gray-600">Connect your WhatsApp to start automating conversations with AI</p>
        </div>

        {status?.reconnecting ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
                Reconnecting...
              </CardTitle>
              <CardDescription>
                Restoring your WhatsApp connection (this happens automatically after logout or server restart)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Your WhatsApp connection is being restored. This usually takes just a few seconds.
                  The connection persists even when you logout and login.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : status?.isConnected ? (
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
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📱 How it works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Automatically responds to new incoming messages</li>
                    <li>• Uses your knowledge base to provide accurate answers</li>
                    <li>• Scores and tracks leads automatically</li>
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
                      <li>✓ Connection will be established with WhatsApp</li>
                      <li>✓ New incoming messages will be tracked</li>
                      <li>✓ AI will use your knowledge base to respond</li>
                      <li>✓ Leads will be automatically scored and tracked</li>
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bot,
  Smartphone,
  BookOpen,
  MessageSquare,
  Save,
  Power,
  PowerOff,
  Trash2,
  Upload,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Agent {
  id: string;
  name: string;
  description: string;
  businessType: string;
  aiTone: string;
  isActive: boolean;
  createdAt: string;
  whatsappConnection?: {
    id: string;
    isConnected: boolean;
    phoneNumber: string;
    qrCode?: string;
  };
  agentKnowledge: Array<{
    knowledge: {
      id: string;
      title: string;
      content: string;
      sourceType: string;
      createdAt: string;
    };
  }>;
  _count: {
    conversations: number;
  };
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aiTone, setAiTone] = useState("friendly");

  // Knowledge form
  const [newKnowledge, setNewKnowledge] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [scrapingWebsite, setScrapingWebsite] = useState(false);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  async function loadAgent() {
    try {
      setLoading(true);
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
        setName(data.agent.name);
        setDescription(data.agent.description || "");
        setAiTone(data.agent.aiTone);
      } else {
        router.push("/dashboard/agents");
      }
    } catch (error) {
      console.error("Error loading agent:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAgent() {
    setSaving(true);
    try {
      await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, aiTone }),
      });
      await loadAgent();
    } catch (error) {
      console.error("Error saving agent:", error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAgent() {
    try {
      await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !agent?.isActive }),
      });
      await loadAgent();
    } catch (error) {
      console.error("Error toggling agent:", error);
    }
  }

  async function connectWhatsApp() {
    setConnecting(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const data = await res.json();
      if (data.qr) {
        setQrCode(data.qr);
        // Poll for connection status
        const interval = setInterval(async () => {
          const statusRes = await fetch(`/api/whatsapp/status?agentId=${agentId}`);
          const statusData = await statusRes.json();
          if (statusData.isConnected) {
            clearInterval(interval);
            setQrCode(null);
            setConnecting(false);
            await loadAgent();
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      setConnecting(false);
    }
  }

  async function addKnowledge() {
    if (!newKnowledge.trim()) return;

    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newKnowledge,
          sourceType: "manual",
          agentId,
        }),
      });
      setNewKnowledge("");
      await loadAgent();
    } catch (error) {
      console.error("Error adding knowledge:", error);
    }
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agentId", agentId);

      await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      await loadAgent();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  }

  async function scrapeWebsite() {
    if (!websiteUrl.trim()) return;

    setScrapingWebsite(true);
    try {
      await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl, agentId }),
      });
      setWebsiteUrl("");
      await loadAgent();
    } catch (error) {
      console.error("Error scraping website:", error);
      alert("Failed to scrape website");
    } finally {
      setScrapingWebsite(false);
    }
  }

  async function deleteKnowledge(knowledgeId: string) {
    if (!confirm("Delete this knowledge entry?")) return;

    try {
      await fetch(`/api/knowledge/${knowledgeId}`, {
        method: "DELETE",
      });
      await loadAgent();
    } catch (error) {
      console.error("Error deleting knowledge:", error);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Bot className="h-12 w-12 animate-pulse text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/agents">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {agent.name}
                {agent.isActive ? (
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </h1>
              <p className="text-gray-600">{agent.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleAgent}>
              {agent.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversations
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent._count.conversations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Knowledge Items
              </CardTitle>
              <BookOpen className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.agentKnowledge.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                WhatsApp Status
              </CardTitle>
              <Smartphone className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    agent.whatsappConnection?.isConnected
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {agent.whatsappConnection?.isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Settings</CardTitle>
                <CardDescription>Configure your agent's behavior and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="aiTone">AI Tone</Label>
                  <select
                    id="aiTone"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="direct">Direct</option>
                    <option value="warm">Warm</option>
                  </select>
                </div>

                <Button onClick={saveAgent} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            {/* Add Manual Knowledge */}
            <Card>
              <CardHeader>
                <CardTitle>Add Knowledge Manually</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={newKnowledge}
                  onChange={(e) => setNewKnowledge(e.target.value)}
                  placeholder="Add business information, product details, policies, etc..."
                  className="h-32"
                  maxLength={10000}
                />
                <p className="text-xs text-gray-500">
                  {newKnowledge.length} / 10,000 characters
                </p>
                <Button onClick={addKnowledge}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              </CardContent>
            </Card>

            {/* Upload File */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Upload PDF, Word, or text files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={uploadFile}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button disabled={uploadingFile} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFile ? "Uploading..." : "Choose File"}
                      </span>
                    </Button>
                  </label>
                  <p className="text-sm text-gray-600">
                    Max 10MB • PDF, DOCX, TXT
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scrape Website */}
            <Card>
              <CardHeader>
                <CardTitle>Scrape Website</CardTitle>
                <CardDescription>Import content from your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    type="url"
                  />
                  <Button onClick={scrapeWebsite} disabled={scrapingWebsite}>
                    <Globe className="h-4 w-4 mr-2" />
                    {scrapingWebsite ? "Scraping..." : "Scrape"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Knowledge */}
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base ({agent.agentKnowledge.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {agent.agentKnowledge.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No knowledge added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agent.agentKnowledge.map(({ knowledge }) => (
                      <div key={knowledge.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{knowledge.sourceType}</Badge>
                              {knowledge.title && (
                                <span className="text-sm font-medium">{knowledge.title}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {knowledge.content}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteKnowledge(knowledge.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Connection</CardTitle>
                <CardDescription>Connect this agent to a WhatsApp number</CardDescription>
              </CardHeader>
              <CardContent>
                {agent.whatsappConnection?.isConnected ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold">Connected</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Phone: {agent.whatsappConnection.phoneNumber}
                      </p>
                    </div>
                    <Button variant="outline">Disconnect</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {qrCode ? (
                      <div className="text-center">
                        <p className="mb-4 text-sm text-gray-600">
                          Scan this QR code with WhatsApp on your phone
                        </p>
                        <div className="inline-block p-4 bg-white rounded-lg border">
                          <Image src={qrCode} alt="WhatsApp QR Code" width={256} height={256} />
                        </div>
                        <p className="mt-4 text-xs text-gray-500">
                          Waiting for connection...
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-4">
                          Connect a WhatsApp number to this agent to start receiving messages
                        </p>
                        <Button onClick={connectWhatsApp} disabled={connecting}>
                          <Smartphone className="h-4 w-4 mr-2" />
                          {connecting ? "Connecting..." : "Connect WhatsApp"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

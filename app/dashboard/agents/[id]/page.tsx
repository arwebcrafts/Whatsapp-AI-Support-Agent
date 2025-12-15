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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Edit,
  Plus,
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
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [aiTone, setAiTone] = useState("friendly");
  const [responseDelay, setResponseDelay] = useState(5);

  // Knowledge form
  const [newKnowledge, setNewKnowledge] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [scrapingWebsite, setScrapingWebsite] = useState(false);

  // Knowledge edit states
  const [editingKnowledge, setEditingKnowledge] = useState<any>(null);
  const [isKnowledgeDialogOpen, setIsKnowledgeDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState("");

  // Tab state - to keep user on current tab after operations
  const [activeTab, setActiveTab] = useState("settings");

  // FAQ states
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqFormData, setFaqFormData] = useState({
    question: "",
    answer: "",
    category: "general",
  });

  useEffect(() => {
    loadAgent();
    loadFaqs();
  }, [agentId]);

  async function loadAgent(options?: { preserveKnowledge?: boolean }) {
    try {
      setLoading(true);
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
        setName(data.agent.name);
        setBusinessName(data.agent.businessName || "");
        setDescription(data.agent.description || "");
        setAiTone(data.agent.aiTone);
        setResponseDelay(data.agent.responseDelay || 5);

        // Load manual knowledge base content into the field
        // BUT only if we're not preserving existing unsaved content
        if (!options?.preserveKnowledge) {
          const manualKnowledge = data.agent.agentKnowledge
            .filter((ak: any) => ak.knowledge.sourceType === "manual")
            .map((ak: any) => ak.knowledge.content)
            .join("\n\n---\n\n");
          setNewKnowledge(manualKnowledge);
        }
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
        body: JSON.stringify({ name, businessName, description, aiTone, responseDelay }),
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

    setSaving(true);
    try {
      // Delete all existing manual knowledge entries for this agent
      if (agent?.agentKnowledge) {
        const manualEntries = agent.agentKnowledge.filter(
          (ak: any) => ak.knowledge.sourceType === "manual"
        );

        for (const entry of manualEntries) {
          await fetch(`/api/knowledge/${entry.knowledge.id}`, {
            method: "DELETE",
          });
        }
      }

      // Create new single manual knowledge entry with all content
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newKnowledge,
          sourceType: "manual",
          agentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to save knowledge:", data.message || 'Unknown error');
        return;
      }

      // Reload agent data in background without resetting field or tabs
      const agentRes = await fetch(`/api/agents/${agentId}`);
      if (agentRes.ok) {
        const data = await agentRes.json();
        setAgent(data.agent);
      }

      // Content stays in field, no popup, no redirect
    } catch (error) {
      console.error("Error saving knowledge:", error);
    } finally {
      setSaving(false);
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

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to upload file: ${data.message || 'Unknown error'}`);
        return;
      }

      // Reload agent data but preserve any unsaved manual knowledge content
      await loadAgent({ preserveKnowledge: true });
      alert(`File "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Network error while uploading file. Please check your connection.");
    } finally {
      setUploadingFile(false);
    }
  }

  async function scrapeWebsite() {
    if (!websiteUrl.trim()) return;

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      alert("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setScrapingWebsite(true);
    try {
      const res = await fetch("/api/knowledge/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl, agentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to scrape website: ${data.message || 'Unknown error'}\n\nPlease make sure the website is accessible and not blocking scrapers.`);
        return;
      }

      const data = await res.json();
      setWebsiteUrl("");
      // Reload agent data but preserve any unsaved manual knowledge content
      await loadAgent({ preserveKnowledge: true });
      alert(`Website scraped successfully!\nTitle: ${data.knowledge?.title || 'Unknown'}`);
    } catch (error) {
      console.error("Error scraping website:", error);
      alert("Network error while scraping website. Please check your connection and try again.");
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
      // Preserve manual knowledge content when deleting uploaded files/scraped websites
      await loadAgent({ preserveKnowledge: true });
    } catch (error) {
      console.error("Error deleting knowledge:", error);
    }
  }

  function openEditKnowledgeDialog(knowledge: any) {
    setEditingKnowledge(knowledge);
    setEditContent(knowledge.content);
    setIsKnowledgeDialogOpen(true);
  }

  async function updateKnowledge() {
    if (!editContent.trim() || !editingKnowledge) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/knowledge/${editingKnowledge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to update knowledge");
        return;
      }

      setIsKnowledgeDialogOpen(false);
      setEditingKnowledge(null);
      setEditContent("");
      // Preserve manual knowledge content when editing uploaded files/scraped websites
      await loadAgent({ preserveKnowledge: true });
      alert("Knowledge updated successfully!");
    } catch (error) {
      console.error("Error updating knowledge:", error);
      alert("Failed to update knowledge. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function loadFaqs() {
    try {
      const res = await fetch(`/api/agents/${agentId}/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } catch (error) {
      console.error("Error loading FAQs:", error);
    }
  }

  async function handleFaqSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    try {
      if (editingFaq) {
        await fetch(`/api/agents/${agentId}/faqs/${editingFaq.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(faqFormData),
        });
      } else {
        await fetch(`/api/agents/${agentId}/faqs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(faqFormData),
        });
      }

      setIsFaqDialogOpen(false);
      setEditingFaq(null);
      setFaqFormData({ question: "", answer: "", category: "general" });
      await loadFaqs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFaq(faqId: string) {
    if (!confirm("Delete this FAQ?")) return;

    try {
      await fetch(`/api/agents/${agentId}/faqs/${faqId}`, {
        method: "DELETE",
      });
      await loadFaqs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  }

  function openCreateFaqDialog() {
    setEditingFaq(null);
    setFaqFormData({ question: "", answer: "", category: "general" });
    setIsFaqDialogOpen(true);
  }

  function openEditFaqDialog(faq: any) {
    setEditingFaq(faq);
    setFaqFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
    setIsFaqDialogOpen(true);
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
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Bot className="h-12 w-12 text-gray-400" />
          <p className="text-gray-600">Agent not found</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
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
                    placeholder="e.g., Sarah, Alex, John"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">This is how your agent will introduce itself</p>
                </div>

                <div>
                  <Label htmlFor="businessName">Business Name (Optional)</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Air Web Crafts, Tech Solutions"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your business/company name for a professional introduction</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the agent's role"
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

                <div>
                  <Label htmlFor="responseDelay">Response Delay (seconds)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    min="3"
                    max="30"
                    value={responseDelay}
                    onChange={(e) => setResponseDelay(parseInt(e.target.value) || 5)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long to wait before responding (3-30 seconds). Recommended: 5-6 seconds
                  </p>
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
            {/* Manual Knowledge Base Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Knowledge Base</CardTitle>
                <CardDescription>
                  Your agent's knowledge - edit anytime, formatting preserved (links, bullets, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={newKnowledge}
                  onChange={(e) => setNewKnowledge(e.target.value)}
                  placeholder="Type or paste your business information here...

Examples:
• Product catalog with links
• Pricing and offers
• Policies and FAQs
• Contact information

Everything you add here stays in this field. Your AI learns from it and responds accordingly."
                  className="min-h-[400px] font-mono text-sm"
                  maxLength={50000}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {newKnowledge.length} / 50,000 characters
                  </p>
                  <Button onClick={addKnowledge} disabled={saving} size="lg">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Knowledge Base"}
                  </Button>
                </div>
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

            {/* Uploaded Files & Scraped Websites */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Uploaded Documents & Scraped Websites ({agent.agentKnowledge.filter((ak: any) => ak.knowledge.sourceType !== "manual").length})
                </CardTitle>
                <CardDescription>
                  Files and websites added to this agent's knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agent.agentKnowledge.filter((ak: any) => ak.knowledge.sourceType !== "manual").length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No files or websites added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agent.agentKnowledge
                      .filter((ak: any) => ak.knowledge.sourceType !== "manual")
                      .map(({ knowledge }) => (
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
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditKnowledgeDialog(knowledge)}
                              title="Edit knowledge"
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteKnowledge(knowledge.id)}
                              title="Delete knowledge"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
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

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Add common questions and answers for this agent
                    </CardDescription>
                  </div>
                  <Button onClick={openCreateFaqDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No FAQs yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first FAQ to help your AI provide better answers
                    </p>
                    <Button onClick={openCreateFaqDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First FAQ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{faq.question}</span>
                              <Badge variant="secondary">{faq.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-700">{faq.answer}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditFaqDialog(faq)}
                              title="Edit FAQ"
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteFaq(faq.id)}
                              title="Delete FAQ"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Knowledge Edit Dialog */}
        <Dialog open={isKnowledgeDialogOpen} onOpenChange={setIsKnowledgeDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Knowledge Base Entry</DialogTitle>
              <DialogDescription>
                Update your business information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your business information..."
                  className="min-h-[300px]"
                  maxLength={50000}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {editContent.length} / 50,000 characters
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsKnowledgeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updateKnowledge} disabled={saving}>
                Update Knowledge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FAQ Dialog */}
        <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFaq ? "Edit FAQ" : "Create New FAQ"}
              </DialogTitle>
              <DialogDescription>
                {editingFaq
                  ? "Update your frequently asked question"
                  : "Add a common question and answer to help your AI"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFaqSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="faq-question">Question</Label>
                  <Input
                    id="faq-question"
                    value={faqFormData.question}
                    onChange={(e) =>
                      setFaqFormData({ ...faqFormData, question: e.target.value })
                    }
                    placeholder="What's your delivery time?"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="faq-answer">Answer</Label>
                  <Textarea
                    id="faq-answer"
                    value={faqFormData.answer}
                    onChange={(e) =>
                      setFaqFormData({ ...faqFormData, answer: e.target.value })
                    }
                    placeholder="We deliver in 3-5 business days to all locations."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="faq-category">Category</Label>
                  <Input
                    id="faq-category"
                    value={faqFormData.category}
                    onChange={(e) =>
                      setFaqFormData({ ...faqFormData, category: e.target.value })
                    }
                    placeholder="general"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFaqDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {editingFaq ? "Update" : "Create"} FAQ
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

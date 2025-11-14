"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { agentTemplates, AgentTemplate } from "@/lib/agent-templates";

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [aiTone, setAiTone] = useState("friendly");
  const [knowledgeContent, setKnowledgeContent] = useState("");

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setBusinessType(template.businessType);
    setAiTone(template.aiTone);
    setKnowledgeContent(template.defaultKnowledge);
  };

  const handleCreateAgent = async () => {
    if (!name.trim()) {
      alert("Please enter an agent name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          businessType,
          aiTone,
          knowledgeContent: knowledgeContent.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/agents/${data.agent.id}`);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create New AI Agent</h1>
            <p className="text-gray-600">
              Choose a pre-built template or create a custom agent
            </p>
          </div>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">
              <Sparkles className="h-4 w-4 mr-2" />
              Pre-built Templates
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Bot className="h-4 w-4 mr-2" />
              Custom Agent
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose a Template</CardTitle>
                <CardDescription>
                  Start with a pre-configured agent optimized for your industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agentTemplates.map((template) => (
                    <Card
                      key={template.businessType}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedTemplate?.businessType === template.businessType
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-3xl">{template.icon}</span>
                          <Badge className="text-xs">
                            {template.aiTone}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {selectedTemplate && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      {selectedTemplate.name}
                    </h4>
                    <p className="text-sm text-gray-700 mb-4">
                      {selectedTemplate.description}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label>Agent Name</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Give your agent a name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Description (Optional)</Label>
                        <Input
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>AI Tone</Label>
                        <select
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
                        <Label>Initial Knowledge Base</Label>
                        <Textarea
                          value={knowledgeContent}
                          onChange={(e) => setKnowledgeContent(e.target.value)}
                          placeholder="Add your business information..."
                          className="mt-1 h-32"
                          maxLength={10000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {knowledgeContent.length} / 10,000 characters
                        </p>
                      </div>
                      <Button
                        onClick={handleCreateAgent}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? "Creating..." : "Create Agent from Template"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Custom Agent</CardTitle>
                <CardDescription>
                  Build your own AI agent from scratch with custom settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custom-name">Agent Name *</Label>
                  <Input
                    id="custom-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Sales Agent"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="custom-description">Description</Label>
                  <Input
                    id="custom-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this agent's purpose"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="custom-business-type">Business Type</Label>
                  <select
                    id="custom-business-type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="">Select a type</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="realestate">Real Estate</option>
                    <option value="education">Education</option>
                    <option value="agency">Agency/Freelancer</option>
                    <option value="restaurant">Restaurant/Food</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="automotive">Automotive</option>
                    <option value="saas">SaaS/Technology</option>
                    <option value="support">Customer Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="custom-tone">AI Tone</Label>
                  <select
                    id="custom-tone"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="professional">Professional - Formal and business-focused</option>
                    <option value="friendly">Friendly - Warm and approachable</option>
                    <option value="direct">Direct - Straight to the point</option>
                    <option value="warm">Warm - Caring and empathetic</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="custom-knowledge">Knowledge Base</Label>
                  <Textarea
                    id="custom-knowledge"
                    value={knowledgeContent}
                    onChange={(e) => setKnowledgeContent(e.target.value)}
                    placeholder="Add information about your business, products, services, pricing, policies, etc..."
                    className="mt-1 h-48"
                    maxLength={10000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {knowledgeContent.length} / 10,000 characters
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 You can also add knowledge later by uploading PDFs, Word documents, or scraping your website
                  </p>
                </div>

                <Button
                  onClick={handleCreateAgent}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Creating..." : "Create Custom Agent"}
                </Button>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">💡 Tips for Better Agents</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Be specific:</strong> Include detailed product/service information
                </p>
                <p>
                  <strong>Add pricing:</strong> Clear pricing helps AI respond accurately
                </p>
                <p>
                  <strong>Include policies:</strong> Refund, shipping, warranty information
                </p>
                <p>
                  <strong>Use examples:</strong> Sample questions and ideal responses
                </p>
                <p>
                  <strong>Keep updated:</strong> Regularly update knowledge as your business changes
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

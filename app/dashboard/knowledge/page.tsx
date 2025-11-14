"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, Edit, Upload, Globe, FileText } from "lucide-react";

export default function KnowledgeBasePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scrapingWebsite, setScrapingWebsite] = useState(false);

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function loadKnowledge() {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setKnowledgeItems(data.items || []);
    } catch (error) {
      console.error("Error loading knowledge:", error);
    }
  }

  async function addKnowledge() {
    if (!newContent.trim()) return;

    setLoading(true);
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          sourceType: "manual",
        }),
      });

      setNewContent("");
      await loadKnowledge();
    } catch (error) {
      console.error("Error adding knowledge:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteKnowledge(id: string) {
    if (!confirm("Are you sure you want to delete this knowledge entry?")) return;

    try {
      await fetch(`/api/knowledge/${id}`, {
        method: "DELETE",
      });
      await loadKnowledge();
    } catch (error) {
      console.error("Error deleting knowledge:", error);
    }
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await loadKnowledge();
        // Reset the file input
        event.target.value = "";
      } else {
        const error = await res.json();
        alert(error.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  }

  async function scrapeWebsite() {
    if (!websiteUrl.trim()) {
      alert("Please enter a website URL");
      return;
    }

    // Basic URL validation
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
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (res.ok) {
        setWebsiteUrl("");
        await loadKnowledge();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to scrape website");
      }
    } catch (error) {
      console.error("Error scraping website:", error);
      alert("Failed to scrape website");
    } finally {
      setScrapingWebsite(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-gray-600">
            Train your AI agent with information about your business
          </p>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="manual">
              <FileText className="h-4 w-4 mr-2" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="website">
              <Globe className="h-4 w-4 mr-2" />
              Scrape Website
            </TabsTrigger>
            <TabsTrigger value="existing">
              <BookOpen className="h-4 w-4 mr-2" />
              View All
            </TabsTrigger>
            <TabsTrigger value="faq">FAQs</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Business Information</CardTitle>
                <CardDescription>
                  Tell your AI about your products, services, pricing, policies, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="content">Business Information</Label>
                    <textarea
                      id="content"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Example: We offer handmade leather bags in 3 sizes (small, medium, large). Prices range from $50-200. We ship worldwide in 3-5 business days. 30-day money-back guarantee..."
                      className="w-full h-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                      maxLength={50000}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {newContent.length} / 50,000 characters (up to 10,000+ words)
                    </p>
                  </div>

                  <Button onClick={addKnowledge} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Knowledge Base
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 What to include</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Products/Services</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• What you sell</li>
                      <li>• Features and benefits</li>
                      <li>• Available options/variants</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Pricing</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Price ranges</li>
                      <li>• Discounts and promotions</li>
                      <li>• Payment methods</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Policies</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Return/refund policy</li>
                      <li>• Warranty information</li>
                      <li>• Terms and conditions</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Shipping/Delivery</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Delivery timeframes</li>
                      <li>• Shipping costs</li>
                      <li>• Coverage areas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload File Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload PDF, Word (.docx), or text files to extract knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={uploadFile}
                    className="hidden"
                    id="file-upload-input"
                    disabled={uploadingFile}
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      {uploadingFile ? "Uploading..." : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOCX, or TXT files (Max 10MB)
                    </p>
                  </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-2">📄 Supported File Types</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>PDF:</strong> Extracts all text content from PDF documents</li>
                    <li>• <strong>Word (.docx):</strong> Extracts text from Microsoft Word documents</li>
                    <li>• <strong>Text (.txt):</strong> Direct import of plain text files</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scrape Website Tab */}
          <TabsContent value="website" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scrape Website Content</CardTitle>
                <CardDescription>
                  Automatically import content from your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website-url">Website URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="website-url"
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="flex-1"
                      disabled={scrapingWebsite}
                    />
                    <Button onClick={scrapeWebsite} disabled={scrapingWebsite || !websiteUrl.trim()}>
                      <Globe className="h-4 w-4 mr-2" />
                      {scrapingWebsite ? "Scraping..." : "Scrape"}
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold mb-2">🌐 How It Works</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Enter your website URL and click "Scrape"</li>
                    <li>• We extract the main content from the page</li>
                    <li>• Scripts, styles, and navigation are removed</li>
                    <li>• Clean content is added to your knowledge base</li>
                    <li>• You can scrape multiple pages by repeating the process</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold mb-2">💡 Tips</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Scrape your about page, product pages, FAQ page</li>
                    <li>• Make sure the URL starts with https:// or http://</li>
                    <li>• Some websites may block automated scraping</li>
                    <li>• Maximum content: 50,000 characters per page</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Knowledge Base</CardTitle>
                <CardDescription>
                  {knowledgeItems.length} entries in your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                {knowledgeItems.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No knowledge added yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start adding information to train your AI agent
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {knowledgeItems.map((item) => {
                      const sourceTypeColors: Record<string, string> = {
                        manual: "bg-blue-100 text-blue-700",
                        pdf: "bg-red-100 text-red-700",
                        word: "bg-purple-100 text-purple-700",
                        text: "bg-gray-100 text-gray-700",
                        website: "bg-green-100 text-green-700",
                      };

                      const sourceTypeIcons: Record<string, string> = {
                        manual: "📝",
                        pdf: "📄",
                        word: "📃",
                        text: "📋",
                        website: "🌐",
                      };

                      return (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={sourceTypeColors[item.sourceType] || "bg-gray-100 text-gray-700"}>
                                  {sourceTypeIcons[item.sourceType]} {item.sourceType.toUpperCase()}
                                </Badge>
                                {item.title && (
                                  <span className="text-sm font-medium">{item.title}</span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-4">
                                {item.content}
                              </p>
                              {item.sourceUrl && (
                                <p className="text-xs text-blue-600 mt-2">
                                  Source: {item.sourceUrl}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteKnowledge(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Add common questions and answers for better AI responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    💡 FAQ builder coming soon! For now, you can add FAQs in the Manual Input tab
                    using this format:
                  </p>
                  <p className="text-sm text-yellow-800 mt-2 font-mono">
                    Q: What's your delivery time?
                    <br />
                    A: We deliver in 3-5 business days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Trash2, Edit } from "lucide-react";

export default function KnowledgeBasePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);

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
          <TabsList>
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
            <TabsTrigger value="existing">Existing Knowledge</TabsTrigger>
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
                      className="w-full h-48 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                      maxLength={5000}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {newContent.length} / 5000 characters
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
                    {knowledgeItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {item.sourceType}
                              </span>
                              <span className="text-xs text-gray-500">
                                Added {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {item.content}
                            </p>
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
                    ))}
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

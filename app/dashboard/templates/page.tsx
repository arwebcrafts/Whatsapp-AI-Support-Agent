"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  MessageSquare,
  Clock,
  Star,
} from "lucide-react";

export default function TemplatesPage() {
  const templates = [
    {
      id: 1,
      name: "Welcome Message",
      category: "Greetings",
      message: "Hi! 👋 Thanks for reaching out. How can I help you today?",
      usage: 45,
    },
    {
      id: 2,
      name: "Product Inquiry",
      category: "Sales",
      message: "Great question! We have several products that might interest you. What are you looking for specifically?",
      usage: 32,
    },
    {
      id: 3,
      name: "Business Hours",
      category: "Info",
      message: "Our business hours are Monday-Friday, 9 AM - 6 PM. We'll get back to you during working hours!",
      usage: 28,
    },
    {
      id: 4,
      name: "Thank You",
      category: "Follow-up",
      message: "Thank you for your interest! Feel free to reach out if you have any questions. 😊",
      usage: 21,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Message Templates</h1>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
          <p className="text-muted-foreground">
            Pre-written message templates for quick responses
          </p>
        </div>

        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="mt-1">
                        {template.category}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>Used {template.usage} times</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm">{template.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                  <Button variant="outline" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Section */}
        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">🚀 Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Template variables (customer name, product, etc.)</li>
              <li>• Multi-language template support</li>
              <li>• Template categories and folders</li>
              <li>• Rich media templates (images, videos)</li>
              <li>• Template performance analytics</li>
              <li>• Quick reply shortcuts</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

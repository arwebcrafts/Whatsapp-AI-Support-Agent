"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Star,
  Edit,
  Trash2,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  message: string;
  usageCount: number;
  isActive: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "general",
    message: "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingTemplate) {
        // Update existing template
        await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new template
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ name: "", category: "general", message: "" });
      await loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });
      await loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    }
  }

  function openCreateDialog() {
    setEditingTemplate(null);
    setFormData({ name: "", category: "general", message: "" });
    setIsDialogOpen(true);
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message: template.message,
    });
    setIsDialogOpen(true);
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Message Templates</h1>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
          <p className="text-muted-foreground">
            Pre-written message templates for quick responses
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first message template to save time on common responses
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
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
                      <span>Used {template.usageCount} times</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="text-sm whitespace-pre-wrap">{template.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(template.message);
                        alert("Template copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? "Update your message template"
                  : "Create a reusable message template for quick responses"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Welcome Message"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="greetings">Greetings</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Hi! 👋 Thanks for reaching out. How can I help you today?"
                    rows={6}
                    required
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

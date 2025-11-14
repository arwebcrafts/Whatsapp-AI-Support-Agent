"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, MessageSquare, Smartphone, Edit, Trash2, Power, PowerOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string;
  description: string;
  businessType: string;
  aiTone: string;
  isActive: boolean;
  createdAt: string;
  whatsappConnection?: {
    isConnected: boolean;
    phoneNumber: string;
  };
  agentKnowledge: Array<{ knowledge: any }>;
  _count: {
    conversations: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      setLoading(true);
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAgent(id: string, currentStatus: boolean) {
    try {
      await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      await loadAgents();
    } catch (error) {
      console.error("Error toggling agent:", error);
    }
  }

  async function deleteAgent(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all its conversations and knowledge base.`)) {
      return;
    }

    try {
      await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });
      await loadAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  }

  const getBusinessTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      ecommerce: "🛍️",
      realestate: "🏠",
      education: "🎓",
      agency: "💼",
      restaurant: "🍽️",
      healthcare: "🏥",
      automotive: "🚗",
      saas: "💻",
      support: "💬",
    };
    return icons[type] || "🤖";
  };

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      professional: "bg-blue-100 text-blue-700",
      friendly: "bg-green-100 text-green-700",
      direct: "bg-purple-100 text-purple-700",
      warm: "bg-orange-100 text-orange-700",
    };
    return colors[tone] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Loading agents...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Agents</h1>
            <p className="text-gray-600">
              Manage your AI sales agents and their WhatsApp connections
            </p>
          </div>
          <Link href="/dashboard/agents/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create New Agent
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Agents
              </CardTitle>
              <Bot className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Agents
              </CardTitle>
              <Power className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Connected
              </CardTitle>
              <Smartphone className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.whatsappConnection?.isConnected).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bot className="h-20 w-20 mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Create your first AI agent to start handling WhatsApp conversations automatically
              </p>
              <Link href="/dashboard/agents/new">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Agent
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">
                        {getBusinessTypeIcon(agent.businessType)}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {agent.name}
                          {agent.isActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {agent.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Agent Info */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getToneColor(agent.aiTone)}>
                      {agent.aiTone.charAt(0).toUpperCase() + agent.aiTone.slice(1)} Tone
                    </Badge>
                    <Badge variant="outline">
                      {agent.businessType.charAt(0).toUpperCase() + agent.businessType.slice(1)}
                    </Badge>
                    <Badge variant="outline">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {agent._count?.conversations || 0} chats
                    </Badge>
                    <Badge variant="outline">
                      📚 {agent._count?.agentKnowledge || 0} knowledge items
                    </Badge>
                  </div>

                  {/* WhatsApp Status */}
                  <div className={`p-3 rounded-lg border ${
                    agent.whatsappConnection?.isConnected
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${
                        agent.whatsappConnection?.isConnected
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}></div>
                      <span className="font-semibold text-sm">
                        {agent.whatsappConnection?.isConnected
                          ? "WhatsApp Connected"
                          : "WhatsApp Not Connected"}
                      </span>
                    </div>
                    {agent.whatsappConnection?.phoneNumber && (
                      <p className="text-xs text-gray-600 ml-4">
                        {agent.whatsappConnection.phoneNumber}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/agents/${agent.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAgent(agent.id, agent.isActive)}
                    >
                      {agent.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAgent(agent.id, agent.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">💡 About AI Agents</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>
              • Each agent can be connected to a different WhatsApp number
            </p>
            <p>
              • Agents have their own knowledge base and conversation history
            </p>
            <p>
              • You can create unlimited agents for different business needs
            </p>
            <p>
              • Use pre-built templates or create custom agents from scratch
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

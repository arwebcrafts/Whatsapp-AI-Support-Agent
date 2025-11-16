"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Zap,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

interface AgentInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  successRate?: number;
  usageCount: number;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PerformanceMetrics {
  totalConversations: number;
  successfulConversations: number;
  resolutionRate: number;
  averageSatisfaction: number;
  averageSentiment: number;
  avgResponseTime: number;
  improvementScore: number;
}

interface LearningEvent {
  id: string;
  eventType: string;
  description: string;
  impactScore: number;
  createdAt: string;
}

export default function AgentLearningPage() {
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [learningLog, setLearningLog] = useState<LearningEvent[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [runningLearning, setRunningLearning] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentData(selectedAgent);
    }
  }, [selectedAgent]);

  async function loadAgents() {
    try {
      setLoading(true);
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        if (data.agents && data.agents.length > 0) {
          setSelectedAgent(data.agents[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentData(agentId: string) {
    try {
      // Load insights
      const insightsRes = await fetch(`/api/agent/insights?agentId=${agentId}&activeOnly=true`);
      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.insights.all || []);
      }

      // Load performance
      const perfRes = await fetch(`/api/agent/performance?agentId=${agentId}&periodType=daily`);
      if (perfRes.ok) {
        const data = await perfRes.json();
        setPerformance(data.latest);
        setLearningLog(data.learningLog || []);
        setTrends(data.trends);
      }
    } catch (error) {
      console.error("Error loading agent data:", error);
    }
  }

  async function runLearningCycle() {
    if (!selectedAgent) return;

    try {
      setRunningLearning(true);
      const res = await fetch("/api/agent/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Learning cycle completed! Generated ${data.insightsGenerated} new insights.`);
        loadAgentData(selectedAgent);
      } else {
        throw new Error("Failed to run learning cycle");
      }
    } catch (error) {
      console.error("Error running learning cycle:", error);
      alert("Failed to run learning cycle");
    } finally {
      setRunningLearning(false);
    }
  }

  async function toggleInsightApproval(insightId: string, currentApproval: boolean) {
    try {
      const res = await fetch("/api/agent/insights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, isApproved: !currentApproval })
      });

      if (res.ok && selectedAgent) {
        loadAgentData(selectedAgent);
      }
    } catch (error) {
      console.error("Error toggling insight:", error);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Agent Learning & Performance</h1>
            </div>
            {selectedAgent && (
              <Button onClick={runLearningCycle} disabled={runningLearning}>
                {runningLearning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Learning Cycle
                  </>
                )}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            Track agent performance and insights generated from conversations
          </p>
        </div>

        {/* Agent Selector */}
        {agents.length > 0 && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Select Agent</label>
            <select
              value={selectedAgent || ""}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full max-w-md px-3 py-2 border rounded-lg"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.businessType || "General"}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedAgent ? (
          <div className="space-y-6">
            {/* Performance Overview */}
            {performance && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance.resolutionRate?.toFixed(1) || 0}%</div>
                    {trends?.resolutionRate && (
                      <div className={`text-xs flex items-center gap-1 mt-1 ${
                        trends.resolutionRate > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.resolutionRate > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trends.resolutionRate).toFixed(1)}% from last period
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Conversations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance.totalConversations}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {performance.successfulConversations} successful
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance.averageSatisfaction?.toFixed(1) || 'N/A'}</div>
                    {trends?.satisfaction && (
                      <div className={`text-xs flex items-center gap-1 mt-1 ${
                        trends.satisfaction > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.satisfaction > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trends.satisfaction).toFixed(2)} from last period
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Avg Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance.avgResponseTime?.toFixed(0) || 0}s</div>
                    {trends?.responseTime && (
                      <div className={`text-xs flex items-center gap-1 mt-1 ${
                        trends.responseTime > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.responseTime > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trends.responseTime).toFixed(0)}s improvement
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Insights Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <CardTitle>Discovered Insights</CardTitle>
                  </div>
                  <Badge variant="secondary">{insights.length} Total</Badge>
                </div>
                <CardDescription>
                  Patterns and learnings discovered from conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No insights yet. Run a learning cycle to generate insights.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.slice(0, 10).map((insight) => (
                      <div
                        key={insight.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              insight.insightType === 'successful_pattern' ? 'default' :
                              insight.insightType === 'performance_issue' ? 'destructive' :
                              'secondary'
                            }>
                              {insight.insightType.replace('_', ' ')}
                            </Badge>
                            {insight.category && (
                              <Badge variant="outline">{insight.category}</Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={insight.isApproved ? "default" : "outline"}
                            onClick={() => toggleInsightApproval(insight.id, insight.isApproved)}
                          >
                            {insight.isApproved ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Review
                              </>
                            )}
                          </Button>
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                          {insight.successRate && (
                            <span>Success: {(insight.successRate * 100).toFixed(0)}%</span>
                          )}
                          <span>Seen: {insight.usageCount} times</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle>Learning Activity</CardTitle>
                </div>
                <CardDescription>
                  Recent learning events and improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {learningLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No learning events recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {learningLog.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between border-b pb-2 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {event.eventType.replace('_', ' ')}
                            </Badge>
                            {event.impactScore && event.impactScore > 50 && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                High Impact
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{event.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
              <p className="text-muted-foreground">
                Create an agent first to start tracking learning and performance.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

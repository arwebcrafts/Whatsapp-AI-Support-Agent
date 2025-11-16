"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalConversations: 0,
    responseRate: 0,
    avgResponseTime: 0,
    chartData: [],
    agentPerformance: [],
    leadDistribution: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Track your WhatsApp AI performance and insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversations
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                AI coverage rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Message Volume</CardTitle>
              <CardDescription>Daily messages over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.chartData && stats.chartData.length > 0 ? (
                <div className="space-y-2">
                  {stats.chartData.map((day: any, i: number) => {
                    const maxCount = Math.max(...stats.chartData.map((d: any) => d.count));
                    const width = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-primary h-full flex items-center justify-end pr-2"
                            style={{ width: `${width}%` }}
                          >
                            {day.count > 0 && (
                              <span className="text-xs text-white font-medium">{day.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p>No message data for the last 7 days</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Distribution</CardTitle>
              <CardDescription>Breakdown of leads by score</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.leadDistribution && stats.leadDistribution.length > 0 ? (
                <div className="space-y-3">
                  {stats.leadDistribution.map((lead: any, i: number) => {
                    const total = stats.leadDistribution.reduce((sum: number, l: any) => sum + l._count.id, 0);
                    const percentage = total > 0 ? Math.round((lead._count.id / total) * 100) : 0;
                    const colors: any = {
                      hot: 'bg-red-500',
                      warm: 'bg-orange-500',
                      cold: 'bg-blue-500',
                    };
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{lead.leadScore}</span>
                          <span className="text-sm text-muted-foreground">{lead._count.id} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[lead.leadScore] || 'bg-gray-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p>No lead data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Your top performing AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.agentPerformance && stats.agentPerformance.length > 0 ? (
              <div className="space-y-4">
                {stats.agentPerformance.map((agent: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent.messages.toLocaleString()} messages
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{agent.responseRate}%</p>
                      <p className="text-sm text-muted-foreground">Response rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No agent data yet. Create an agent to see performance.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Features */}
        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">📊 More Analytics Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Conversion funnel analytics</li>
              <li>• Customer sentiment analysis</li>
              <li>• Peak hours heatmap</li>
              <li>• Export analytics reports (CSV/PDF)</li>
              <li>• Custom date range filters</li>
              <li>• Revenue attribution tracking</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

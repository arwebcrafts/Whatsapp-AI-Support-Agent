"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
  messages: Array<{
    id: string;
    message: string;
    isAdminResponse: boolean;
    createdAt: string;
    user: {
      name: string;
      role: string;
    };
  }>;
}

export default function SupportPage() {
  const session = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "bug",
    priority: "medium",
  });

  const status = session?.status || "loading";
  const sessionData = session?.data;

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }

    if (status === "authenticated") {
      fetchTickets();
    }
  }, [status]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/support/tickets");
      const data = await res.json();

      if (res.ok) {
        setTickets(data.tickets || []);
        setError(null);
      } else {
        setError(data.message || "Failed to load tickets. Please ensure the database migration has been run.");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to load tickets. The support ticket tables may not exist yet. Please run the database migration first.");
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      const data = await res.json();

      if (res.ok) {
        setTickets([data.ticket, ...tickets]);
        setNewTicket({
          subject: "",
          description: "",
          category: "bug",
          priority: "medium",
        });
        setIsCreating(false);
        alert("Ticket created successfully!");
      } else {
        alert(data.message || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      const data = await res.json();

      if (res.ok) {
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh ticket details
        await fetchTicketDetails(selectedTicket.id);
        setReplyMessage("");
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      waiting_response: "bg-orange-100 text-orange-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-blue-100 text-blue-600",
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };

    return (
      <Badge className={styles[priority] || "bg-gray-100 text-gray-600"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Error Loading Support Tickets</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Run the SQL migration from MIGRATION_NOTES.md to create the support_tickets tables.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-gray-600 mt-1">Report bugs and get help from our support team</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue or question, and our team will help you
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Provide detailed information about your issue..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createTicket} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Ticket"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets List */}
        <div className="grid gap-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No support tickets yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a ticket to report bugs or ask questions
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => fetchTicketDetails(ticket.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        {ticket.description.substring(0, 150)}
                        {ticket.description.length > 150 && "..."}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket._count.messages} {ticket._count.messages === 1 ? "message" : "messages"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {ticket.messages[0]?.isAdminResponse && (
                      <Badge className="bg-green-100 text-green-700">
                        Admin Replied
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Ticket Details Dialog */}
        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle>{selectedTicket.subject}</DialogTitle>
                    <DialogDescription>
                      Created {new Date(selectedTicket.createdAt).toLocaleString()}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </DialogHeader>

              {/* Messages */}
              <div className="space-y-4 mt-4">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.isAdminResponse
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        {msg.isAdminResponse ? "Support Team" : msg.user.name}
                        {msg.isAdminResponse && (
                          <Badge className="ml-2 bg-blue-600 text-white">Admin</Badge>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== "closed" && (
                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium">Add Reply</label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button onClick={sendReply} disabled={submitting || !replyMessage.trim()}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {selectedTicket.status === "closed" && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    This ticket has been closed. Create a new ticket if you need further assistance.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

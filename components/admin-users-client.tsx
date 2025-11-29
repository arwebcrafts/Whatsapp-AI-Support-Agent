"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Crown,
  UserCog,
  Shield,
  Infinity,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  trialEndsAt: string | null;
  subscriptionStatus: string;
  planType: string;
  _count: {
    agents: string;
    conversations: string;
    whatsappConnections: string;
  };
  messageUsage: Array<{
    messagesUsed: string;
  }>;
}

interface AdminUsersClientProps {
  users: User[];
}

export default function AdminUsersClient({ users: initialUsers }: AdminUsersClientProps) {
  // DETAILED DEBUG LOGGING - DO NOT REMOVE
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 CLIENT COMPONENT INITIALIZATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Received initialUsers count:', initialUsers.length);

  if (initialUsers.length > 0) {
    console.log('\n📊 FIRST USER RECEIVED BY CLIENT:');
    const firstUser = initialUsers[0];
    console.log(JSON.stringify(firstUser, null, 2));

    console.log('\n🔬 CLIENT RECEIVED DATA TYPES:');
    console.log('- _count.agents:', typeof firstUser._count.agents, '=', firstUser._count.agents);
    console.log('- _count.conversations:', typeof firstUser._count.conversations, '=', firstUser._count.conversations);
    console.log('- messageUsage[0]?.messagesUsed:', typeof firstUser.messageUsage[0]?.messagesUsed, '=', firstUser.messageUsage[0]?.messagesUsed);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [grantingAccess, setGrantingAccess] = useState<User | null>(null);

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");

      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }

  async function updateUser(userId: string, updates: any) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        alert("User updated successfully!");
        loadUsers();
        setEditingUser(null);
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  }

  async function grantAdminAccess(userId: string, userName: string) {
    if (!confirm(`Grant admin portal access to ${userName}?\n\nThis will give them:\n• Unlimited message limits\n• Full admin portal access\n• Ability to view all users\n• No subscription restrictions`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          planType: "admin_access",
          subscriptionStatus: "lifetime",
        }),
      });

      if (res.ok) {
        alert("Admin access granted successfully!");
        loadUsers();
        setGrantingAccess(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to grant admin access");
      }
    } catch (error) {
      console.error("Error granting admin access:", error);
      alert("Failed to grant admin access");
    }
  }

  async function revokeAdminAccess(userId: string, userName: string) {
    if (!confirm(`Revoke admin access from ${userName}?\n\nThis will:\n• Remove admin portal access\n• Revert to starter plan\n• Apply trial limits`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        alert("Admin access revoked successfully!");
        loadUsers();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to revoke admin access");
      }
    } catch (error) {
      console.error("Error revoking admin access:", error);
      alert("Failed to revoke admin access");
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("User deleted successfully!");
        loadUsers();
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "all" || user.planType === filterPlan;
    return matchesSearch && matchesPlan;
  });

  // DETAILED DEBUG LOGGING - DO NOT REMOVE
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 FILTERED USERS DEBUG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Filtered users count:', filteredUsers.length);
  console.log('Type of filteredUsers.length:', typeof filteredUsers.length);

  const userCountBadgeContent = filteredUsers.length.toString() + " users";
  console.log('Badge content for user count:', userCountBadgeContent);
  console.log('Type of badge content:', typeof userCountBadgeContent);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  function getPlanBadgeVariant(planType: string) {
    console.log('🎨 getPlanBadgeVariant called with:', planType, '| type:', typeof planType);
    if (planType === "admin_access") return "default";
    return "outline";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">User Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user accounts, subscriptions, and limits
                </CardDescription>
              </div>
              <Badge variant="secondary">{userCountBadgeContent}</Badge>
            </div>

            {/* Filters */}
            <div className="flex mt-4 space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="admin_access">Admin Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, userIndex) => {
                  // DETAILED DEBUG LOGGING - DO NOT REMOVE
                  console.log(`\n🔍 RENDERING USER ${userIndex}: ${user.email}`);
                  console.log('- role:', user.role, '| type:', typeof user.role);
                  console.log('- planType:', user.planType, '| type:', typeof user.planType);
                  console.log('- subscriptionStatus:', user.subscriptionStatus, '| type:', typeof user.subscriptionStatus);
                  console.log('- _count.agents:', user._count.agents, '| type:', typeof user._count.agents);
                  console.log('- messageUsage[0]?.messagesUsed:', user.messageUsage?.[0]?.messagesUsed, '| type:', typeof user.messageUsage?.[0]?.messagesUsed);

                  // Check what will be rendered in each Badge
                  console.log('\n📍 Badge Children Analysis:');
                  console.log('- Role Badge will render:', user.role === "admin" ? "Crown + Admin" : "User");
                  console.log('- Plan Badge will render:', user.planType === "admin_access" ? "Infinity + Admin Access (Unlimited)" : user.planType);
                  console.log('- Status Badge will render:', user.subscriptionStatus);

                  return (
                    <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.name || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="default">
                          <span className="inline-flex items-center">
                            <Crown className="w-3 h-3 mr-1" />
                            <span>Admin</span>
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getPlanBadgeVariant(user.planType)}
                        className={`capitalize ${user.planType === "admin_access" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                      >
                        {user.planType === "admin_access" ? (
                          <span className="inline-flex items-center">
                            <Infinity className="w-3 h-3 mr-1" />
                            <span>Admin Access (Unlimited)</span>
                          </span>
                        ) : (
                          user.planType
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.subscriptionStatus === "active" ||
                          user.subscriptionStatus === "lifetime"
                            ? "default"
                            : user.subscriptionStatus === "trial"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {user.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{user._count.agents}</TableCell>
                    <TableCell>
                      {user.messageUsage?.[0]?.messagesUsed ?? "0"}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => grantAdminAccess(user.id, user.email)}
                            title="Grant Admin Access"
                          >
                            <Shield className="w-4 h-4 text-purple-600" />
                          </Button>
                        )}
                        {user.role === "admin" && user.planType === "admin_access" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeAdminAccess(user.id, user.email)}
                            title="Revoke Admin Access"
                          >
                            <UserCog className="w-4 h-4 text-orange-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id, user.email)}
                          disabled={user.role === "admin"}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
                <CardDescription>{editingUser.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Plan Type</label>
                  <Select
                    defaultValue={editingUser.planType}
                    onValueChange={(value) =>
                      setEditingUser({ ...editingUser, planType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="admin_access">
                        <div className="flex items-center">
                          <Infinity className="w-3 h-3 mr-2" />
                          <span>Admin Access (Unlimited)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {editingUser.planType === "admin_access" && (
                    <p className="text-xs text-purple-600 mt-1">
                      ⚡ Unlimited messages, agents, and connections. Full admin portal access.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Subscription Status</label>
                  <Select
                    defaultValue={editingUser.subscriptionStatus}
                    onValueChange={(value) =>
                      setEditingUser({ ...editingUser, subscriptionStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    defaultValue={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      updateUser(editingUser.id, {
                        planType: editingUser.planType,
                        subscriptionStatus: editingUser.subscriptionStatus,
                        role: editingUser.role,
                      })
                    }
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

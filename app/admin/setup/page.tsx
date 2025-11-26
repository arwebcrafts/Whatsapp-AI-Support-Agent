"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function grantSelfAdminAccess() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/grant-self-access", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || "Admin access granted! Redirecting...");

        // Wait 2 seconds then redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setSuccess(false);
        setMessage(data.message || "Failed to grant admin access");
      }
    } catch (error) {
      console.error("Error:", error);
      setSuccess(false);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Grant yourself unlimited admin access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll get:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Unlimited messages</li>
              <li>✅ Unlimited agents</li>
              <li>✅ Unlimited connections</li>
              <li>✅ Unlimited knowledge bases</li>
              <li>✅ No trial expiration</li>
              <li>✅ Lifetime access</li>
            </ul>
          </div>

          {message && (
            <div
              className={`rounded-lg p-4 flex items-start gap-3 ${
                success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {message}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={grantSelfAdminAccess}
            disabled={loading || success}
            className="w-full"
            size="lg"
          >
            {loading ? "Processing..." : success ? "Access Granted!" : "Grant Admin Access"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            This is a one-time setup. After this, you can manage all users from the admin panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

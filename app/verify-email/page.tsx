"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage("No verification token provided");
      return;
    }

    verifyEmail(token);
  }, [token]);

  async function verifyEmail(token: string) {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);

        // Clear any cached session data
        if (typeof window !== 'undefined') {
          // Clear session storage
          sessionStorage.clear();

          // Clear local storage items related to auth
          try {
            const authKeys = Object.keys(localStorage).filter(key =>
              key.includes('auth') || key.includes('session') || key.includes('nextauth')
            );
            authKeys.forEach(key => localStorage.removeItem(key));
          } catch (e) {
            // Ignore localStorage errors
          }
        }

        // Use hard redirect instead of Next.js router to clear all cache
        setTimeout(() => {
          window.location.href = '/login?verified=true&t=' + Date.now();
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage("Failed to verify email. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>

          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>

          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ Your account is now active! You'll be redirected to the login page in a few seconds...
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  // Clear cache and use hard redirect
                  sessionStorage.clear();
                  window.location.href = '/login?verified=true&t=' + Date.now();
                }}
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  {message}
                </p>
              </div>

              <div className="flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button className="w-full">
                    Sign Up Again
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminVerification, setShowAdminVerification] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | undefined>(undefined);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if admin verification is required
        if (result.error === "ADMIN_VERIFICATION_REQUIRED") {
          setAdminEmail(email);
          setShowAdminVerification(true);
          setError("");
          setLoading(false);
          return;
        }
        throw new Error(result.error);
      }

      // Fetch user session to get role
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      // Redirect based on role
      if (session?.user?.role === "admin") {
        router.push("/admin");
        router.refresh(); // Force refresh to update session
      } else {
        router.push("/dashboard");
        router.refresh(); // Force refresh to update session
      }
    } catch (error: any) {
      setError(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerificationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call verification API
      const response = await fetch("/api/auth/verify-admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAttemptsLeft(data.attemptsLeft);
        throw new Error(data.message || "Invalid verification code");
      }

      // Verification successful - use the verified token to sign in
      const signInResult = await signIn("credentials", {
        email: adminEmail,
        verifiedToken: data.verifiedToken,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Successfully signed in - redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLogin() {
    setShowAdminVerification(false);
    setAdminEmail("");
    setVerificationCode("");
    setError("");
    setAttemptsLeft(undefined);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">WhaSales AI</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {showAdminVerification ? "Admin Verification" : "Welcome Back"}
          </h1>
          <p className="text-gray-600">
            {showAdminVerification
              ? "Enter the verification code sent to your email"
              : "Log in to your account"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {showAdminVerification ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                  <span>Admin Security Check</span>
                </div>
              ) : (
                "Log in"
              )}
            </CardTitle>
            <CardDescription>
              {showAdminVerification
                ? `A 6-digit verification code has been sent to ${adminEmail}`
                : "Enter your credentials to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showAdminVerification ? (
              // Regular login form
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Your password"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link href="/forgot-password" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </form>
            ) : (
              // Admin verification form
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                    {attemptsLeft !== undefined && (
                      <div className="mt-2 font-semibold">
                        {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-900">
                  <p className="font-semibold mb-2">📧 Check Your Email</p>
                  <p>We've sent a 6-digit verification code to your email address. Please enter it below to complete your login.</p>
                  <p className="mt-2 text-xs text-blue-700">
                    • Code expires in 10 minutes<br />
                    • You have 3 attempts to enter the correct code
                  </p>
                </div>

                <div>
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={loading || verificationCode.length !== 6}>
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToLogin}
                    disabled={loading}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            )}

            {!showAdminVerification && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary font-semibold hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

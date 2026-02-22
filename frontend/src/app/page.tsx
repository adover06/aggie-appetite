"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { scanImage, checkHealth } from "@/lib/api";
import { mockScanResponse } from "@/lib/mockData";
import { Button } from "@/components/ui/Button";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export default function Home() {
  const router = useRouter();
  const { setScanResult, isScanning, setIsScanning } = useApp();
  const {
    isAuthenticated,
    displayName,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    continueAsGuest,
  } = useAuth();

  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [error, setError] = useState<string | null>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (USE_MOCK) {
      setBackendStatus("connected");
      return;
    }
    checkHealth()
      .then((health) =>
        setBackendStatus(health.ollama === "connected" ? "connected" : "offline")
      )
      .catch(() => setBackendStatus("offline"));
  }, []);

  const handleScan = async (file: File) => {
    setError(null);
    setIsScanning(true);
    try {
      let result;
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 1500));
        result = mockScanResponse;
      } else {
        result = await scanImage(file);
      }
      setScanResult(result);
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message.replace("Firebase: ", "") : "Authentication failed"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message.replace("Firebase: ", "") : "Google sign-in failed"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading while Firebase checks auth state
  if (loading) {
    return (
      <main className="flex flex-col items-center pt-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  // ── Not authenticated: show auth screen ──
  if (!isAuthenticated) {
    return (
      <main className="flex flex-col items-center pt-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Scan, Swap, Sustain
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted">
            Snap your pantry. Get smart recipes using ASUCD Pantry items with
            brain-boosting Academic Fuel scores.
          </p>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
          {/* Google sign-in */}
          <button
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-primary-light/30 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or use email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Tab toggle */}
          <div className="mb-5 flex rounded-xl bg-background p-1">
            <button
              onClick={() => { setAuthMode("signin"); setAuthError(null); }}
              className={`flex-1 cursor-pointer rounded-lg py-2 text-sm font-medium transition-colors ${
                authMode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setAuthError(null); }}
              className={`flex-1 cursor-pointer rounded-lg py-2 text-sm font-medium transition-colors ${
                authMode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "signup" && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary"
            />

            {authError && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                {authError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={authLoading}>
              {authLoading
                ? "Loading..."
                : authMode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Guest button */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={continueAsGuest}
          >
            Continue as Guest
          </Button>
        </div>

        {/* How it works */}
        <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-8 text-center">
          {[
            { icon: "📸", title: "Scan", desc: "Take a photo of your pantry items" },
            { icon: "🔄", title: "Swap", desc: "AI finds smart substitutions from the pantry" },
            { icon: "🧠", title: "Sustain", desc: "Get recipes scored for academic performance" },
          ].map((step) => (
            <div key={step.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{step.icon}</span>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-xs text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── Authenticated: show scanner ──
  return (
    <main className="flex flex-col items-center pt-8">
      {/* Welcome header */}
      <div className="mb-10 text-center">
        <p className="text-sm font-medium text-primary">
          Welcome back, {displayName}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl bg-gradient-to-r from-green-300 to-green-500 bg-clip-text text-transparent">
          Scan, Swap, Sustain
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted">
          Snap your pantry. Get smart recipes using ASUCD Pantry items with
          brain-boosting Academic Fuel scores.
        </p>
      </div>

      {/* Status indicator */}
      <div className="mb-8 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-medium shadow-sm border border-border">
        <span
          className={`h-2 w-2 rounded-full ${
            backendStatus === "connected"
              ? "bg-success"
              : backendStatus === "offline"
                ? "bg-danger"
                : "bg-accent animate-pulse"
          }`}
        />
        {backendStatus === "checking" && "Connecting to backend..."}
        {backendStatus === "connected" && (USE_MOCK ? "Demo Mode" : "Backend connected")}
        {backendStatus === "offline" && "Backend offline — start the server"}
      </div>

      {/* Scanner */}
      <Scanner onFileSelected={handleScan} isScanning={isScanning} />

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* How it works */}
      <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-8 text-center">
        {[
          { icon: "📸", title: "Scan", desc: "Take a photo of your pantry items" },
          { icon: "🔄", title: "Swap", desc: "AI finds smart substitutions from the pantry" },
          { icon: "🧠", title: "Sustain", desc: "Get recipes scored for academic performance" },
        ].map((step) => (
          <div key={step.title} className="flex flex-col items-center gap-2">
            <span className="text-3xl">{step.icon}</span>
            <h3 className="text-sm font-semibold">{step.title}</h3>
            <p className="text-xs text-muted">{step.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

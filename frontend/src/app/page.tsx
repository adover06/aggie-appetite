"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { useApp } from "@/context/AppContext";
import { scanImage, checkHealth } from "@/lib/api";
import { mockScanResponse } from "@/lib/mockData";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export default function Home() {
  const router = useRouter();
  const { setScanResult, isScanning, setIsScanning } = useApp();
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="flex flex-col items-center pt-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
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
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* How it works */}
      <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-8 text-center">
        {[
          {
            icon: "📸",
            title: "Scan",
            desc: "Take a photo of your pantry items",
          },
          {
            icon: "🔄",
            title: "Swap",
            desc: "AI finds smart substitutions from the pantry",
          },
          {
            icon: "🧠",
            title: "Sustain",
            desc: "Get recipes scored for academic performance",
          },
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

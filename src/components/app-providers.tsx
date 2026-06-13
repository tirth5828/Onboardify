"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { JourneyState, JourneySummary } from "@/lib/domain/types";

interface JourneyPayload {
  state: JourneyState;
  summary: JourneySummary;
  integrations?: Record<string, boolean>;
}

interface JourneyContextValue extends Partial<JourneyPayload> {
  loading: boolean;
  busy: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  post: (path: string, body?: unknown, busyKey?: string) => Promise<JourneyPayload>;
  reset: () => Promise<void>;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<JourneyPayload>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/state", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load journey.");
    setError(null);
    setPayload(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh().catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Unable to load.");
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const post = useCallback(
    async (path: string, body?: unknown, busyKey = path) => {
      setBusy(busyKey);
      setError(null);
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body ?? {}),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Request failed.");
        setPayload((current) => ({ ...current, ...data }));
        return data as JourneyPayload;
      } catch (reason) {
        const message =
          reason instanceof Error ? reason.message : "Unexpected request failure.";
        setError(message);
        throw reason;
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const reset = useCallback(async () => {
    await post("/api/state/reset", {}, "reset");
  }, [post]);

  return (
    <JourneyContext.Provider
      value={{ ...payload, loading, busy, error, refresh, post, reset }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error("useJourney must be used inside AppProviders.");
  return context;
}

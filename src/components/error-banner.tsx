"use client";

import { AlertTriangle } from "lucide-react";

import { useJourney } from "./app-providers";

export function ErrorBanner() {
  const { error } = useJourney();
  if (!error) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#371713] px-5 py-3 text-sm font-semibold text-white shadow-2xl">
      <AlertTriangle size={17} className="text-[#c33838]" />
      {error}
    </div>
  );
}

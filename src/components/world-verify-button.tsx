"use client";

import { useState } from "react";
import {
  IDKitRequestWidget,
  proofOfHuman,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import { Fingerprint } from "lucide-react";

import { useJourney } from "./app-providers";

interface ContextResponse {
  appId: `app_${string}`;
  action: string;
  rpContext: RpContext;
  demo?: boolean;
}

export function WorldVerifyButton() {
  const { state, busy, post } = useJourney();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<ContextResponse | null>(null);

  async function begin() {
    const response = await fetch("/api/world/context", { cache: "no-store" });
    const data = (await response.json()) as ContextResponse & { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Unable to start World ID.");
    if (data.demo) {
      await post("/api/world/verify", {}, "world");
      return;
    }
    setContext(data);
    setOpen(true);
  }

  async function verify(result: IDKitResult) {
    await post("/api/world/verify", { proof: result }, "world");
  }

  if (state?.world.verified) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-[#eaf8f2] px-5 py-3 text-sm font-bold text-[#087a55]">
        <Fingerprint size={17} /> Unique human verified
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => void begin()}
        disabled={busy === "world"}
        className="button-primary w-full"
      >
        <Fingerprint size={17} /> Verify unique-human readiness
      </button>
      {context && (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={context.appId}
          action={context.action}
          rp_context={context.rpContext}
          allow_legacy_proofs={false}
          preset={proofOfHuman({ signal: state?.walletAddress ?? undefined })}
          environment="production"
          handleVerify={verify}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  );
}

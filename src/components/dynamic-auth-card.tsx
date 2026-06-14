"use client";

import { useState } from "react";
import {
  sendEmailOTP,
  verifyOTP,
  type OTPVerification,
} from "@dynamic-labs-sdk/client";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import { useEvent, useUser, useWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { ArrowRight, Check, Mail, Wallet } from "lucide-react";

import { dynamicClient } from "@/lib/dynamic-client";

function DynamicAuthInner() {
  const user = useUser().data;
  const wallets = useWalletAccounts().data ?? [];
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<OTPVerification | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEvent({
    event: "userChanged",
    listener: async (nextUser) => {
      if (!nextUser) return;
      const missing = getChainsMissingWaasWalletAccounts();
      if (missing.length) await createWaasWalletAccounts({ chains: missing });
    },
  });

  async function sendCode() {
    setWorking(true);
    setError(null);
    try {
      const result = await sendEmailOTP({ email });
      setPending(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send code.");
    } finally {
      setWorking(false);
    }
  }

  async function confirmCode() {
    if (!pending) return;
    setWorking(true);
    setError(null);
    try {
      await verifyOTP({ otpVerification: pending, verificationToken: code });
      setPending(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Invalid code.");
    } finally {
      setWorking(false);
    }
  }

  if (user) {
    return (
      <div className="rounded-xl bg-[#101828] p-5 text-white">
        <div className="mb-5 flex items-center justify-between">
          <span className="eyebrow text-[#7ea0ff]">Dynamic connected</span>
          <Check size={18} />
        </div>
        <p className="font-bold">{user.email ?? "Verified account"}</p>
        <p className="mt-2 truncate font-mono text-xs text-white/65">
          {wallets[0]?.address ?? "Creating embedded wallet..."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm font-bold">
        {pending ? <Mail size={17} /> : <Wallet size={17} />}
        {pending ? "Enter your email code" : "Create an embedded wallet"}
      </div>
      {pending ? (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            className="field min-w-0 flex-1"
          />
          <button
            onClick={confirmCode}
            disabled={working || code.length < 4}
            className="button-primary"
          >
            Verify <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="field min-w-0 flex-1"
          />
          <button
            onClick={sendCode}
            disabled={working || !email.includes("@")}
            className="button-primary"
          >
            Continue <ArrowRight size={15} />
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-[#a13a2b]">{error}</p>}
    </div>
  );
}

export function DynamicAuthCard() {
  if (!dynamicClient) {
    return (
      <div className="surface flex items-center gap-4 rounded-xl p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#edf2ff] text-[#315efb]">
          <Wallet size={20} />
        </span>
        <div>
          <p className="font-bold">Demo embedded wallet ready</p>
          <p className="mt-1 text-sm text-[#667085]">
            Add a Dynamic environment ID to enable live email onboarding.
          </p>
        </div>
      </div>
    );
  }

  return <DynamicAuthInner />;
}

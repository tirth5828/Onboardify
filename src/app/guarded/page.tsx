"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Clock3,
  ExternalLink,
  Eye,
  Fingerprint,
  Lock,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { useJourney } from "@/components/app-providers";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";
import { arcExplorer, baseSepoliaExplorer } from "@/lib/networks";

function short(value: string | null) {
  if (!value) return "pending";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function GuardedPage() {
  const { state, summary, loading, busy, post } = useJourney();
  const [flaggedQueued, setFlaggedQueued] = useState(false);
  const [safeQueued, setSafeQueued] = useState(false);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!safeQueued || countdown <= 0) return;
    const timer = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [safeQueued, countdown]);

  if (loading || !state || !summary) return <LoadingScreen />;

  if (!summary.guardedUnlocked) {
    return (
      <PageShell>
        <div className="glass mx-auto max-w-2xl rounded-xl p-10 text-center">
          <Lock className="mx-auto" size={34} />
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Guarded settlement is locked.</h1>
          <p className="mt-4 text-[#667085]">
            Complete the supervised Mirror Mode sequence before handling testnet value.
          </p>
          <Link href="/mirror" className="button-primary mt-7">
            Return to Mirror Mode <ArrowRight size={16} />
          </Link>
        </div>
      </PageShell>
    );
  }

  const guardedDone =
    state.guarded.cancelledFlaggedIntent && state.guarded.executedSafeIntent;

  async function confirm(action: "cancel_flagged" | "execute_safe") {
    await post(
      "/api/guarded/confirm",
      {
        action,
        intentId:
          action === "cancel_flagged" ? "demo-flagged-intent" : "demo-safe-intent",
      },
      action,
    );
  }

  return (
    <PageShell>
      <div className="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow text-[#667085]">Settlement controls</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">
            Guarded settlement
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
            Queue value, observe the execution window, and decide whether an
            intent should settle or be canceled.
          </p>
        </div>
        <div className="max-w-md rounded-xl border border-[#e3e8ef] bg-white p-5 text-sm leading-6 text-[#667085]">
          Guarded Mainnet does not reverse finalized transactions. It delays
          intent so risk can be inspected and canceled first.
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article
          className={`rounded-xl border p-6 ${
            state.guarded.cancelledFlaggedIntent
              ? "border-[#cbe8dc] bg-[#eaf8f2]"
              : "border-[#f0b8b8] bg-[#fff0f0]"
          }`}
        >
          <div className="mb-9 flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff0f0] text-[#c33838]">
              <ShieldAlert />
            </span>
            <span className="rounded bg-white px-3 py-2 text-xs font-bold">
              FLAGGED / +10
            </span>
          </div>
          <p className="eyebrow text-[#8b4b40]">Intent receipt 001</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Unknown recipient requests 0.002 ETH
          </h2>
          <div className="my-6 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-white/65 p-3">
              <p className="text-[#7b625c]">Risk</p>
              <p className="mt-1 font-bold">New address / high</p>
            </div>
            <div className="rounded-2xl bg-white/65 p-3">
              <p className="text-[#7b625c]">Window</p>
              <p className="mt-1 font-bold">15 seconds</p>
            </div>
          </div>

          {!flaggedQueued && !state.guarded.cancelledFlaggedIntent && (
            <button onClick={() => setFlaggedQueued(true)} className="button-primary w-full">
              <Clock3 size={16} /> Queue flagged intent
            </button>
          )}
          {flaggedQueued && !state.guarded.cancelledFlaggedIntent && (
            <div className="rounded-lg bg-[#101828] p-4 text-white">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold">Settlement delayed</span>
                <span className="font-mono text-sm text-[#ff927f]">00:15</span>
              </div>
              <button
                onClick={() => void confirm("cancel_flagged")}
                disabled={busy === "cancel_flagged"}
                className="button-secondary w-full"
              >
                <Ban size={16} /> Undo before settlement
              </button>
            </div>
          )}
          {state.guarded.cancelledFlaggedIntent && (
            <div className="flex items-center justify-between rounded-lg bg-[#087a55] p-4 text-white">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Check size={16} /> Intent canceled
              </span>
              <a
                href={`${baseSepoliaExplorer}/tx/${state.guarded.cancelTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-white/70"
              >
                {short(state.guarded.cancelTxHash)} <ExternalLink size={12} />
              </a>
            </div>
          )}
        </article>

        <article
          className={`rounded-xl border p-6 ${
            state.guarded.executedSafeIntent
              ? "border-[#cbe8dc] bg-[#eaf8f2]"
              : "border-black/8 bg-white/72"
          }`}
        >
          <div className="mb-9 flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf2ff] text-[#315efb]">
              <ShieldCheck />
            </span>
            <span className="rounded bg-white px-3 py-2 text-xs font-bold">
              VERIFIED / +10
            </span>
          </div>
          <p className="eyebrow text-[#63706b]">Intent receipt 002</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Verified recipient receives 0.001 ETH
          </h2>
          <div className="my-6 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-[#63706b]">Risk</p>
              <p className="mt-1 font-bold">Known address / low</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-[#63706b]">Limit</p>
              <p className="mt-1 font-bold">Below daily cap</p>
            </div>
          </div>

          {!safeQueued && !state.guarded.executedSafeIntent && (
            <button
              onClick={() => {
                setCountdown(8);
                setSafeQueued(true);
              }}
              className="button-primary w-full"
            >
              <Clock3 size={16} /> Queue safe intent
            </button>
          )}
          {safeQueued && !state.guarded.executedSafeIntent && (
            <div className="rounded-lg bg-[#edf2ff] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold">
                  {countdown ? "Inspection window open" : "Ready to settle"}
                </span>
                <span className="font-mono text-sm">00:0{countdown}</span>
              </div>
              <button
                onClick={() => void confirm("execute_safe")}
                disabled={countdown > 0 || busy === "execute_safe"}
                className="button-primary w-full"
              >
                Settle after delay <ArrowRight size={15} />
              </button>
            </div>
          )}
          {state.guarded.executedSafeIntent && (
            <div className="flex items-center justify-between rounded-lg bg-[#087a55] p-4 text-white">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Check size={16} /> Intent settled
              </span>
              <a
                href={`${baseSepoliaExplorer}/tx/${state.guarded.executeTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-white/70"
              >
                {short(state.guarded.executeTxHash)} <ExternalLink size={12} />
              </a>
            </div>
          )}
        </article>
      </div>

      <section
        className={`mt-6 overflow-hidden rounded-xl border ${
          guardedDone ? "border-[#101828] bg-[#101828] text-white" : "border-[#e3e8ef] bg-white"
        }`}
      >
        <div className="grid lg:grid-cols-[.8fr_1.2fr]">
          <div className="p-6 lg:p-8">
            <div className="mb-8 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#315efb] text-white">
                <Fingerprint />
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold">
                ARC / +10
              </span>
            </div>
            <p className="eyebrow text-white/50">Private settlement</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Break the public payment link.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Dynamic authenticates the user, Unlink shields the balance, and a
              fresh payer EOA purchases an x402 risk report through Circle Gateway.
            </p>
            <button
              onClick={() => void post("/api/privacy/pay", {}, "privacy")}
              disabled={!guardedDone || state.privacy.status === "complete" || busy === "privacy"}
              className="button-primary mt-7 w-full !border-[#315efb] !bg-[#315efb]"
            >
              {state.privacy.status === "complete" ? (
                <>
                  <Check size={16} /> Private payment complete
                </>
              ) : (
                <>
                  Run private nanopayment <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="border-t border-white/10 bg-white/[.045] p-6 lg:border-t-0 lg:border-l lg:p-8">
            <p className="eyebrow mb-5 text-white/45">Privacy trace</p>
            <div className="space-y-3">
              {[
                {
                  icon: WalletCards,
                  label: "Dynamic wallet",
                  value: short(state.walletAddress),
                  complete: guardedDone,
                },
                {
                  icon: Eye,
                  label: "Private Unlink account",
                  value: short(state.privacy.unlinkAddress),
                  complete: state.privacy.status === "complete",
                },
                {
                  icon: Fingerprint,
                  label: "Ephemeral payer",
                  value: short(state.privacy.payerAddress),
                  complete: state.privacy.status === "complete",
                },
                {
                  icon: ShieldCheck,
                  label: "x402 resource paid",
                  value: short(state.privacy.paymentTxHash),
                  complete: state.privacy.status === "complete",
                },
              ].map((step, index) => (
                <div
                  key={step.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/9 bg-white/[.055] p-4"
                >
                  <span className="text-xs font-bold text-white/30">0{index + 1}</span>
                  <step.icon size={17} className={step.complete ? "text-[#7ea0ff]" : "text-white/25"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold">{step.label}</p>
                    <p className="mt-1 truncate font-mono text-[10px] text-white/45">
                      {step.value}
                    </p>
                  </div>
                  {step.complete && <Check size={15} className="text-[#7ea0ff]" />}
                </div>
              ))}
            </div>
            {state.privacy.paymentTxHash && (
              <a
                href={`${arcExplorer}/tx/${state.privacy.paymentTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex items-center justify-end gap-2 text-xs font-bold text-[#7ea0ff]"
              >
                Inspect Arc settlement <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </section>

      {summary.passportEligible && (
        <div className="mt-6 flex justify-end">
          <Link href="/passport" className="button-primary">
            Verify humanity & claim passport <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </PageShell>
  );
}

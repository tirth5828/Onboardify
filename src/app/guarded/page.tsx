"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Clock3,
  ExternalLink,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { useJourney, WalletContext } from "@/components/app-providers";
import { WalletButton } from "@/components/wallet-button";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";
import { baseSepoliaExplorer } from "@/lib/networks";
import { useVault } from "@/lib/use-vault";

function short(value: string | null) {
  if (!value) return "pending";
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function GuardedPage() {
  const { state, summary, loading, busy, post } = useJourney();
  const [flaggedQueued, setFlaggedQueued] = useState(false);
  const [safeQueued, setSafeQueued] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [flaggedIntentId, setFlaggedIntentId] = useState<`0x${string}` | null>(null);
  const [safeIntentId, setSafeIntentId] = useState<`0x${string}` | null>(null);
  const [vaultBusy, setVaultBusy] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const vault = useVault();
  const { showAuth, hideAuthFlow } = useContext(WalletContext);

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

  async function queueFlagged() {
    setVaultBusy(true);
    setVaultError(null);
    try {
      if (vault.walletConnected) {
        const { intentId } = await vault.queueTransfer(
          "0x000000000000000000000000000000000000dEaD",
          0.002,
          20,
        );
        setFlaggedIntentId(intentId);
      }
      setFlaggedQueued(true);
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
    } finally {
      setVaultBusy(false);
    }
  }

  async function cancelFlagged() {
    setVaultBusy(true);
    setVaultError(null);
    try {
      let txHash: string | undefined;
      if (vault.walletConnected && flaggedIntentId) {
        txHash = await vault.cancelIntent(flaggedIntentId);
      }
      await post(
        "/api/guarded/confirm",
        { action: "cancel_flagged", intentId: flaggedIntentId ?? "demo-flagged-intent", txHash },
        "cancel_flagged",
      );
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
    } finally {
      setVaultBusy(false);
    }
  }

  async function queueSafe() {
    setVaultBusy(true);
    setVaultError(null);
    try {
      if (vault.walletConnected) {
        const { intentId } = await vault.queueTransfer(
          "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
          0.001,
          10,
        );
        setSafeIntentId(intentId);
      }
      setCountdown(8);
      setSafeQueued(true);
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
    } finally {
      setVaultBusy(false);
    }
  }

  async function executeSafe() {
    setVaultBusy(true);
    setVaultError(null);
    try {
      let txHash: string | undefined;
      if (vault.walletConnected && safeIntentId) {
        txHash = await vault.executeIntent(safeIntentId);
      }
      await post(
        "/api/guarded/confirm",
        { action: "execute_safe", intentId: safeIntentId ?? "demo-safe-intent", txHash },
        "execute_safe",
      );
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
    } finally {
      setVaultBusy(false);
    }
  }

  return (
    <PageShell>
      {showAuth && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-[#315efb]/20 bg-[#edf2ff] px-5 py-4">
          <p className="text-sm text-[#315efb]">
            Open your wallet extension (MetaMask, Ledger Live) and connect to this site to enable on-chain settlement.
          </p>
          <button onClick={hideAuthFlow} className="ml-4 shrink-0 text-xs text-[#315efb]/60 hover:text-[#315efb]">
            Dismiss
          </button>
        </div>
      )}
      {vaultError && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-[#f0b8b8] bg-[#fff0f0] px-5 py-4">
          <p className="text-sm text-[#c33838]">{vaultError}</p>
          <button
            onClick={() => setVaultError(null)}
            className="ml-4 shrink-0 text-xs text-[#c33838]/60 hover:text-[#c33838]"
          >
            Dismiss
          </button>
        </div>
      )}
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
        <div className="flex flex-col items-end gap-3">
          <WalletButton />
          <div className="max-w-md rounded-xl border border-[#e3e8ef] bg-white p-5 text-sm leading-6 text-[#667085]">
            Guarded Mainnet does not reverse finalized transactions. It delays
            intent so risk can be inspected and canceled first.
          </div>
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
            <button onClick={() => void queueFlagged()} disabled={vaultBusy} className="button-primary w-full">
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
                onClick={() => void cancelFlagged()}
                disabled={busy === "cancel_flagged" || vaultBusy}
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
              onClick={() => void queueSafe()}
              disabled={vaultBusy}
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
                onClick={() => void executeSafe()}
                disabled={countdown > 0 || busy === "execute_safe" || vaultBusy}
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
    </PageShell>
  );
}

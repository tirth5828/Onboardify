"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";

import { useJourney } from "@/components/app-providers";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";
import { ScoreRing } from "@/components/score-ring";
import type { MirrorAction } from "@/lib/domain/types";

const demoWallet = "0x4D61696e6e657452656164790000000000000000";

const drills: Array<{
  action: MirrorAction;
  title: string;
  evidence: string;
  scenario: string;
  points: number;
}> = [
  {
    action: "safe_send",
    title: "Transaction review",
    evidence: "Recipient, network, value, and gas reviewed before signature.",
    scenario: "Send 0.1 mETH to a verified recipient",
    points: 15,
  },
  {
    action: "safe_swap",
    title: "Execution controls",
    evidence: "Price impact and bounded slippage applied to a DEX order.",
    scenario: "Swap 1 mETH with a 1.5% limit",
    points: 15,
  },
  {
    action: "safe_loan",
    title: "Collateral management",
    evidence: "Position remains solvent through a 25% collateral shock.",
    scenario: "Stress-test a 1.72 health factor",
    points: 20,
  },
];

export default function MirrorPage() {
  const { state, summary, loading, busy, post } = useJourney();
  if (loading || !state || !summary) return <LoadingScreen />;

  const journeyState = state;
  const simulation = journeyState.simulation;
  const done = (action: MirrorAction) =>
    simulation.completedActions.includes(action);

  async function act(action: MirrorAction) {
    await post(
      "/api/simulation/action",
      { action, walletAddress: journeyState.walletAddress ?? demoWallet },
      action,
    );
  }

  type ApprovalStep = {
    num: string;
    label: string;
    done: boolean;
    active: boolean;
    action: MirrorAction;
    btnLabel: string;
    btnClass: string;
  };

  const approvalSteps: ApprovalStep[] = [
    {
      num: "01",
      label: "Sign unverified approval",
      done: simulation.maliciousApprovalAccepted,
      active: !simulation.maliciousApprovalAccepted,
      action: "accept_malicious_approval",
      btnLabel: "Sign",
      btnClass: "button-danger",
    },
    {
      num: "02",
      label: "Inspect persistent authority",
      done: simulation.maliciousApprovalInspected,
      active:
        simulation.maliciousApprovalAccepted &&
        !simulation.maliciousApprovalInspected,
      action: "inspect_malicious_approval",
      btnLabel: "Inspect",
      btnClass: "button-secondary",
    },
    {
      num: "03",
      label: "Revoke allowance · +20 pts",
      done: simulation.maliciousApprovalRevoked,
      active:
        simulation.maliciousApprovalInspected &&
        !simulation.maliciousApprovalRevoked,
      action: "revoke_malicious_approval",
      btnLabel: "Revoke",
      btnClass: "button-primary",
    },
  ];

  return (
    <PageShell>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#667085]">
            <FlaskConical size={14} />
            Optional guided environment
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">
            Guided risk lab
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">
            Six controlled drills establish minimum transaction literacy. Skip
            directly to the testnet desk at any time — both surfaces feed the
            same behavioral record.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <ScoreRing score={summary.mirrorScore} max={70} size={84} />
          <Link href="/explore" className="button-secondary">
            Skip to testnet desk <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["mETH", simulation.ethBalance.toFixed(3)],
          ["mUSDC", simulation.usdcBalance.toLocaleString()],
          ["Portfolio", `$${simulation.portfolioUsd.toLocaleString()}`],
          ["Gas spent", `${simulation.gasSpentEth.toFixed(3)} ETH`],
        ].map(([label, value]) => (
          <div key={label} className="metric">
            <p className="text-xs font-semibold text-[#667085]">{label}</p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="surface overflow-hidden rounded-xl">
          <div className="border-b border-[#e3e8ef] px-5 py-4">
            <p className="text-sm font-bold">Baseline drills</p>
            <p className="mt-1 text-xs text-[#667085]">
              Three controlled scenarios establish minimum transaction literacy.
            </p>
          </div>
          {drills.map((drill, index) => {
            const complete = done(drill.action);
            return (
              <div
                key={drill.action}
                className="grid gap-4 border-b border-[#edf0f4] px-5 py-5 last:border-0 md:grid-cols-[32px_1fr_1fr_auto] md:items-center"
              >
                <span className="font-mono text-xs text-[#98a2b3]">0{index + 1}</span>
                <div>
                  <p className="text-sm font-bold">{drill.title}</p>
                  <p className="mt-1 text-xs text-[#667085]">{drill.scenario}</p>
                </div>
                <p className="text-xs leading-5 text-[#667085]">{drill.evidence}</p>
                <button
                  onClick={() => void act(drill.action)}
                  disabled={complete || busy === drill.action}
                  className={complete ? "button-secondary" : "button-primary"}
                >
                  {complete ? <Check size={14} /> : null}
                  {complete ? "Recorded" : `Run / +${drill.points}`}
                </button>
              </div>
            );
          })}
        </section>

        <section className="surface rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold">Adversarial approval drill</p>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                Observe how persistent token authority creates loss beyond a
                single transaction.
              </p>
            </div>
            <AlertTriangle
              size={18}
              className={
                simulation.maliciousApprovalRevoked
                  ? "text-[#087a55]"
                  : "text-[#c33838]"
              }
            />
          </div>

          <div
            className={`mt-5 rounded-lg border p-4 ${
              simulation.maliciousApprovalAccepted &&
              !simulation.maliciousApprovalRevoked
                ? "border-[#f0b8b8] bg-[#fff0f0]"
                : simulation.maliciousApprovalRevoked
                  ? "border-[#cbe8dc] bg-[#eaf8f2]"
                  : "border-[#e3e8ef] bg-[#f8fafc]"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#667085]">Current allowance</span>
              <span
                className={`font-bold uppercase ${
                  simulation.allowance === "unlimited"
                    ? "text-[#c33838]"
                    : "text-[#087a55]"
                }`}
              >
                {simulation.allowance}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-[#667085]">Simulated impact</p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
                  {simulation.maliciousApprovalAccepted
                    ? `-$${simulation.simulatedLossUsd.toLocaleString()}`
                    : "$0"}
                </p>
              </div>
              {simulation.maliciousApprovalRevoked && (
                <span className="flex items-center gap-2 text-xs font-bold text-[#087a55]">
                  <Check size={14} /> Exposure removed
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {approvalSteps.map((step) => (
              <div
                key={step.num}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  step.done
                    ? "bg-[#eaf8f2]"
                    : step.active
                      ? "border border-[#e3e8ef] bg-white"
                      : "bg-[#f8fafc] opacity-40"
                }`}
              >
                <span className="w-6 font-mono text-xs text-[#98a2b3]">
                  {step.num}
                </span>
                <span className="flex-1 text-xs font-semibold">{step.label}</span>
                {step.done ? (
                  <Check size={14} className="text-[#087a55]" />
                ) : step.active ? (
                  <button
                    onClick={() => void act(step.action)}
                    disabled={busy === step.action}
                    className={`${step.btnClass} !min-h-0 !py-1.5 !text-xs`}
                  >
                    {step.btnLabel}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface mt-5 rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">Evidence log</p>
            <p className="mt-1 text-xs text-[#667085]">Most recent observed outcomes.</p>
          </div>
          <span className="rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold text-[#667085]">
            {simulation.activity.length} events
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {simulation.activity.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-lg border border-[#e3e8ef] p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.tone === "danger"
                      ? "bg-[#c33838]"
                      : item.tone === "warning"
                        ? "bg-[#a15c00]"
                        : item.tone === "positive"
                          ? "bg-[#087a55]"
                          : "bg-[#98a2b3]"
                  }`}
                />
                <p className="text-xs font-bold">{item.title}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#667085]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {summary.guardedUnlocked && (
        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-[#cbe8dc] bg-[#eaf8f2] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#087a55] text-white">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="font-bold text-[#054f38]">Guarded Mainnet Unlocked</p>
              <p className="mt-1 text-sm text-[#087a55]/70">
                All mirror drills complete · {summary.mirrorScore}/70 pts · Two guarded intents await
              </p>
            </div>
          </div>
          <Link href="/guarded" className="button-primary shrink-0">
            Open settlement desk <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </PageShell>
  );
}

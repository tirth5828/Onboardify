"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Radar,
  ShieldCheck,
} from "lucide-react";

import { useJourney } from "@/components/app-providers";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";

function short(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function JourneyPage() {
  const { state, summary, loading, integrations } = useJourney();
  if (loading || !state || !summary) return <LoadingScreen />;

  const recentTransactions = state.testnet.transactions.slice(0, 5);
  const openFindings = state.testnet.findings.filter((finding) => !finding.resolved);

  return (
    <PageShell>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow text-[#667085]">Readiness overview</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">
            Onchain operating record
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
            Evidence is generated from observed behavior across guided drills and
            independent testnet use. The monitor does not require a fixed sequence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/explore" className="button-primary">
            Open testnet desk <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Readiness", `${summary.score}/100`, "Behavioral score"],
          ["Observed operations", summary.monitoredOperations, "Across both testnets"],
          ["Open risk findings", summary.unresolvedFindings, "Requires review"],
        ].map(([label, value, note]) => (
          <div key={label} className="metric">
            <p className="text-xs font-semibold text-[#667085]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
            <p className="mt-2 text-xs text-[#98a2b3]">{note}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="surface overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
            <div>
              <p className="text-sm font-bold">Recent testnet activity</p>
              <p className="mt-1 text-xs text-[#667085]">
                Free-form operations evaluated by the risk monitor.
              </p>
            </div>
            <Radar size={18} className="text-[#315efb]" />
          </div>
          {recentTransactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#667085]">
                  <tr>
                    {["Operation", "Protocol", "Value", "Risk", "Transaction"].map(
                      (label) => (
                        <th key={label} className="px-5 py-3 font-semibold">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-[#edf0f4]">
                      <td className="px-5 py-4 font-semibold capitalize">{tx.operation}</td>
                      <td className="px-5 py-4 text-[#667085]">{tx.protocol}</td>
                      <td className="px-5 py-4 font-mono">
                        ${tx.valueUsd.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded px-2 py-1 font-bold capitalize risk-${tx.risk}`}
                        >
                          {tx.risk}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[#667085]">
                        {short(tx.txHash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-semibold">No independent operations yet</p>
              <p className="mt-2 text-xs text-[#667085]">
                Use the testnet desk to begin building an observed record.
              </p>
            </div>
          )}
        </section>

        <section className="surface rounded-xl p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Risk monitor</p>
              <p className="mt-1 text-xs text-[#667085]">
                Current findings, not gamified penalties.
              </p>
            </div>
            <AlertTriangle
              size={18}
              className={openFindings.length ? "text-[#c33838]" : "text-[#087a55]"}
            />
          </div>
          <div className="space-y-2">
            {openFindings.slice(0, 4).map((finding) => (
              <div key={finding.id} className="rounded-lg border border-[#e3e8ef] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold">{finding.title}</p>
                  <span
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase risk-${finding.level}`}
                  >
                    {finding.level}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#667085]">{finding.detail}</p>
              </div>
            ))}
            {!openFindings.length && (
              <div className="rounded-lg bg-[#eaf8f2] p-4 text-[#087a55]">
                <p className="flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 size={15} /> No unresolved findings
                </p>
                <p className="mt-2 text-xs leading-5 opacity-80">
                  The monitor remains active while you use the testnet.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <div className="surface rounded-xl p-5">
          <p className="text-sm font-bold">Competency evidence</p>
          {summary.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {summary.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 rounded-full bg-[#edf2ff] px-2.5 py-1 text-[10px] font-bold text-[#315efb]"
                >
                  <CheckCircle2 size={10} />
                  {skill}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-3">
            {[
              ["Transaction review", summary.mirrorScore >= 15],
              ["Execution controls", summary.mirrorScore >= 30],
              ["Collateral risk", summary.mirrorScore >= 50],
              ["Approval recovery", summary.mirrorScore >= 70],
              ["Delayed settlement", summary.guardedScore === 20],
            ].map(([label, complete]) => (
              <div key={String(label)} className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">{label}</span>
                {complete ? (
                  <CheckCircle2 size={15} className="text-[#087a55]" />
                ) : (
                  <span className="text-[#98a2b3]">Not observed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-xl p-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold">Environment status</p>
              <p className="mt-1 text-xs text-[#667085]">
                Demo adapters preserve the same interfaces used by live providers.
              </p>
            </div>
            <ShieldCheck size={18} className="text-[#087a55]" />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {Object.entries(integrations ?? {}).map(([name, live]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg border border-[#e3e8ef] px-3 py-3 text-xs"
              >
                <span className="font-semibold capitalize">{name}</span>
                <span className={live ? "text-[#087a55]" : "text-[#667085]"}>
                  {live ? "Live" : "Demo adapter"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

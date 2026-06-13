"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Eye,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useJourney } from "@/components/app-providers";
import { DynamicAuthCard } from "@/components/dynamic-auth-card";
import { PageShell } from "@/components/page-shell";

const monitorRows = [
  ["14:31:08", "Swap", "Slippage 0.6%", "Low"],
  ["14:28:42", "Approval", "Unlimited authority", "Critical"],
  ["14:27:16", "Borrow", "Health factor 1.84", "Low"],
  ["14:24:03", "Bridge", "Cross-chain finality", "Medium"],
];

export default function Home() {
  const { post, busy } = useJourney();
  const router = useRouter();

  async function choose(pathway: "onchain" | "markets", destination: string) {
    await post("/api/pathway/select", { pathway }, `pathway-${pathway}`);
    router.push(destination);
  }

  return (
    <PageShell>
      <section className="grid gap-10 border-b border-[#e3e8ef] py-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-16">
        <div>
          <div className="mb-5 flex items-center gap-2 text-xs font-bold text-[#087a55]">
            <span className="status-dot" />
            Supervised testnet environment
          </div>
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.05em] text-[#101828] sm:text-5xl lg:text-6xl">
            Learn onchain markets without being trapped in a tutorial.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#667085]">
            Complete a short risk orientation, then use the testnet freely.
            Mainnet Ready monitors transactions, explains exposure, and builds a
            behavioral readiness record in the background.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="button-primary">
              Open testnet desk <ArrowRight size={15} />
            </Link>
            <Link href="/journey" className="button-secondary">
              View readiness record
            </Link>
          </div>
        </div>

        <div className="surface overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
            <div>
              <p className="text-sm font-bold">Live transaction monitor</p>
              <p className="mt-1 text-xs text-[#667085]">
                Interventions appear only when behavior warrants them.
              </p>
            </div>
            <Radar size={20} className="text-[#315efb]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#667085]">
                <tr>
                  {["Time", "Operation", "Observed signal", "Risk"].map((item) => (
                    <th key={item} className="px-5 py-3 font-semibold">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monitorRows.map(([time, operation, signal, risk]) => (
                  <tr key={time} className="border-t border-[#edf0f4]">
                    <td className="px-5 py-4 font-mono text-[#667085]">{time}</td>
                    <td className="px-5 py-4 font-semibold">{operation}</td>
                    <td className="px-5 py-4 text-[#667085]">{signal}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded px-2 py-1 font-bold risk-${risk.toLowerCase()}`}
                      >
                        {risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mb-6 max-w-2xl">
          <p className="eyebrow text-[#667085]">Choose an entry model</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
            Start from the mental model you already have.
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="surface rounded-xl p-6">
            <div className="mb-8 flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf2ff] text-[#315efb]">
                <Blocks size={20} />
              </span>
              <span className="rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold text-[#667085]">
                ONCHAIN PATH
              </span>
            </div>
            <h3 className="text-xl font-bold">Wallet to protocol</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#667085]">
              Learn custody, approvals, swaps, lending, bridges, and settlement,
              then operate independently across Base Sepolia and Arc Testnet.
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-[#e3e8ef] pt-5">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#667085]">
                <Eye size={14} /> Continuous behavior monitoring
              </span>
              <button
                onClick={() => void choose("onchain", "/explore")}
                disabled={busy === "pathway-onchain"}
                className="button-secondary"
              >
                Select path
              </button>
            </div>
          </article>

          <article className="surface rounded-xl p-6">
            <div className="mb-8 flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf8f2] text-[#087a55]">
                <BarChart3 size={20} />
              </span>
              <span className="rounded bg-[#eaf8f2] px-2 py-1 text-[10px] font-bold text-[#087a55]">
                NEW
              </span>
            </div>
            <h3 className="text-xl font-bold">Stock market to crypto</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#667085]">
              Translate brokerage concepts into wallets, block settlement,
              tokenized treasuries, DEX execution, staking, and DeFi risk.
            </p>
            <div className="mt-6 flex items-center justify-between border-t border-[#e3e8ef] pt-5">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#667085]">
                <ShieldCheck size={14} /> Portfolio-aware risk guidance
              </span>
              <button
                onClick={() => void choose("markets", "/markets")}
                disabled={busy === "pathway-markets"}
                className="button-primary"
              >
                Select path
              </button>
            </div>
          </article>
        </div>
        <div className="mt-5 max-w-md">
          <DynamicAuthCard />
        </div>
      </section>
    </PageShell>
  );
}

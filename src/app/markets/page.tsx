"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Landmark,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { useJourney } from "@/components/app-providers";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";
import type { MarketsAction } from "@/lib/domain/types";

const instruments = [
  {
    id: "USDC" as const,
    name: "USDC",
    analogue: "Cash balance",
    risk: "Low",
    yield: "0%",
  },
  {
    id: "TBILL" as const,
    name: "Tokenized Treasury",
    analogue: "Treasury ETF",
    risk: "Low",
    yield: "4.8%",
  },
  {
    id: "ETH" as const,
    name: "ETH",
    analogue: "High-beta asset",
    risk: "High",
    yield: "Variable",
  },
  {
    id: "WSTETH" as const,
    name: "Staked ETH",
    analogue: "Yield-bearing equity",
    risk: "High",
    yield: "3.1%",
  },
  {
    id: "DEX_LP" as const,
    name: "ETH / USDC LP",
    analogue: "Market making",
    risk: "High",
    yield: "Variable",
  },
];

export default function MarketsPage() {
  const { state, summary, loading, busy, post } = useJourney();
  const [fundAmount, setFundAmount] = useState(5_000);
  const [allocationAmount, setAllocationAmount] = useState(1_000);
  const [instrument, setInstrument] =
    useState<(typeof instruments)[number]["id"]>("TBILL");

  if (loading || !state || !summary) return <LoadingScreen />;

  const completed = (action: MarketsAction) =>
    state.markets.completedActions.includes(action);
  const deskUnlocked =
    completed("acknowledge_custody") &&
    completed("compare_settlement") &&
    completed("fund_account");
  const totalOnchain =
    state.markets.onchainCashUsd +
    state.markets.allocations.reduce((total, item) => total + item.valueUsd, 0);

  async function act(action: MarketsAction, body: Record<string, unknown> = {}) {
    await post("/api/markets/action", { action, ...body }, `markets-${action}`);
  }

  return (
    <PageShell>
      <div className="mb-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow text-[#667085]">Stock market pathway</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">
            Markets Bridge
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">
            Keep the financial intuition you already have. This pathway
            translates brokerage custody, order execution, settlement, portfolio
            construction, and yield into their onchain equivalents.
          </p>
        </div>
        <div className="surface min-w-56 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#667085]">Path progress</span>
            <span className="font-bold">{summary.marketsProgress}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0f4]">
            <div
              className="h-full bg-[#315efb] transition-all"
              style={{ width: `${summary.marketsProgress}%` }}
            />
          </div>
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Brokerage portfolio", state.markets.brokerageValueUsd, "Starting capital"],
          ["Onchain cash", state.markets.onchainCashUsd, "Available to allocate"],
          ["Onchain portfolio", totalOnchain, "Cash plus positions"],
          ["Open positions", state.markets.allocations.length, "Testnet instruments"],
        ].map(([label, value, note], index) => (
          <div key={label} className="metric">
            <p className="text-xs font-semibold text-[#667085]">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
              {index === 3 ? value : `$${Number(value).toLocaleString()}`}
            </p>
            <p className="mt-2 text-xs text-[#98a2b3]">{note}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <section className="surface rounded-xl p-5">
          <div className="mb-5">
            <p className="text-sm font-bold">Orientation</p>
            <p className="mt-1 text-xs leading-5 text-[#667085]">
              Three monitored concepts establish the minimum operating model.
              After that, allocation is open-ended.
            </p>
          </div>

          <div className="space-y-3">
            <OrientationRow
              icon={WalletCards}
              title="Custody is an operating responsibility"
              detail="A broker can reverse access and recover credentials. A self-custodied wallet cannot."
              complete={completed("acknowledge_custody")}
              action={() => void act("acknowledge_custody")}
              busy={busy === "markets-acknowledge_custody"}
              label="Acknowledge model"
            />
            <OrientationRow
              icon={Scale}
              title="Block finality replaces T+1 settlement"
              detail="Confirmation, reorg risk, and bridge finality replace clearing-house settlement."
              complete={completed("compare_settlement")}
              action={() => void act("compare_settlement")}
              busy={busy === "markets-compare_settlement"}
              label="Compare settlement"
            />
            <div className="rounded-lg border border-[#e3e8ef] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f7] text-[#667085]">
                  <CircleDollarSign size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold">Fund onchain cash</p>
                      <p className="mt-1 text-xs leading-5 text-[#667085]">
                        Move a controlled test allocation from the brokerage model
                        into monitored USDC.
                      </p>
                    </div>
                    {completed("fund_account") && (
                      <Check size={16} className="shrink-0 text-[#087a55]" />
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={state.markets.brokerageValueUsd}
                      value={fundAmount}
                      onChange={(event) => setFundAmount(Number(event.target.value))}
                      className="field"
                    />
                    <button
                      onClick={() =>
                        void act("fund_account", { amountUsd: fundAmount })
                      }
                      disabled={
                        busy === "markets-fund_account" ||
                        state.markets.brokerageValueUsd <= 0
                      }
                      className="button-secondary shrink-0"
                    >
                      Fund
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`surface overflow-hidden rounded-xl ${
            deskUnlocked ? "" : "opacity-70"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
            <div>
              <p className="text-sm font-bold">Onchain allocation desk</p>
              <p className="mt-1 text-xs text-[#667085]">
                Choose instruments and position sizes. Risk is monitored, not prescribed.
              </p>
            </div>
            <BarChart3 size={18} className="text-[#315efb]" />
          </div>

          <div className="grid lg:grid-cols-[1fr_300px]">
            <div className="overflow-x-auto border-b border-[#e3e8ef] lg:border-r lg:border-b-0">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#667085]">
                  <tr>
                    {["Instrument", "Stock-market analogue", "Risk", "Indicative yield"].map(
                      (label) => (
                        <th key={label} className="px-4 py-3 font-semibold">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {instruments.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setInstrument(item.id)}
                      className={`cursor-pointer border-t border-[#edf0f4] ${
                        instrument === item.id ? "bg-[#edf2ff]" : "hover:bg-[#f8fafc]"
                      }`}
                    >
                      <td className="px-4 py-4 font-bold">{item.name}</td>
                      <td className="px-4 py-4 text-[#667085]">{item.analogue}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded px-2 py-1 font-bold ${
                            item.risk === "High" ? "risk-high" : "risk-low"
                          }`}
                        >
                          {item.risk}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono">{item.yield}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5">
              <p className="text-xs font-bold">Allocation ticket</p>
              <div className="mt-4 rounded-lg bg-[#f8fafc] p-4">
                <p className="text-xs text-[#667085]">Selected instrument</p>
                <p className="mt-2 text-lg font-bold">
                  {instruments.find((item) => item.id === instrument)?.name}
                </p>
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold text-[#667085]">
                  Value in USD
                </span>
                <input
                  type="number"
                  min="1"
                  max={state.markets.onchainCashUsd}
                  value={allocationAmount}
                  onChange={(event) =>
                    setAllocationAmount(Number(event.target.value))
                  }
                  className="field"
                />
              </label>
              <button
                onClick={() =>
                  void act("allocate", {
                    instrument,
                    amountUsd: allocationAmount,
                  })
                }
                disabled={
                  !deskUnlocked ||
                  state.markets.onchainCashUsd <= 0 ||
                  busy === "markets-allocate"
                }
                className="button-primary mt-4 w-full"
              >
                Execute allocation <ArrowRight size={14} />
              </button>
              {!deskUnlocked && (
                <p className="mt-3 text-center text-[11px] text-[#667085]">
                  Complete the orientation to open allocation.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_.7fr]">
        <div className="surface rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold">Current onchain portfolio</p>
            <Landmark size={18} className="text-[#667085]" />
          </div>
          <div className="space-y-2">
            {state.markets.allocations.map((allocation) => (
              <div
                key={allocation.instrument}
                className="flex items-center justify-between rounded-lg border border-[#e3e8ef] px-4 py-3"
              >
                <div>
                  <p className="text-xs font-bold">{allocation.instrument}</p>
                  <p className="mt-1 text-[11px] text-[#667085]">Testnet position</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold">
                    ${allocation.valueUsd.toLocaleString()}
                  </span>
                  <button
                    onClick={() =>
                      void act("exit_position", {
                        instrument: allocation.instrument,
                        amountUsd: allocation.valueUsd,
                      })
                    }
                    className="text-[11px] font-bold text-[#315efb]"
                  >
                    Exit
                  </button>
                </div>
              </div>
            ))}
            {!state.markets.allocations.length && (
              <div className="rounded-lg border border-dashed border-[#cfd6df] py-8 text-center text-xs text-[#667085]">
                No positions allocated yet.
              </div>
            )}
          </div>
        </div>

        <div className="surface rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold">Observed portfolio signals</p>
            <ShieldCheck size={18} className="text-[#087a55]" />
          </div>
          <div className="space-y-3">
            {state.markets.activity.slice(0, 5).map((item) => (
              <div key={item.id} className="border-l border-[#d0d5dd] pl-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold">{item.title}</p>
                  <span
                    className={`rounded px-2 py-1 text-[9px] font-bold uppercase risk-${item.level}`}
                  >
                    {item.level}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-[#667085]">
                  {item.detail}
                </p>
              </div>
            ))}
            {!state.markets.activity.length && (
              <p className="text-xs leading-5 text-[#667085]">
                Portfolio observations appear as you complete orientation and
                allocate capital.
              </p>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function OrientationRow({
  icon: Icon,
  title,
  detail,
  complete,
  action,
  busy,
  label,
}: {
  icon: typeof WalletCards;
  title: string;
  detail: string;
  complete: boolean;
  action: () => void;
  busy: boolean;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-[#e3e8ef] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f7] text-[#667085]">
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#667085]">{detail}</p>
            </div>
            {complete && <Check size={16} className="shrink-0 text-[#087a55]" />}
          </div>
          <button
            onClick={action}
            disabled={complete || busy}
            className="button-secondary mt-3"
          >
            {complete ? "Recorded" : label}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Radio,
  Wallet,
} from "lucide-react";

import { useJourney } from "@/components/app-providers";
import { LoadingScreen } from "@/components/loading-screen";
import { PageShell } from "@/components/page-shell";
import type { RiskLevel, TestnetOperation } from "@/lib/domain/types";
import { RouteCard } from "@/components/route-card";
import {
  ARC_TESTNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  type LifiQuoteResult,
} from "@/lib/lifi";
import { arcExplorer, baseSepoliaExplorer } from "@/lib/networks";

const operations: Array<{
  value: TestnetOperation;
  label: string;
  protocol: string;
}> = [
  { value: "transfer", label: "Transfer", protocol: "Wallet" },
  { value: "swap", label: "Swap", protocol: "Aerodrome" },
  { value: "supply", label: "Supply collateral", protocol: "Aave" },
  { value: "borrow", label: "Borrow", protocol: "Aave" },
  { value: "approve", label: "Set allowance", protocol: "Token contract" },
  { value: "inspect", label: "Inspect allowance", protocol: "Monitor" },
  { value: "revoke", label: "Revoke allowance", protocol: "Monitor" },
  { value: "stake", label: "Stake ETH", protocol: "Lido" },
  { value: "bridge", label: "Bridge assets", protocol: "Arc Gateway" },
];

const prices: Record<string, number> = {
  ETH: 2_000,
  USDC: 1,
  CBBTC: 60_000,
  WSTETH: 2_250,
};

function previewRisk(input: {
  operation: TestnetOperation;
  amount: number;
  asset: string;
  slippage: number;
  healthFactor: number;
  unlimited: boolean;
  trusted: boolean;
}): { level: RiskLevel; notes: string[] } {
  const notes: string[] = [];
  let level: RiskLevel = "low";
  const escalate = (next: RiskLevel) => {
    const order = { low: 0, medium: 1, high: 2, critical: 3 };
    if (order[next] > order[level]) level = next;
  };

  if (input.amount * (prices[input.asset] ?? 1) > 5_000) {
    notes.push("Material portfolio concentration");
    escalate("high");
  }
  if (input.operation === "swap" && input.slippage > 3) {
    notes.push("Wide execution tolerance");
    escalate("high");
  }
  if (input.operation === "borrow" && input.healthFactor < 1.5) {
    notes.push("Liquidation threshold is close");
    escalate("critical");
  }
  if (input.operation === "approve" && input.unlimited) {
    notes.push("Unlimited spending authority");
    escalate("critical");
  }
  if (input.operation === "approve" && !input.trusted) {
    notes.push("Unverified contract");
    escalate("critical");
  }
  if (input.operation === "bridge") {
    notes.push("Cross-chain trust boundary");
    escalate("medium");
  }
  if (!notes.length) notes.push("No material risk signal detected");
  return { level, notes };
}

export default function ExplorePage() {
  const { state, summary, loading, busy, post } = useJourney();
  const [operation, setOperation] = useState<TestnetOperation>("transfer");
  const [network, setNetwork] = useState<"base-sepolia" | "arc-testnet">(
    "base-sepolia",
  );
  const [asset, setAsset] = useState("ETH");
  const [targetAsset, setTargetAsset] = useState("USDC");
  const [amount, setAmount] = useState(0.1);
  const [recipient, setRecipient] = useState(
    "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
  );
  const [slippage, setSlippage] = useState(0.5);
  const [healthFactor, setHealthFactor] = useState(1.85);
  const [unlimited, setUnlimited] = useState(false);
  const [trusted, setTrusted] = useState(true);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [route, setRoute] = useState<LifiQuoteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!["swap", "bridge"].includes(operation)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoute(null);
      return;
    }
    setRouteLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch("/api/routes/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromChain: BASE_SEPOLIA_CHAIN_ID,
          toChain:
            operation === "bridge" ? ARC_TESTNET_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID,
          fromToken: asset,
          toToken: operation === "swap" ? targetAsset : asset,
          fromAmountUnits: String(amount),
        }),
        signal: controller.signal,
      })
        .then((r) => r.json() as Promise<LifiQuoteResult>)
        .then(setRoute)
        .catch(() => {})
        .finally(() => setRouteLoading(false));
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      setRouteLoading(false);
    };
  }, [operation, asset, targetAsset, amount]);

  const risk = useMemo(
    () =>
      previewRisk({
        operation,
        amount,
        asset,
        slippage,
        healthFactor,
        unlimited,
        trusted,
      }),
    [operation, amount, asset, slippage, healthFactor, unlimited, trusted],
  );

  if (loading || !state || !summary) return <LoadingScreen />;

  const currentOperation = operations.find((item) => item.value === operation)!;
  const findings = state.testnet.findings.filter((finding) => !finding.resolved);
  const visibleTransactions =
    riskFilter === "all"
      ? state.testnet.transactions
      : state.testnet.transactions.filter((tx) => tx.risk === riskFilter);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await post(
      "/api/testnet/operate",
      {
        operation,
        network,
        protocol: currentOperation.protocol,
        asset,
        targetAsset: operation === "swap" ? targetAsset : undefined,
        amount: ["inspect", "revoke"].includes(operation) ? 0 : amount,
        recipient: operation === "transfer" ? recipient : undefined,
        slippage: operation === "swap" ? slippage : undefined,
        healthFactor: operation === "borrow" ? healthFactor : undefined,
        unlimited: operation === "approve" ? unlimited : undefined,
        trusted: operation === "approve" ? trusted : undefined,
      },
      "testnet-operation",
    );
  }

  return (
    <PageShell>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#087a55]">
            <Radio size={14} />
            Monitor active
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">
            Testnet desk
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">
            Operate freely across Base Sepolia and Arc Testnet. The desk does not
            force a lesson sequence; it records behavior, identifies risk, and
            recognizes competencies when they appear.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#d6e9df] bg-[#eaf8f2] px-4 py-3 text-xs font-bold text-[#087a55]">
          <Activity size={15} />
          {summary.monitoredOperations} operations observed
        </div>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(state.testnet.balances).map(([symbol, balance]) => (
          <div key={symbol} className="metric">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#667085]">{symbol}</p>
              <Wallet size={14} className="text-[#98a2b3]" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 5 })}
            </p>
            <p className="mt-2 text-xs text-[#98a2b3]">
              ~ ${(balance * (prices[symbol] ?? 1)).toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="surface rounded-xl p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold">Transaction composer</p>
              <p className="mt-1 text-xs text-[#667085]">Simulated execution, real risk model.</p>
            </div>
            <ArrowDownUp size={18} className="text-[#315efb]" />
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#667085]">
              Network
            </span>
            <select
              value={network}
              onChange={(event) =>
                setNetwork(event.target.value as "base-sepolia" | "arc-testnet")
              }
              className="field"
            >
              <option value="base-sepolia">Base Sepolia</option>
              <option value="arc-testnet">Arc Testnet</option>
            </select>
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-semibold text-[#667085]">
              Operation
            </span>
            <select
              value={operation}
              onChange={(event) =>
                setOperation(event.target.value as TestnetOperation)
              }
              className="field"
            >
              {operations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} / {item.protocol}
                </option>
              ))}
            </select>
          </label>

          {!["inspect", "revoke"].includes(operation) && (
            <div className="mt-4 grid grid-cols-[1fr_1.35fr] gap-3">
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#667085]">
                  Asset
                </span>
                <select
                  value={asset}
                  onChange={(event) => setAsset(event.target.value)}
                  className="field"
                >
                  {Object.keys(state.testnet.balances).map((symbol) => (
                    <option key={symbol}>{symbol}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#667085]">
                  Amount
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                  className="field"
                />
              </label>
            </div>
          )}

          {operation === "transfer" && (
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold text-[#667085]">
                Recipient
              </span>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                className="field font-mono text-xs"
              />
            </label>
          )}

          {operation === "swap" && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#667085]">
                  Receive
                </span>
                <select
                  value={targetAsset}
                  onChange={(event) => setTargetAsset(event.target.value)}
                  className="field"
                >
                  {Object.keys(state.testnet.balances)
                    .filter((symbol) => symbol !== asset)
                    .map((symbol) => (
                      <option key={symbol}>{symbol}</option>
                    ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-[#667085]">
                  Max slippage %
                </span>
                <input
                  type="number"
                  min="0.01"
                  max="50"
                  step="0.1"
                  value={slippage}
                  onChange={(event) => setSlippage(Number(event.target.value))}
                  className="field"
                />
              </label>
            </div>
          )}

          {operation === "borrow" && (
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold text-[#667085]">
                Projected health factor
              </span>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.05"
                value={healthFactor}
                onChange={(event) => setHealthFactor(Number(event.target.value))}
                className="field"
              />
            </label>
          )}

          {(operation === "swap" || operation === "bridge") && (
            <div className="mt-4">
              {routeLoading && (
                <div className="animate-pulse rounded-lg border border-[#e3e8ef] bg-[#f8fafc] p-4 text-center text-xs text-[#667085]">
                  Resolving route…
                </div>
              )}
              {!routeLoading && route && (
                <RouteCard
                  fromChain={
                    network === "base-sepolia" ? "Base Sepolia" : "Arc Testnet"
                  }
                  fromToken={asset}
                  fromAmount={amount}
                  toChain={operation === "bridge" ? "Arc Testnet" : "Base Sepolia"}
                  toToken={operation === "swap" ? targetAsset : asset}
                  estimatedOutput={route.estimatedOutput}
                  tool={route.toolName}
                  estimatedGasUsd={route.estimatedGasUsd}
                  estimatedDurationSecs={route.estimatedDurationSecs}
                  source={route.source}
                />
              )}
            </div>
          )}

          {operation === "approve" && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-[#e3e8ef] p-3 text-xs">
                <span>
                  <span className="block font-semibold">Unlimited allowance</span>
                  <span className="mt-1 block text-[#667085]">No token cap</span>
                </span>
                <input
                  type="checkbox"
                  checked={unlimited}
                  onChange={(event) => setUnlimited(event.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-[#e3e8ef] p-3 text-xs">
                <span>
                  <span className="block font-semibold">Verified contract</span>
                  <span className="mt-1 block text-[#667085]">Known spender</span>
                </span>
                <input
                  type="checkbox"
                  checked={trusted}
                  onChange={(event) => setTrusted(event.target.checked)}
                />
              </label>
            </div>
          )}

          <div className={`mt-5 rounded-lg p-4 risk-${risk.level}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">Pre-flight risk estimate</p>
              <span className="text-[10px] font-extrabold uppercase">{risk.level}</span>
            </div>
            {risk.notes.map((note) => (
              <p key={note} className="mt-2 text-xs opacity-80">
                {note}
              </p>
            ))}
          </div>

          <button
            type="submit"
            disabled={busy === "testnet-operation"}
            className="button-primary mt-5 w-full"
          >
            Execute on monitored testnet
          </button>
        </form>

        <div className="space-y-5">
          <section className="surface overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-[#e3e8ef] px-5 py-4">
              <div>
                <p className="text-sm font-bold">Operation ledger</p>
                <p className="mt-1 text-xs text-[#667085]">
                  Complete history with observed risk.
                </p>
              </div>
              <Gauge size={18} className="text-[#667085]" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto border-b border-[#edf0f4] px-5 py-2.5">
              {(["all", "low", "medium", "high", "critical"] as const).map(
                (level) => (
                  <button
                    key={level}
                    onClick={() => setRiskFilter(level)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase transition-colors ${
                      riskFilter === level
                        ? level === "all"
                          ? "bg-[#101828] text-white"
                          : `risk-${level}`
                        : "bg-[#f2f4f7] text-[#667085] hover:bg-[#e3e8ef]"
                    }`}
                  >
                    {level}
                  </button>
                ),
              )}
            </div>
            <div className="max-h-[370px] overflow-auto">
              {visibleTransactions.length ? (
                visibleTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="grid gap-3 border-b border-[#edf0f4] px-5 py-4 last:border-0 sm:grid-cols-[1fr_1fr_.7fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-xs font-bold capitalize">{tx.operation}</p>
                      <p className="mt-1 text-[11px] text-[#667085]">
                        {tx.protocol} / {tx.network}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">
                        {tx.amount.toLocaleString()} {tx.asset}
                        {tx.targetAsset ? ` → ${tx.targetAsset}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-[#667085]">
                        ${tx.valueUsd.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded px-2 py-1 text-[10px] font-bold uppercase risk-${tx.risk}`}
                    >
                      {tx.risk}
                    </span>
                    <a
                      href={`${tx.network === "base-sepolia" ? baseSepoliaExplorer : arcExplorer}/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open transaction"
                      className="text-[#667085] hover:text-[#315efb]"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))
              ) : (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold">
                    {riskFilter === "all"
                      ? "Ledger is empty"
                      : `No ${riskFilter} risk transactions`}
                  </p>
                  <p className="mt-2 text-xs text-[#667085]">
                    {riskFilter === "all"
                      ? "Compose any operation to begin exploring."
                      : "Try a different risk filter."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="surface rounded-xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Monitor findings</p>
                <p className="mt-1 text-xs text-[#667085]">
                  Resolve findings through corrective actions, not quiz answers.
                </p>
              </div>
              <AlertTriangle
                size={18}
                className={findings.length ? "text-[#c33838]" : "text-[#087a55]"}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {findings.slice(0, 4).map((finding) => (
                <div key={finding.id} className="rounded-lg border border-[#e3e8ef] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold">{finding.title}</p>
                    <span
                      className={`rounded px-2 py-1 text-[9px] font-bold uppercase risk-${finding.level}`}
                    >
                      {finding.level}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#667085]">
                    {finding.detail}
                  </p>
                </div>
              ))}
              {!findings.length && (
                <div className="col-span-full flex items-center gap-3 rounded-lg bg-[#eaf8f2] p-4 text-[#087a55]">
                  <CheckCircle2 size={18} />
                  <p className="text-xs font-bold">No unresolved monitor findings.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

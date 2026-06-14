export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const ARC_TESTNET_CHAIN_ID = 5042002;

const LIFI_API = "https://li.quest/v1/quote";

const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  WSTETH: 18,
  USDC: 6,
  CBBTC: 8,
};

export interface QuoteParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmountUnits: string;
}

export interface LifiQuoteResult {
  tool: string;
  toolName: string;
  estimatedOutput: number;
  estimatedOutputSymbol: string;
  estimatedGasUsd: number;
  estimatedDurationSecs: number;
  source: "lifi" | "simulated";
}

function toWei(amount: string, decimals: number): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  const units =
    BigInt(whole) * BigInt(10) ** BigInt(decimals) +
    BigInt(fracPadded.replace(/^0+$/, "0") || "0");
  return units.toString();
}

export function simulateFallback(params: QuoteParams): LifiQuoteResult {
  const input = Number(params.fromAmountUnits);
  const isBridge = params.fromChain !== params.toChain;
  return {
    tool: isBridge ? "arc-gateway" : "aerodrome",
    toolName: isBridge ? "Arc Gateway" : "Aerodrome",
    estimatedOutput: Math.round(input * 0.997 * 1000) / 1000,
    estimatedOutputSymbol: params.toToken,
    estimatedGasUsd: isBridge ? 0.15 : 0.08,
    estimatedDurationSecs: isBridge ? 300 : 30,
    source: "simulated",
  };
}

interface RawLifiQuote {
  tool?: string;
  toolDetails?: { name?: string };
  estimate?: {
    toAmount?: string;
    gasCosts?: Array<{ amountUSD?: string }>;
    executionDuration?: number;
  };
}

export function normalizeQuote(
  raw: RawLifiQuote,
  params: QuoteParams,
): LifiQuoteResult {
  const toDecimals = TOKEN_DECIMALS[params.toToken] ?? 18;
  const estimatedOutput = raw.estimate?.toAmount
    ? Number(BigInt(raw.estimate.toAmount)) / 10 ** toDecimals
    : Number(params.fromAmountUnits) * 0.997;

  const estimatedGasUsd = (raw.estimate?.gasCosts ?? []).reduce(
    (sum, g) => sum + Number(g.amountUSD ?? 0),
    0,
  );

  return {
    tool: raw.tool ?? "unknown",
    toolName: raw.toolDetails?.name ?? raw.tool ?? "Unknown",
    estimatedOutput: Math.round(estimatedOutput * 1000) / 1000,
    estimatedOutputSymbol: params.toToken,
    estimatedGasUsd: Math.round(estimatedGasUsd * 100) / 100,
    estimatedDurationSecs: raw.estimate?.executionDuration ?? 60,
    source: "lifi",
  };
}

export async function fetchLifiQuote(
  params: QuoteParams,
): Promise<LifiQuoteResult> {
  if (
    params.toChain === ARC_TESTNET_CHAIN_ID ||
    params.fromChain === ARC_TESTNET_CHAIN_ID
  ) {
    return simulateFallback(params);
  }

  const decimals = TOKEN_DECIMALS[params.fromToken] ?? 18;
  const fromAmount = toWei(params.fromAmountUnits, decimals);

  const url = new URL(LIFI_API);
  url.searchParams.set("fromChain", String(params.fromChain));
  url.searchParams.set("toChain", String(params.toChain));
  url.searchParams.set("fromToken", params.fromToken);
  url.searchParams.set("toToken", params.toToken);
  url.searchParams.set("fromAmount", fromAmount);
  url.searchParams.set(
    "fromAddress",
    "0x0000000000000000000000000000000000000001",
  );

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(4_000),
  });

  if (!res.ok) return simulateFallback(params);

  const raw = (await res.json()) as RawLifiQuote;
  return normalizeQuote(raw, params);
}

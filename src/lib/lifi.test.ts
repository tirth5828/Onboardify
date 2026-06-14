import { describe, expect, it } from "vitest";

import {
  ARC_TESTNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  normalizeQuote,
  simulateFallback,
} from "./lifi";

const baseParams = {
  fromChain: BASE_SEPOLIA_CHAIN_ID,
  toChain: BASE_SEPOLIA_CHAIN_ID,
  fromToken: "ETH",
  toToken: "USDC",
  fromAmountUnits: "1",
};

describe("simulateFallback", () => {
  it("returns simulated source with fee applied", () => {
    const result = simulateFallback(baseParams);
    expect(result.source).toBe("simulated");
    expect(result.estimatedOutput).toBeCloseTo(0.997, 3);
    expect(result.estimatedOutputSymbol).toBe("USDC");
  });

  it("uses arc-gateway tool for cross-chain routes", () => {
    const result = simulateFallback({
      ...baseParams,
      toChain: ARC_TESTNET_CHAIN_ID,
    });
    expect(result.tool).toBe("arc-gateway");
    expect(result.estimatedDurationSecs).toBeGreaterThanOrEqual(300);
  });

  it("uses aerodrome for same-chain routes", () => {
    const result = simulateFallback(baseParams);
    expect(result.tool).toBe("aerodrome");
    expect(result.estimatedDurationSecs).toBeLessThan(60);
  });
});

describe("normalizeQuote", () => {
  it("converts USDC toAmount (6 decimals) to human-readable output", () => {
    const raw = {
      tool: "stargate",
      toolDetails: { name: "Stargate" },
      estimate: {
        toAmount: "997000000", // 997 USDC with 6 decimals
        gasCosts: [{ amountUSD: "0.42" }],
        executionDuration: 180,
      },
    };
    const result = normalizeQuote(raw, { ...baseParams, toToken: "USDC" });
    expect(result.source).toBe("lifi");
    expect(result.toolName).toBe("Stargate");
    expect(result.estimatedOutput).toBeCloseTo(997, 0);
    expect(result.estimatedGasUsd).toBeCloseTo(0.42, 2);
    expect(result.estimatedDurationSecs).toBe(180);
  });

  it("falls back to 0.997x estimate when toAmount is missing", () => {
    const result = normalizeQuote({}, { ...baseParams, fromAmountUnits: "2" });
    expect(result.estimatedOutput).toBeCloseTo(1.994, 2);
    expect(result.estimatedGasUsd).toBe(0);
  });
});

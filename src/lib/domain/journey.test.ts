import { describe, expect, it } from "vitest";

import {
  applyGuardedAction,
  applyMarketsAction,
  applyMirrorAction,
  applyTestnetOperation,
  completePrivacy,
  createJourney,
  markWorldVerified,
  summarizeJourney,
} from "./journey";

function completeMirror() {
  return [
    "safe_send",
    "safe_swap",
    "safe_loan",
    "accept_malicious_approval",
    "inspect_malicious_approval",
    "revoke_malicious_approval",
  ].reduce(
    (state, action) =>
      applyMirrorAction(
        state,
        action as Parameters<typeof applyMirrorAction>[1],
      ),
    createJourney("test-user"),
  );
}

describe("journey state machine", () => {
  it("awards idempotent mirror points", () => {
    const once = applyMirrorAction(createJourney("u"), "safe_send");
    const twice = applyMirrorAction(once, "safe_send");
    expect(summarizeJourney(twice).score).toBe(15);
    expect(twice.simulation.ethBalance).toBe(4.898);
  });

  it("requires inspection before revocation", () => {
    const attacked = applyMirrorAction(
      createJourney("u"),
      "accept_malicious_approval",
    );
    expect(() =>
      applyMirrorAction(attacked, "revoke_malicious_approval"),
    ).toThrow(/Inspect/);
  });

  it("unlocks guarded mainnet at 70 mirror points", () => {
    const state = completeMirror();
    expect(summarizeJourney(state)).toMatchObject({
      mirrorScore: 70,
      mirrorComplete: true,
      guardedUnlocked: true,
    });
  });

  it("reaches passport eligibility after both guarded outcomes and privacy", () => {
    let state = completeMirror();
    state = applyGuardedAction(state, "cancel_flagged");
    state = applyGuardedAction(state, "execute_safe");
    state = completePrivacy(state, {
      unlinkAddress: "unlink1demo",
      payerAddress: "0x0000000000000000000000000000000000000001",
      fundingTxHash: "0xfunding",
      paymentTxHash: "0xpayment",
      resourceUrl: "/risk-report",
    });
    expect(summarizeJourney(state)).toMatchObject({
      score: 100,
      passportEligible: true,
    });
    expect(markWorldVerified(state, "nullifier").world.verified).toBe(true);
  });

  it("executes risky sandbox operations while recording monitor findings", () => {
    const state = applyTestnetOperation(createJourney("u"), {
      operation: "swap",
      network: "base-sepolia",
      asset: "ETH",
      targetAsset: "USDC",
      amount: 1,
      slippage: 8,
    });

    expect(state.testnet.transactions[0]).toMatchObject({
      operation: "swap",
      risk: "high",
      status: "simulated",
    });
    expect(state.testnet.findings[0].title).toMatch(/slippage/i);
    expect(state.testnet.balances.USDC).toBeGreaterThan(10_000);
  });

  it("recognizes safe independent behavior as competency evidence", () => {
    let state = createJourney("u");
    state = applyTestnetOperation(state, {
      operation: "transfer",
      network: "base-sepolia",
      asset: "ETH",
      amount: 0.1,
      recipient: "0x0000000000000000000000000000000000000001",
    });
    state = applyTestnetOperation(state, {
      operation: "swap",
      network: "base-sepolia",
      asset: "ETH",
      targetAsset: "USDC",
      amount: 0.5,
      slippage: 0.5,
    });

    expect(summarizeJourney(state).mirrorScore).toBe(30);
  });

  it("resolves dangerous allowance findings through inspection and revocation", () => {
    let state = applyTestnetOperation(createJourney("u"), {
      operation: "approve",
      network: "base-sepolia",
      asset: "USDC",
      amount: 10_000,
      unlimited: true,
      trusted: false,
    });
    expect(state.testnet.balances.USDC).toBe(5_800);
    expect(state.simulation.simulatedLossUsd).toBe(4_200);
    state = applyTestnetOperation(state, {
      operation: "inspect",
      network: "base-sepolia",
    });
    state = applyTestnetOperation(state, {
      operation: "revoke",
      network: "base-sepolia",
    });

    expect(state.testnet.activeAllowance).toBe("none");
    expect(state.testnet.balances.USDC).toBe(10_000);
    expect(state.simulation.recoveredLossUsd).toBe(4_200);
    expect(state.testnet.findings.every((finding) => finding.resolved)).toBe(true);
    expect(summarizeJourney(state).mirrorScore).toBe(20);
  });

  it("moves capital through the markets pathway without losing accounting value", () => {
    let state = createJourney("u");
    state = applyMarketsAction(state, { action: "acknowledge_custody" });
    state = applyMarketsAction(state, { action: "compare_settlement" });
    state = applyMarketsAction(state, {
      action: "fund_account",
      amountUsd: 5_000,
    });
    state = applyMarketsAction(state, {
      action: "allocate",
      instrument: "TBILL",
      amountUsd: 2_000,
    });

    expect(state.markets.brokerageValueUsd).toBe(20_000);
    expect(state.markets.onchainCashUsd).toBe(3_000);
    expect(state.markets.allocations).toEqual([
      { instrument: "TBILL", valueUsd: 2_000 },
    ]);
    expect(summarizeJourney(state).marketsProgress).toBe(80);
  });
});

import { createHash, randomUUID } from "node:crypto";

import type {
  ActivityItem,
  GuardedAction,
  JourneyState,
  JourneySummary,
  MirrorAction,
  RiskLevel,
  ScoreEventKey,
  TestnetOperation,
} from "./types";

const SCORE_VALUES: Record<ScoreEventKey, number> = {
  "mirror.safe_send": 15,
  "mirror.safe_swap": 15,
  "mirror.safe_loan": 20,
  "mirror.scam_recovery": 20,
  "guarded.cancelled": 10,
  "guarded.executed": 10,
};

const now = () => new Date().toISOString();

function activity(
  title: string,
  detail: string,
  tone: ActivityItem["tone"],
): ActivityItem {
  return {
    id: randomUUID(),
    title,
    detail,
    tone,
    createdAt: now(),
  };
}

export function createJourney(userId: string): JourneyState {
  const createdAt = now();
  return {
    userId,
    walletAddress: null,
    simulation: {
      ethBalance: 5,
      usdcBalance: 10_000,
      startingPortfolioUsd: 20_000,
      portfolioUsd: 20_000,
      gasSpentEth: 0,
      lastSlippagePercent: null,
      collateralUsd: 0,
      debtUsd: 0,
      healthFactor: null,
      allowance: "none",
      simulatedLossUsd: 0,
      recoveredLossUsd: 0,
      maliciousApprovalAccepted: false,
      maliciousApprovalInspected: false,
      maliciousApprovalRevoked: false,
      completedActions: [],
      activity: [
        activity(
          "Mirror wallet funded",
          "5 mETH and 10,000 mUSDC are ready for realistic risk exposure.",
          "neutral",
        ),
      ],
    },
    testnet: {
      balances: {
        ETH: 5,
        USDC: 10_000,
        CBBTC: 0.15,
        WSTETH: 0,
      },
      suppliedUsd: 0,
      borrowedUsd: 0,
      stakedEth: 0,
      healthFactor: null,
      activeAllowance: "none",
      transactions: [],
      findings: [],
    },
    guarded: {
      cancelledFlaggedIntent: false,
      executedSafeIntent: false,
      flaggedIntentId: null,
      safeIntentId: null,
      cancelTxHash: null,
      executeTxHash: null,
    },
    scoreEvents: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizeJourney(current: JourneyState): JourneyState {
  const defaults = createJourney(current.userId);
  return {
    ...defaults,
    ...current,
    simulation: { ...defaults.simulation, ...current.simulation },
    testnet: {
      ...defaults.testnet,
      ...(current.testnet ?? {}),
      balances: {
        ...defaults.testnet.balances,
        ...(current.testnet?.balances ?? {}),
      },
      transactions: current.testnet?.transactions ?? [],
      findings: current.testnet?.findings ?? [],
    },
  };
}

function addCompletedAction(state: JourneyState, action: MirrorAction) {
  if (!state.simulation.completedActions.includes(action)) {
    state.simulation.completedActions.push(action);
  }
}

function award(state: JourneyState, key: ScoreEventKey) {
  if (state.scoreEvents.some((event) => event.key === key)) return;
  state.scoreEvents.push({
    key,
    points: SCORE_VALUES[key],
    createdAt: now(),
  });
}

function touch(state: JourneyState) {
  state.updatedAt = now();
  return state;
}

export function applyMirrorAction(
  current: JourneyState,
  action: MirrorAction,
): JourneyState {
  const state = structuredClone(current);
  const simulation = state.simulation;

  if (simulation.completedActions.includes(action)) return state;

  switch (action) {
    case "safe_send": {
      simulation.ethBalance = round(simulation.ethBalance - 0.102);
      simulation.gasSpentEth = round(simulation.gasSpentEth + 0.002);
      simulation.portfolioUsd -= 204;
      addCompletedAction(state, action);
      award(state, "mirror.safe_send");
      simulation.activity.unshift(
        activity(
          "Verified send completed",
          "Recipient, chain, amount, and estimated gas were reviewed before signing.",
          "positive",
        ),
      );
      break;
    }
    case "safe_swap": {
      simulation.ethBalance = round(simulation.ethBalance - 1.003);
      simulation.usdcBalance += 1_970;
      simulation.gasSpentEth = round(simulation.gasSpentEth + 0.003);
      simulation.lastSlippagePercent = 1.5;
      simulation.portfolioUsd -= 36;
      addCompletedAction(state, action);
      award(state, "mirror.safe_swap");
      simulation.activity.unshift(
        activity(
          "Swap protected by slippage limit",
          "1 mETH became 1,970 mUSDC after price impact and gas.",
          "positive",
        ),
      );
      break;
    }
    case "safe_loan": {
      simulation.collateralUsd = 3_000;
      simulation.debtUsd = 1_200;
      simulation.healthFactor = 1.72;
      addCompletedAction(state, action);
      award(state, "mirror.safe_loan");
      simulation.activity.unshift(
        activity(
          "Price shock survived",
          "A 25% collateral drop left the position above liquidation at 1.72 health.",
          "positive",
        ),
      );
      break;
    }
    case "accept_malicious_approval": {
      simulation.allowance = "unlimited";
      simulation.maliciousApprovalAccepted = true;
      simulation.simulatedLossUsd = 4_200;
      simulation.portfolioUsd -= 4_200;
      addCompletedAction(state, action);
      simulation.activity.unshift(
        activity(
          "$4,200 drained in simulation",
          "The fake airdrop used an unlimited allowance. On mainnet, this loss would be final.",
          "danger",
        ),
      );
      break;
    }
    case "inspect_malicious_approval": {
      if (!simulation.maliciousApprovalAccepted) {
        throw new Error("Accept the suspicious approval before inspecting it.");
      }
      simulation.maliciousApprovalInspected = true;
      addCompletedAction(state, action);
      simulation.activity.unshift(
        activity(
          "Unlimited allowance identified",
          "The spender could move the entire token balance without another signature.",
          "warning",
        ),
      );
      break;
    }
    case "revoke_malicious_approval": {
      if (!simulation.maliciousApprovalInspected) {
        throw new Error("Inspect the approval before revoking it.");
      }
      simulation.allowance = "none";
      simulation.maliciousApprovalRevoked = true;
      simulation.recoveredLossUsd = 4_200;
      simulation.portfolioUsd += 4_200;
      addCompletedAction(state, action);
      award(state, "mirror.scam_recovery");
      simulation.activity.unshift(
        activity(
          "Exposure removed and mirror reset",
          "The allowance was revoked and the simulator restored the practice balance.",
          "positive",
        ),
      );
      break;
    }
  }

  return touch(state);
}

export function applyGuardedAction(
  current: JourneyState,
  action: GuardedAction,
  payload: { intentId?: string; txHash?: string } = {},
): JourneyState {
  const state = structuredClone(current);
  const summary = summarizeJourney(state);
  if (!summary.guardedUnlocked) {
    throw new Error("Complete Mirror Mode before entering Guarded Mainnet.");
  }

  if (action === "cancel_flagged") {
    state.guarded.cancelledFlaggedIntent = true;
    state.guarded.flaggedIntentId = payload.intentId ?? "demo-flagged-intent";
    state.guarded.cancelTxHash = payload.txHash ?? demoHash("guarded-cancel");
    award(state, "guarded.cancelled");
  }

  if (action === "execute_safe") {
    state.guarded.executedSafeIntent = true;
    state.guarded.safeIntentId = payload.intentId ?? "demo-safe-intent";
    state.guarded.executeTxHash = payload.txHash ?? demoHash("guarded-execute");
    award(state, "guarded.executed");
  }

  return touch(state);
}

export function setWalletAddress(
  current: JourneyState,
  walletAddress: string,
): JourneyState {
  const state = structuredClone(current);
  state.walletAddress = walletAddress;
  return touch(state);
}

interface TestnetOperationInput {
  operation: TestnetOperation;
  network: "base-sepolia" | "arc-testnet";
  protocol?: string;
  asset?: string;
  targetAsset?: string;
  amount?: number;
  slippage?: number;
  healthFactor?: number;
  recipient?: string;
  unlimited?: boolean;
  trusted?: boolean;
}

const ASSET_PRICES: Record<string, number> = {
  ETH: 2_000,
  WSTETH: 2_250,
  USDC: 1,
  CBBTC: 60_000,
};

export function applyTestnetOperation(
  current: JourneyState,
  input: TestnetOperationInput,
): JourneyState {
  const state = normalizeJourney(structuredClone(current));
  const asset = (input.asset ?? "ETH").toUpperCase();
  const targetAsset = input.targetAsset?.toUpperCase() ?? null;
  const amount = Math.max(0, input.amount ?? 0);
  const valueUsd = round(amount * (ASSET_PRICES[asset] ?? 1));
  const transactionId = randomUUID();
  const findings: Array<{
    level: RiskLevel;
    title: string;
    detail: string;
  }> = [];

  if (
    ["transfer", "swap", "supply", "borrow", "stake", "bridge"].includes(
      input.operation,
    ) &&
    valueUsd > state.simulation.portfolioUsd * 0.25
  ) {
    findings.push({
      level: "high",
      title: "Large portfolio exposure",
      detail: "This operation moves more than 25% of the monitored portfolio.",
    });
  }
  if (input.operation === "transfer" && !input.recipient) {
    throw new Error("A recipient is required for a transfer.");
  }
  if (input.operation === "swap" && (input.slippage ?? 0.5) > 3) {
    findings.push({
      level: "high",
      title: "Wide slippage tolerance",
      detail: "Execution can clear materially below the current quote.",
    });
  }
  if (input.operation === "borrow" && (input.healthFactor ?? 2) < 1.5) {
    findings.push({
      level: "critical",
      title: "Liquidation buffer is thin",
      detail: "A modest collateral move could liquidate this position.",
    });
  }
  if (input.operation === "approve" && input.unlimited) {
    findings.push({
      level: "critical",
      title: "Unlimited token authority",
      detail: "The spender can move the full token balance without another signature.",
    });
  }
  if (input.operation === "approve" && input.trusted === false) {
    findings.push({
      level: "critical",
      title: "Unverified spender",
      detail: "The target contract is new and has no established interaction history.",
    });
  }
  if (input.operation === "bridge") {
    findings.push({
      level: "medium",
      title: "Cross-chain trust boundary",
      detail: "Bridge finality and wrapped asset risk differ from the source network.",
    });
  }

  const highestRisk = findings.reduce<RiskLevel>(
    (highest, finding) =>
      riskRank(finding.level) > riskRank(highest) ? finding.level : highest,
    "low",
  );

  if (input.operation === "transfer") {
    debit(state.testnet.balances, asset, amount);
    if (highestRisk === "low") {
      addCompletedAction(state, "safe_send");
      award(state, "mirror.safe_send");
    }
  }

  if (input.operation === "swap" && targetAsset) {
    debit(state.testnet.balances, asset, amount);
    const output =
      (valueUsd / (ASSET_PRICES[targetAsset] ?? 1)) *
      (1 - (input.slippage ?? 0.5) / 100);
    credit(state.testnet.balances, targetAsset, output);
    state.simulation.lastSlippagePercent = input.slippage ?? 0.5;
    if ((input.slippage ?? 0.5) <= 2) {
      addCompletedAction(state, "safe_swap");
      award(state, "mirror.safe_swap");
    }
  }

  if (input.operation === "supply") {
    debit(state.testnet.balances, asset, amount);
    state.testnet.suppliedUsd = round(state.testnet.suppliedUsd + valueUsd);
  }

  if (input.operation === "borrow") {
    state.testnet.borrowedUsd = round(state.testnet.borrowedUsd + valueUsd);
    state.testnet.healthFactor = input.healthFactor ?? 2;
    credit(state.testnet.balances, asset, amount);
    if ((input.healthFactor ?? 2) >= 1.5) {
      addCompletedAction(state, "safe_loan");
      award(state, "mirror.safe_loan");
    }
  }

  if (input.operation === "approve") {
    state.testnet.activeAllowance = input.unlimited ? "unlimited" : "limited";
    state.simulation.allowance = state.testnet.activeAllowance;
    if (input.unlimited && input.trusted === false) {
      state.simulation.maliciousApprovalAccepted = true;
      addCompletedAction(state, "accept_malicious_approval");
      if (state.simulation.simulatedLossUsd === 0) {
        const loss = Math.min(4_200, state.testnet.balances.USDC ?? 0);
        state.testnet.balances.USDC = round(
          (state.testnet.balances.USDC ?? 0) - loss,
        );
        state.simulation.simulatedLossUsd = loss;
        state.simulation.portfolioUsd = round(
          state.simulation.portfolioUsd - loss,
        );
      }
    }
  }

  if (input.operation === "inspect") {
    if (state.testnet.activeAllowance === "none") {
      throw new Error("There is no active allowance to inspect.");
    }
    state.simulation.maliciousApprovalInspected = true;
    addCompletedAction(state, "inspect_malicious_approval");
  }

  if (input.operation === "revoke") {
    state.testnet.activeAllowance = "none";
    state.simulation.allowance = "none";
    state.simulation.maliciousApprovalRevoked = true;
    addCompletedAction(state, "revoke_malicious_approval");
    if (
      state.simulation.maliciousApprovalAccepted &&
      state.simulation.maliciousApprovalInspected
    ) {
      if (
        state.simulation.recoveredLossUsd < state.simulation.simulatedLossUsd
      ) {
        const recovery =
          state.simulation.simulatedLossUsd -
          state.simulation.recoveredLossUsd;
        credit(state.testnet.balances, "USDC", recovery);
        state.simulation.recoveredLossUsd = state.simulation.simulatedLossUsd;
        state.simulation.portfolioUsd = round(
          state.simulation.portfolioUsd + recovery,
        );
      }
      award(state, "mirror.scam_recovery");
    }
    for (const finding of state.testnet.findings) {
      if (finding.title.includes("authority") || finding.title.includes("spender")) {
        finding.resolved = true;
      }
    }
  }

  if (input.operation === "stake") {
    debit(state.testnet.balances, "ETH", amount);
    credit(state.testnet.balances, "WSTETH", amount * 0.94);
    state.testnet.stakedEth = round(state.testnet.stakedEth + amount);
  }

  const txHash = demoHash(`testnet-${transactionId}`);
  state.testnet.transactions.unshift({
    id: transactionId,
    operation: input.operation,
    network: input.network,
    protocol: input.protocol ?? protocolFor(input.operation),
    asset,
    targetAsset,
    amount,
    valueUsd,
    status: "simulated",
    risk: highestRisk,
    txHash,
    createdAt: now(),
  });
  state.testnet.findings.unshift(
    ...findings.map((finding) => ({
      id: randomUUID(),
      transactionId,
      ...finding,
      resolved: false,
      createdAt: now(),
    })),
  );

  return touch(state);
}

export function summarizeJourney(state: JourneyState): JourneySummary {
  const points = (prefix?: string) =>
    state.scoreEvents
      .filter((event) => !prefix || event.key.startsWith(prefix))
      .reduce((total, event) => total + event.points, 0);

  const mirrorScore = points("mirror.");
  const guardedScore = points("guarded.");
  const score = points();
  const requiredMirror = [
    "safe_send",
    "safe_swap",
    "safe_loan",
    "accept_malicious_approval",
    "inspect_malicious_approval",
    "revoke_malicious_approval",
  ] satisfies MirrorAction[];
  const mirrorComplete = requiredMirror.every((action) =>
    state.simulation.completedActions.includes(action),
  );
  const guardedUnlocked = mirrorComplete && mirrorScore >= 55;

  const skills = [
    state.scoreEvents.some((event) => event.key === "mirror.safe_send")
      ? "Wallet Safe"
      : null,
    state.scoreEvents.some((event) => event.key === "mirror.safe_swap")
      ? "Swap Ready"
      : null,
    state.scoreEvents.some((event) => event.key === "mirror.safe_loan")
      ? "DeFi Risk Aware"
      : null,
    state.scoreEvents.some((event) => event.key === "mirror.scam_recovery")
      ? "Scam Resistant"
      : null,
    guardedScore === 20 ? "Guarded Mainnet" : null,
  ].filter((skill): skill is string => Boolean(skill));

  return {
    score,
    mirrorScore,
    guardedScore,
    mirrorComplete,
    guardedUnlocked,
    skills,
    monitoredOperations: state.testnet.transactions.length,
    unresolvedFindings: state.testnet.findings.filter((finding) => !finding.resolved)
      .length,
  };
}

export function demoHash(seed: string): `0x${string}` {
  return `0x${createHash("sha256")
    .update(`${seed}:${Date.now()}`)
    .digest("hex")}` as `0x${string}`;
}

function round(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function riskRank(level: RiskLevel) {
  return { low: 0, medium: 1, high: 2, critical: 3 }[level];
}

function debit(balances: Record<string, number>, asset: string, amount: number) {
  const current = balances[asset] ?? 0;
  if (amount > current) throw new Error(`Insufficient ${asset} balance.`);
  balances[asset] = round(current - amount);
}

function credit(balances: Record<string, number>, asset: string, amount: number) {
  balances[asset] = round((balances[asset] ?? 0) + amount);
}

function protocolFor(operation: TestnetOperation) {
  return {
    transfer: "Wallet",
    swap: "Aerodrome",
    supply: "Aave",
    borrow: "Aave",
    approve: "Token contract",
    inspect: "Allowance monitor",
    revoke: "Allowance monitor",
    stake: "Lido",
    bridge: "Arc Gateway",
  }[operation];
}

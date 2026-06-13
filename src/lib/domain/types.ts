export type MirrorAction =
  | "safe_send"
  | "safe_swap"
  | "safe_loan"
  | "accept_malicious_approval"
  | "inspect_malicious_approval"
  | "revoke_malicious_approval";

export type GuardedAction = "cancel_flagged" | "execute_safe";

export type PathwayId = "onchain" | "markets";

export type TestnetOperation =
  | "transfer"
  | "swap"
  | "supply"
  | "borrow"
  | "approve"
  | "inspect"
  | "revoke"
  | "stake"
  | "bridge";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface TestnetTransaction {
  id: string;
  operation: TestnetOperation;
  network: "base-sepolia" | "arc-testnet";
  protocol: string;
  asset: string;
  targetAsset: string | null;
  amount: number;
  valueUsd: number;
  status: "confirmed" | "simulated";
  risk: RiskLevel;
  txHash: string;
  createdAt: string;
}

export interface MonitorFinding {
  id: string;
  transactionId: string;
  level: RiskLevel;
  title: string;
  detail: string;
  resolved: boolean;
  createdAt: string;
}

export interface TestnetState {
  balances: Record<string, number>;
  suppliedUsd: number;
  borrowedUsd: number;
  stakedEth: number;
  healthFactor: number | null;
  activeAllowance: "none" | "limited" | "unlimited";
  transactions: TestnetTransaction[];
  findings: MonitorFinding[];
}

export type MarketsAction =
  | "acknowledge_custody"
  | "compare_settlement"
  | "fund_account"
  | "allocate"
  | "exit_position";

export interface MarketAllocation {
  instrument: "USDC" | "TBILL" | "ETH" | "WSTETH" | "DEX_LP";
  valueUsd: number;
}

export interface MarketActivity {
  id: string;
  title: string;
  detail: string;
  level: RiskLevel;
  createdAt: string;
}

export interface MarketsState {
  completedActions: MarketsAction[];
  brokerageValueUsd: number;
  onchainCashUsd: number;
  allocations: MarketAllocation[];
  activity: MarketActivity[];
}

export type ScoreEventKey =
  | "mirror.safe_send"
  | "mirror.safe_swap"
  | "mirror.safe_loan"
  | "mirror.scam_recovery"
  | "guarded.cancelled"
  | "guarded.executed"
  | "privacy.paid";

export interface SimulationState {
  ethBalance: number;
  usdcBalance: number;
  startingPortfolioUsd: number;
  portfolioUsd: number;
  gasSpentEth: number;
  lastSlippagePercent: number | null;
  collateralUsd: number;
  debtUsd: number;
  healthFactor: number | null;
  allowance: "none" | "limited" | "unlimited";
  simulatedLossUsd: number;
  recoveredLossUsd: number;
  maliciousApprovalAccepted: boolean;
  maliciousApprovalInspected: boolean;
  maliciousApprovalRevoked: boolean;
  completedActions: MirrorAction[];
  activity: ActivityItem[];
}

export interface GuardedState {
  cancelledFlaggedIntent: boolean;
  executedSafeIntent: boolean;
  flaggedIntentId: string | null;
  safeIntentId: string | null;
  cancelTxHash: string | null;
  executeTxHash: string | null;
}

export interface PrivacyState {
  status: "locked" | "ready" | "processing" | "complete" | "failed";
  unlinkAddress: string | null;
  payerAddress: string | null;
  fundingTxHash: string | null;
  paymentTxHash: string | null;
  resourceUrl: string | null;
  error: string | null;
}

export interface WorldState {
  verified: boolean;
  nullifierHash: string | null;
  verifiedAt: string | null;
}

export interface PassportState {
  claimed: boolean;
  tokenId: string | null;
  txHash: string | null;
  claimedAt: string | null;
}

export interface ScoreEvent {
  key: ScoreEventKey;
  points: number;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "warning" | "danger" | "neutral";
  createdAt: string;
}

export interface JourneyState {
  userId: string;
  walletAddress: string | null;
  pathway: PathwayId | null;
  simulation: SimulationState;
  testnet: TestnetState;
  markets: MarketsState;
  guarded: GuardedState;
  privacy: PrivacyState;
  world: WorldState;
  passport: PassportState;
  scoreEvents: ScoreEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface JourneySummary {
  score: number;
  mirrorScore: number;
  guardedScore: number;
  privacyScore: number;
  mirrorComplete: boolean;
  guardedUnlocked: boolean;
  passportEligible: boolean;
  skills: string[];
  marketsProgress: number;
  monitoredOperations: number;
  unresolvedFindings: number;
}

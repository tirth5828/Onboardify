# Mainnet Ready

Mainnet Ready is a monitored testnet environment that helps people move from
financial intuition to independent onchain operation.

## Product paths

- **Onchain path:** complete optional guided risk drills, then freely use the
  Base Sepolia and Arc Testnet desk for transfers, swaps, lending, allowances,
  staking, and bridging.

The risk monitor observes every sandbox operation, records findings, recognizes
competency evidence, and allows risky actions to proceed without turning the
experience into a fixed quiz.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

The default `DEMO_MODE=true` experience is fully runnable without sponsor
credentials. It preserves the same API and state-machine boundaries used by the
live integrations.

## Integrations

- Dynamic JavaScript SDK: authentication and embedded EVM wallets
- Base Sepolia: delayed/cancelable native-token settlement via GuardedTransferVault
- Arc Testnet: additional testnet desk network for multi-chain operations
- Neon + Drizzle: durable journey state

See `.env.example` for live integration settings.

The complete provider setup, contract deployment, required code changes,
security gates, and testnet go-live sequence are documented in
[`docs/ONCHAIN_INTEGRATION_RUNBOOK.md`](docs/ONCHAIN_INTEGRATION_RUNBOOK.md).

## Verify

```bash
npm run lint
npm test
npm run contracts:check
npm run build
```

Foundry tests live in `contracts/test` and can be run with `forge test` once
Foundry is installed.

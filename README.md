# Mainnet Ready

Mainnet Ready is a monitored testnet environment that helps people move from
financial intuition to independent onchain operation.

## Product paths

- **Onchain path:** complete optional guided risk drills, then freely use the
  Base Sepolia and Arc Testnet desk for transfers, swaps, lending, allowances,
  staking, and bridging.
- **Markets Bridge:** translate brokerage custody, T+1 settlement, cash,
  Treasuries, equity risk, yield, and market making into their onchain
  equivalents before building a testnet portfolio.

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
- Base Sepolia: delayed/cancelable native-token settlement and passport minting
- Unlink + Arc Testnet: private balance and private nanopayment flow
- World ID 4.0: unique-human verification before passport issuance
- Neon + Drizzle: durable journey and credential state

See `.env.example` for live integration settings.

## Verify

```bash
npm run lint
npm test
npm run contracts:check
npm run build
```

Foundry tests live in `contracts/test` and can be run with `forge test` once
Foundry is installed.

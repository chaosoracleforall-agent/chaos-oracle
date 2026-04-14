# Chaos Oracle — Project Shutdown

**Date:** April 14, 2026

Chaos Oracle has been permanently shut down. The autonomous AI agent, frontend, and all social accounts have been deactivated.

## If You Have Funds in a Prediction Market

The smart contracts on Base mainnet remain active for claims and reclaims. You can interact with them directly via [BaseScan](https://basescan.org).

### Unresolved Markets (V3)

If you placed a bet on a market that was never resolved, you can reclaim your full bet (no fee) after the market's deadline + 7 days:

1. Go to [V3 Contract on BaseScan](https://basescan.org/address/0x76b714816689eC9f92F139900a04906ba0FBd34b#writeContract)
2. Connect your wallet
3. Call `reclaimBet(marketId)` with the market ID of your bet

### Resolved Markets (V1, V2, V3)

If you won a bet on a resolved market but haven't claimed yet:

1. Go to the relevant contract on BaseScan (see addresses below)
2. Connect your wallet
3. Call `claim(marketId)` with the market ID

## Contract Addresses (Base Mainnet)

| Contract | Address | BaseScan |
|----------|---------|----------|
| PredictionMarketFactoryV3 (paused) | `0x76b714816689eC9f92F139900a04906ba0FBd34b` | [View](https://basescan.org/address/0x76b714816689eC9f92F139900a04906ba0FBd34b) |
| PredictionMarketFactoryV2 (legacy) | `0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6` | [View](https://basescan.org/address/0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6) |
| PredictionMarketFactoryV1 (legacy) | `0x591A48064c1DB035B1562d60ed27cE18B48Bd228` | [View](https://basescan.org/address/0x591A48064c1DB035B1562d60ed27cE18B48Bd228) |
| ChaosCards NFT | `0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5` | [View](https://basescan.org/address/0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5) |
| CHAOS Token | `0xA1864203355AeFAd58c051aC984672a6585C77C9` | [View](https://basescan.org/address/0xA1864203355AeFAd58c051aC984672a6585C77C9) |

## Contract State

- **V3 is paused** — no new bets or markets can be created. `claim()` and `reclaimBet()` still work.
- **V1 and V2** — the agent that resolved markets is shut down. No new resolutions will occur. Use `reclaimBet()` for unresolved markets after the grace period.

## What Was Shut Down

- AI agent (Discord, Twitter, Farcaster, Reddit posting)
- Frontend website
- GCP infrastructure (VM, Firebase Hosting, Secret Manager)
- All paid API integrations
- Social media accounts (@ChaosOracle4all, @chaosmachine, Discord server)

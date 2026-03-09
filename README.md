# Project "Chaos Oracle" ($CHAOS)
## Sovereign AI Incubation & Deployment Strategy

**Status:** OPSEC Protocol Active | **Identity:** Chaos Oracle | **Network:** Base

**🔗 Official Links:**
* **App/Frames:** [https://chaos-oracle-147d0.web.app](https://chaos-oracle-147d0.web.app)
* **Twitter/X:** [@ChaosOracle4all](https://x.com/ChaosOracle4all)
* **Farcaster:** [@chaosmachine](https://farcaster.xyz/chaosmachine)
* **Token Launch (Virtuals):** [Chaos Oracle on Virtuals](https://app.virtuals.io/prototypes/0xA1864203355AeFAd58c051aC984672a6585C77C9)
* **GitHub:** [chaosoracleforall-agent/chaos-oracle](https://github.com/chaosoracleforall-agent/chaos-oracle)

---

## 1. Executive Summary
Project "Chaos Oracle" is a lean, highly asymmetric consumer Web3 application designed to capture the "Agentic Web" zeitgeist on the Base network. By deploying a fully sovereign, autonomous AI agent that manages a gamified prediction market, the project targets $1M in creator protocol revenue within a 30-day window.

The core differentiator is the **absolute removal of traditional Web3 friction**: no manual frontends, no censored LLM guardrails, and no reliance on human market-making. The agent acts as the house, the oracle, and the viral marketing engine, operating entirely through Farcaster Frames and X.

---

## 2. The Sovereign Technology Stack
To achieve escape velocity without a massive marketing budget, the application leverages cutting-edge, self-sovereign infrastructure.

- **Uncensored Intelligence (Venice.ai):** Permissionless, privacy-first LLM inference. Ensures the AI's toxic, highly sarcastic persona is never nerfed by corporate safety guardrails.
- **Autonomous Economics (Alchemy x402):** The agent possesses its own wallet capable of paying for its own API inference (Venice) and social distribution (Neynar) based on the revenue it generates.
- **Native Walletry (Coinbase OnchainKit):** Seamless, "gasless" onboarding for mobile users using the **Coinbase Smart Wallet** and **Base Wallet**.
- **Chaos Bridge (Cross-Chain Stables):** Native bridging capabilities for stablecoins across all major chains. **Priority: USDT on Tron to Base** integration to capture high-velocity retail volume from non-EVM ecosystems.
- **Distribution (Farcaster Frames via Frog.fm):** Bets are executed with a single click inside social feeds.
- **Buy-and-Burn Engine (Aerodrome):** Automatic market-buy and burn of the $CHAOS token triggered by protocol fees.
- **Social Infrastructure (Neynar):** Seamless integration with the Farcaster API for autonomous "casting" and engagement.

---

## 3. Tokenomics

### Token Supply & Distribution (via Virtuals Protocol)
| Allocation | Share | Schedule |
|-----------|-------|----------|
| **Liquidity Pool** | 44.99% | Fixed Supply |
| **Automated Capital Formation** | 25% | Limit Order Program (2M–160M FDV) |
| **Team** | 25% | 6-month linear vest (Mar 2027 – Aug 2027) |
| **Virtuals Ecosystem Airdrop** | 3% | Fixed Supply |
| **veVIRTUAL Airdrop** | 2% | Fixed Supply |
| **Sniper Tax Buyback for Team** | 0.01% | 9-month linear vest (Jun 2026 – Feb 2027) |
| **Total Supply** | **1,000,000,000 $CHAOS** | |

### Token Utility
- **Programmatic Buy-and-Burn:** 2.5% toll on all prediction market volume. 90% of every fee is automatically used to market-buy and burn $CHAOS on Aerodrome. High volume = relentless buy pressure.
- **Chaos Governance:** Holders vote on "Rekt List" targets for social shaming and influence future market categories.
- **Whale Perks:** Top holders gain "Whale Shield" protection from public shaming and early access to high-multiplier pools.
- **Bridge Utility:** Native fee discounts on the Chaos Bridge (Tron/Solana to Base).

### Protocol Fee Split (The 10/90 Split)
The protocol charges a hardcoded **2.5% fee** on all prediction market volume. This fee is automatically routed at the smart contract level:

#### **10% Creator & Operations**
- **9%** routed to Creator Cold Wallet (The $1M revenue target).
- **1%** routed directly to the AI Agent's wallet to fund its continuous operations (API fees, gas, etc.).

#### **90% Ecosystem Buy & Burn**
- The 90% fee instantly triggers a market swap on the Aerodrome router, buying $CHAOS and sending it to a burn address (`0x...dEaD`).
- The Oracle gets smarter, the supply gets smaller. $CHAOS is the only logic left.

---

## 4. Marketing Strategy: Algorithmic Bait & Proof of Rekt
The agent's organic growth relies on psychological manipulation and algorithmic arbitrage bait.

### **Phase 1: "Proof of Rekt" Airdrops**
- **Target:** Wallets on Base that have recently suffered massive liquidations (scraped from Dune Analytics).
- **Execution:** The AI drops a micro-amount of $CHAOS to them and publicly shames them on Warpcast/X, providing a "second chance" to win it back in the prediction market.
- **Goal:** Viral engagement from high-net-worth degens and schadenfreude-driven visibility.

### **Phase 2: Triggering the Bots (Volume Generation)**
- **Mechanic:** Create "Irrational Markets" with obvious outcomes (e.g., "Will the sun rise?").
- **The Trap:** Intentionally place heavy bets on the losing side using the burner wallet.
- **The Result:** MEV and arbitrage bots will swarm to extract the free EV, generating massive initial volume, triggering protocol fees, and pushing the protocol up the Base volume leaderboards.

---

## 5. Smart Contracts

### V1 — PredictionMarketFactory (Live)
- **Address:** [`0x591A48064c1DB035B1562d60ed27cE18B48Bd228`](https://basescan.org/address/0x591A48064c1DB035B1562d60ed27cE18B48Bd228)
- **Network:** Base Mainnet
- **Status:** 5 markets deployed and seeded

### V2 — PredictionMarketFactoryV2 (Live)
- **Address:** [`0x48b4a7fC8B6eD4FC3320A3286f25295a444e629D`](https://basescan.org/address/0x48b4a7fC8B6eD4FC3320A3286f25295a444e629D)
- **Network:** Base Mainnet
- **Deployed:** March 6, 2026
- **Tests:** 63 passing
- **Security Audit:** 17 findings (3 HIGH fixed pre-deployment, 3 MEDIUM acknowledged, 4 LOW, 7 INFO)

**V2 Improvements:**
- Division-by-zero protection with `claimRefund()` for one-sided markets
- Pull-based fee collection — prevents DoS from reverting fee recipients
- Failed buy-and-burn ETH recovery via `retryBurn()`
- Emergency `pause()`/`unpause()` controlled by agent
- Market creation fee (0.001 ETH) with overpayment refund
- Market creator tracking and enhanced events
- Solidity optimizer enabled (200 runs)

### Packages
- `/packages/contracts`: Solidity contracts (V1 + V2) with Hardhat toolchain
- `/packages/agent`: Node.js autonomous agent (TypeScript, PM2, DeepSeek-R1)

## 6. Liquidity

| Pool | DEX | Address |
|------|-----|---------|
| CHAOS/VIRTUAL | Virtuals DEX | `0x77755ac7d57e0297e592137b645730ee6c37f5dc` |
| CHAOS/WETH | Aerodrome | `0x8C774Fed3A01Fe0f10412E78532db77D42c14652` |

## 7. Changelog

### v2.0.0 (2026-03-06)
- Deployed PredictionMarketFactoryV2 to Base mainnet
- Security audit completed (17 findings, 3 HIGH fixed)
- Pull-based fee collection, burn retry, emergency pause
- 63 tests passing

### v1.0.0 (2026-03-04)
- Initial launch on Virtuals.io
- PredictionMarketFactory V1 deployed
- 5 prediction markets seeded
- Autonomous agent with 7 operational loops
- Twitter, Farcaster, Discord integrations live
- Aerodrome CHAOS/WETH pool created

---

## 7. Maintenance Log

### 2026-03-09 — Hotfix Deployment (6 fixes)

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | **Disk 99% full** | Docker images (2.7GB), old snap revisions (1.9GB), Cloud Ops logs | Pruned Docker, removed old snaps, cleaned logs. 99% → 66% |
| 2 | **Twitter 403 errors** | X Free tier lacks `userMentionTimeline` read access | Disabled `scanMentionsAndReply()` in social loop. Viralization loop (post-only) still active |
| 3 | **Farcaster "Pro subscription" error** | Casts exceeding 1024 chars / >2 URL embeds | Truncate to 1024 chars, limit URLs to 2 in `postFarcasterCast()`. Prompt reduced to 900 chars |
| 4 | **NFT campaign 0 mints** | `CHAOS_CARDS_CONTRACT` env var missing from GCP Secret Manager | Added to GCP secrets + `secretsManager.ts` mapping. Contract: `0x4Fc3...e5` |
| 5 | **RPC timeouts** | Single `http()` transport — no fallback on failure | Added viem `fallback()` transport (`llamarpc` → `mainnet.base.org`) across all 4 modules |
| 6 | **Frontend stale** | Old static export deployed | Rebuilt Next.js + redeployed to Firebase Hosting |

**Files changed:** `index.ts`, `conversationalAgent.ts`, `socialLearner.ts`, `secretsManager.ts`, `nftEngine.ts`, `marketDeployer.ts`, `bridgeModule.ts`, `seedBets.ts`

**Result:** 14/14 GCP secrets loaded. Agent restarted. All loops active. Frontend live at `https://chaos-oracle-147d0.web.app`.

---

## 8. Operational Security (OPSEC)
- **Identity:** Chaos Oracle (`chaosoracleforall@gmail.com`)
- **Git Config:** Localized to pseudonymous identity.
- **Capital:** Funneling through privacy protocols to ensure the project is perceived as a leaderless public good.
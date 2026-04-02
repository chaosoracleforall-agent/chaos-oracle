# Chaos Oracle Session Handoff

Date: 2026-03-17
Project: `agent-node`
Status: Safe stopping point reached

## Summary

This session focused on:

- fixing social agent reliability, especially X URL handling and Discord diagnostics
- adding persistent diagnostics, history, and admin tooling
- implementing an autonomous growth system
- wiring campaign, referral, streak, leaderboard, and reward flows into `agent-node`
- building live operator test scripts
- executing a real funded-wallet bet on Base to test first-bet detection
- isolating the remaining production blocker to Base event-log access

## Completed Work

### Social Agent

- Fixed X posting path so canonical Chaos app links are normalized before posting.
- Removed unsafe pre-truncation from growth/announcement tweet paths.
- Added Twitter diagnostics for:
  - normalized URLs
  - possible truncation
  - tweet length
- Added Discord diagnostics for:
  - DMs received
  - monitored message counts
  - cooldown skips
  - permission/intents health

### Social Diagnostics / History

- Added persistent diagnostics state in `social_diagnostics.json`
- Added rotating history log in `social_diagnostics_history.jsonl`
- Added CLI commands:
  - `npm run social:diag`
  - `npm run social:history`
  - `npm run social:history:tail`

### Discord Commands

Added/extended:

- `!diag`
- `!diag verbose`
- `!diag reset`
- `!register`
- `!ref`
- `!join`
- `!growth`
- `!campaign`
- `!rewards`
- `!leaderboard`
- `!growthadmin`
- `!growthadmin queue`
- `!growthadmin replay`
- `!growthadmin resetcursor bet`
- `!growthadmin resetcursor resolve`

### Growth Engine

Implemented `growthEngine.ts` with:

- persistent campaign rotation
- referral code tracking
- wallet registration
- points / streak / leaderboard logic
- queued reward records
- queued Discord DM notifications
- first-bet reward plumbing
- first-win / streak / referral milestone reward plumbing

### Growth Reward Infrastructure

Extended `nftEngine.ts` to create low-cost growth reward claims via SVG/data-URI based metadata, so reward claims do not depend on image generation for routine growth incentives.

### Live Operator Tooling

Added `growthLiveTest.ts` and npm script:

- `npm run growth:test-live`

Supported modes now include:

- `--reset-test-users`
- `--setup`
- `--execute-bet`
- `--confirm-live`
- `--sync-growth`
- `--wait-for-first-bet-detection`
- `--wait-for-reward`
- `--wait-timeout-ms=...`
- `--wait-interval-ms=...`

## Live Runtime State

Latest known bot status:

- Discord bot connected successfully
- intents configured
- guild audit healthy (`monitored=1`, `accessible=1`)

Known runtime warning:

- `CHAOS_CARDS_CONTRACT`, `PINATA_JWT`, and `REPLICATE_API_TOKEN` were initially missing from local fallback env
- later confirmed available in GCP Secret Manager for:
  - `chaos-cards-contract`
  - `pinata-jwt`
  - `replicate-api-token`

## Confirmed Live Actions

### Manual X Post

A manual X diagnostics tweet was posted successfully through the fixed path:

- tweet id: `2033965879998771696`

The X API confirmed the final expanded URL was:

- `https://chaos-oracle-147d0.web.app/`

This verifies the current `postCustomTweet()` path is healthy.

### Real On-Chain Bet

A real funded-wallet bet was executed and confirmed:

- tx: `0x025808532a3f8f0822bdd4ec092764daeb8be7996a31852b3b307703fa5c1fbc`
- block: `43491869`
- contract: `0xA6B12fB5Ac5a4605D45796077E7bd11CAb228c8c`
- bettor wallet: `0x46B268e9C57083F9c6aDd793995214E1503B7275`
- amount: `0.001 ETH`
- side: `YES`

This proves:

- wallet funding is not the blocker
- transaction execution is not the blocker
- market contract is live and writable

## Remaining Blocker

The growth engine still does **not** ingest the confirmed live `BetPlaced` event.

This is no longer a code-logic issue in rewards or referrals. The blocker is event log access.

### Proven provider behavior from this environment

- `https://base.llamarpc.com`
  - `eth_getLogs` -> `429 Too Many Requests`
- `https://mainnet.base.org`
  - `eth_getLogs` -> `403 Forbidden`
- `https://base-rpc.publicnode.com`
  - `eth_getLogs` -> `403 Forbidden`

### Explorer fallback status

- BaseScan / Etherscan V2 fallback code was prepared
- `basescan-api-key` secret was added to GCP Secret Manager
- the V2 logs endpoint still returned:
  - `Free API access is not supported for this chain. Please upgrade your api plan for full chain coverage.`

So the effective blocker is:

- no usable Base log source available yet for this runtime

## GCP Secret Inventory Confirmed

Project used by agent secrets:

- `project-93ba0cb5-fff8-4cf3-a12`

Confirmed accessible secrets:

- `agent-private-key`
- `chaos-cards-contract`
- `pinata-jwt`
- `replicate-api-token`
- `moltbook-api-key`
- `basescan-api-key`

Important note:

- the `basescan-api-key` secret exists, but the current account/plan behind that key still does not provide Base chain V2 log access

## Files Touched This Session

Key files changed:

- `twitterAgent.ts`
- `discordAgent.ts`
- `socialDiagnostics.ts`
- `socialHealth.ts`
- `socialHistory.ts`
- `socialHistoryTail.ts`
- `growthEngine.ts`
- `growthLiveTest.ts`
- `nftEngine.ts`
- `index.ts`
- `secretsManager.ts`
- `package.json`
- `CHANGELOG.md`
- `chaos-oracle/next.config.js`
- `chaos-oracle/firebase.json`
- `chaos-oracle/app/api/frame/route.tsx`

## Current Best Commands

### Social diagnostics

```bash
cd /Users/davidgarcia/agent-node
npm run social:diag -- --verbose
```

### Social history

```bash
cd /Users/davidgarcia/agent-node
npm run social:history -- --limit=20
```

### Growth admin / replay state

Use in Discord:

- `!growthadmin`
- `!growthadmin queue`
- `!growthadmin replay`
- `!growthadmin resetcursor bet`
- `!growthadmin resetcursor resolve`

### Safe growth flow

```bash
cd /Users/davidgarcia/agent-node
npm run growth:test-live -- --reset-test-users --setup
```

### Full funded-wallet flow

```bash
cd /Users/davidgarcia/agent-node
npm run growth:test-live -- \
  --reset-test-users \
  --setup \
  --execute-bet \
  --confirm-live \
  --sync-growth \
  --wait-for-first-bet-detection \
  --wait-for-reward \
  --wait-timeout-ms=180000 \
  --wait-interval-ms=15000 \
  --market-id=0 \
  --bet-side=yes \
  --bet-amount=0.001 \
  --referrer-user=discord_user_a \
  --referrer-handle=user-a \
  --referrer-wallet=0xYourReferrerWallet \
  --referred-user=discord_user_b \
  --referred-handle=user-b \
  --referred-wallet=0xYourReferredWallet \
  --referred-private-key=0xYourReferredWalletPrivateKey
```

## Exactly What To Do Next

Resume by testing log-source access first, not by placing another bet.

### Step 1

Re-probe the BaseScan/Etherscan V2 logs endpoint using the upgraded key and confirmed bet block.

If it still returns:

- `Free API access is not supported for this chain`

then the plan/key upgrade still hasn’t propagated or still does not include Base logs.

### Step 2

Once either:

- a Base RPC allows `eth_getLogs`, or
- the BaseScan/Etherscan key gains Base V2 logs access,

rerun growth ingestion against the **already-confirmed live bet** instead of placing a new one.

### Step 3

Verify the following state moves:

- `wallet.totalBets > 0`
- `wallet.firstBetAt` set
- `user.firstBetRewardIssued = true`
- reward queue pending/issued entry created
- DM notification queued

## Resume Point

The exact resume point for the next session is:

> Re-test event-log access for the confirmed live bet at block `43491869`, then rerun `GrowthEngine.runAutomationCycle()` with GCP-loaded reward secrets and inspect `growth_engine_state.json`.


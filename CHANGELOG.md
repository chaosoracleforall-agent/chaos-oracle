# Changelog

## [4.2.1] - 2026-04-03

### Fixed
- **Markets not loading** — V2 and V1 market fetches now wrapped in individual try-catch blocks. A failure in one contract no longer prevents markets from other contracts from displaying.
- **Leaderboard "Failed to load" error** — V2 event log fetches now have `.catch()` fallbacks matching V3. RPC failures no longer crash the entire leaderboard.
- **Claim NFT page 404** — Created missing `/claim/page.tsx` route wrapping `ClaimContent` with dynamic import (SSR disabled for wagmi hooks).
- **Bridge page 404** — Created `/bridge/page.tsx` with links to Base Bridge, Relay, and Orbiter Finance.
- **vault.enc removed from git** — Encrypted vault file was tracked despite `.gitignore` rule; now properly excluded.

### Security
- Final security audit passed: git history clean, no hardcoded secrets, all credentials rotated, `.gitignore` comprehensive.

## [4.2.0] - 2026-04-03

### Added
- **PredictionMarketFactoryV3 deployed to Base mainnet** — `0x76b714816689eC9f92F139900a04906ba0FBd34b`. Features: upgradeable agent wallet, market deadlines, 24h resolution dispute window, circuit breaker, CHAOS-gated market creation, tiered fees, bet reclamation.
- **Frontend V3 support** — Markets from V3 contract displayed alongside V1/V2. Deadline selector in market creation form (1/3/7/14/30 days).
- **Farcaster Frames updated** — Frame API now reads from V3 contract.
- **Leaderboard aggregates V2+V3** — BetPlaced and MarketResolved events fetched from both contracts.

### Changed
- Market creation now targets V3 contract with required deadline parameter.
- BaseScan link in footer updated to V3 contract address.
- Agent `.env` updated to V3 contract address on VM.

## [4.1.1] - 2026-04-03

### Added
- **Twitter mention scanning re-enabled** — Account upgraded to Basic tier; `scanMentionsAndReply()` now runs every 15-20 min with numeric SELF_USER_ID validation and 403 diagnostic logging.
- **Farcaster channel posting** — 30% of viralization casts posted to relevant channels (/base, /defi, /crypto, /prediction-markets) based on content keywords.
- **A/B format tracking** — Posts now track format (single/thread/quote_cast); engagement data feeds into format performance metrics for comparing thread vs single tweet effectiveness.

### Fixed
- **Reddit agent crashes** — `loadState()` now validates all array/object fields with migration guards. Fixes `Cannot read properties of undefined (reading 'filter')` on `verifyRecentPosts()` and `getStats()`.
- **Moltbook agent crashes** — `loadState()` now validates `subscribedSubmolts`, `followedAgents`, `postHistory`, `commentHistory` arrays. Fixes `Cannot read properties of undefined (reading 'includes')`.

## [4.1.0] - 2026-04-03

### Added
- **Tweet dedup** — LLM prompts now include recent post history to prevent repetitive tweets and Farcaster casts.
- **Reply dedup** — In-memory ring buffer of recent replies prevents repetitive response themes across users.
- **Twitter thread support** — 20% chance to post 3-tweet threads instead of single tweets, using ContentStrategy for topic selection.
- **Farcaster quote casts** — New 6-hour loop fetches trending crypto casts and posts witty commentary as quote casts (up to 2 per cycle).
- **Proactive Farcaster likes** — Auto-likes all mentions before replying + 8 relevant trending casts per quote cast cycle.
- **Discord emoji reactions** — Context-aware emoji reactions on keyword-matched messages before replying.
- **Time-of-day posting optimization** — Calculates best posting hour per platform from engagement data; skips viralization cycles outside optimal windows (forces post if >8h silent).
- **Cross-platform syndication** — 30% chance per viralization cycle to rephrase top-performing Farcaster content for Twitter.
- **Streak shoutouts** — Win streaks >= 5 generate social posts broadcast to Twitter, Farcaster, and Discord.
- **Dynamic content weight rebalancing** — ContentStrategy weights auto-adjust every 6 hours based on engagement performance (20% boost/reduction, capped at 5%-40%).
- **GrowthIntelligence actions wired** — INCREASE_POSTING activates 12h posting boost (2h interval), COMMUNITY_EVENT auto-generates and broadcasts to Discord/Farcaster, ALERT_TEAM sends email notification.
- **Twitter engagement estimation** — Indirect engagement collection via mention timeline reply counting (Free tier compatible).

### Fixed
- **ContentStrategy state migration** — Guard against missing `recentTypes` array in older state files on VM.
- **GrowthIntelligence null safety** — Guard against undefined `contentRegistry` in SocialLearner state.

## [4.0.1] - 2026-04-02

### Changed
- **V3 deploy script updated for testnet** — `scripts/deploy_v3.js` now auto-detects network; on Base Sepolia (or local Hardhat) it deploys a MockERC20 as tCHAOS, uses zero-address Aerodrome router (buy-and-burn disabled), and sets deployer as both creator and agent. Mainnet config preserved for `--network base`. Verified end-to-end on Hardhat local network.

### Note
- Base Sepolia deployment pending: wallet `0x6a2A797CB5736252E44B81965aa7fcF7f43F4103` needs testnet ETH. Faucets require browser-based CAPTCHA or mainnet balance. Once funded, deploy with:
  ```bash
  cd packages/contracts
  PRIVATE_KEY=<key> npx hardhat run scripts/deploy_v3.js --network baseSepolia
  ```

## [4.0.0] - 2026-04-02

### Added
- **Monorepo structure** — Unified frontend, agent, and contracts into `packages/{frontend,agent,contracts}` with npm workspaces. Full git history preserved for frontend.
- **PredictionMarketFactoryV3 contract** — Upgradeable agent wallet, market deadlines, 24h resolution dispute window, on-chain pause/circuit breaker, CHAOS-gated market creation, tiered creation fees (standard 0.001 ETH / featured 0.01 ETH), adjustable fee split, bet reclamation after expired deadlines. 79 tests passing.
- **Shared URL utility** (`packages/agent/urlUtils.ts`) — Centralized URL repair, validation, and post-generation injection. Single source of truth for all canonical URLs.
- **Leaderboard component** (`packages/frontend/app/components/Leaderboard.tsx`) — Top 10 predictors by volume with win rates, reading on-chain PlaceBet events.
- **Referral tracking** — `?ref=` query param captured in frontend localStorage before wallet connection, passed through to BettingCard for attribution.
- **Base ecosystem content type** — New `BASE_ECOSYSTEM` content strategy (15% weight) for organic Base DeFi community engagement.
- **Streak gamification** — 3-day (1.5x), 7-day (2x), 30-day (5x) point multipliers with automated NFT milestone rewards.
- **Structured logger** (`packages/agent/logger.ts`) — Typed severity levels, module tags, timestamps.
- **Agent test suite** — 40 tests (vitest): URL utils, kill switch, secrets manager.
- **Agent Dockerfile** — Production-ready containerization for `packages/agent/`.
- **Premium NFT claiming** — OracleSpeaks tier at 0.001 ETH with pro-quality generation.

### Changed
- **Secrets manager hardened** — Critical secrets (private key, API tokens) now abort startup if missing in production. Silent GCP fallback eliminated. Failures logged with secret name.
- **Master controller hardened** — Internal-only caller IDs (`SYSTEM_INTERNAL`, `CLAUDE_CODE`) blocked from external message handlers.
- **URL posting fixed across all agents** — Twitter, Discord, Reddit, Farcaster, and Moltbook all use shared `urlUtils.ts`. LLM prompts no longer contain URL instructions; URLs injected post-generation. Broken URL gate blocks posting.
- **npm dependencies pinned** — All 9 `"latest"` deps replaced with exact versions (axios 1.13.6, ethers 6.16.0, viem 2.47.0, etc.).
- **20 silent catch blocks fixed** — Across 9 agent files, all empty catches now log errors with module name.
- **Farcaster Frame enhanced** — Live market odds display, YES/NO percentage buttons, latest market auto-fetch.
- **Content strategy rebalanced** — Market Alpha 25%, AI Humor 21%, Community 17%, Base Ecosystem 15%, Product CTA 13%, Savage Roast 9%.

### Security
- `.env.example` created with placeholder values; real `.env` excluded from repo via `.gitignore`.
- Agent startup aborts unconditionally if `AGENT_PRIVATE_KEY` missing (any environment).
- V3 contract adds dispute window, pause mechanism, and reclamation to protect user funds.
- Prompt injection defense preserved for non-master users; internal caller spoofing blocked.

## [3.0.1] - 2026-03-12

### Changed
- **V2 contract redeployed** — New address `0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6` (agent wallet fixed from compromised `0x6a2A` to `0x46B2`). Verified on BaseScan.
- **All contract references updated** — page.tsx, ClientComponents.tsx, frame route, README.
- **RPC switched to llamarpc** — `mainnet.base.org` replaced with `base.llamarpc.com` in page.tsx and collection page.
- **Frame route hardened** — marketId parameter validated (rejects non-numeric input).
- **Firebase config fixed** — `.firebaserc` updated to target `chaos-oracle-147d0` directly.

## [3.0.0] - 2026-03-11

### Added
- **Betting UI** (`app/components/BettingCard.tsx`) — Direct on-chain betting from the frontend. Expandable bet cards with YES/NO buttons, amount presets (0.01, 0.05, 0.1 ETH), probability bars, transaction status, and BaseScan links. Uses `placeBet()` via wagmi `useWriteContract`.
- **Navigation header** — Persistent nav bar with links to Markets, Claim NFT, Collection, and Bridge.
- **Live stats bar** — Shows total market count and total ETH volume at the top of the markets page.
- **Share-to-earn on claim page** — After successful NFT claim, shows "Share on X" and "Share on Warpcast" buttons with pre-filled text, plus a copyable referral link (`?ref=` param).
- **NFT Collection page** (`app/collection/page.tsx`) — Displays Chaos Cards global stats: total minted, tier distribution (Prophecy, Rekt Certificate, Chaos Disciple, Chaos Tarot, The Oracle Speaks) with color-coded breakdown. CTA to claim cards.
- **Plausible analytics** — Privacy-friendly, cookie-free analytics via `plausible.io/js/script.js` (free tier, <10K pageviews).
- **Open Graph / SEO metadata** — Comprehensive `<meta>` tags for Twitter Card (`summary_large_image`), Open Graph (title, description, image, URL), and site metadata. OG image placeholder at `/og-image.png`.

### Changed
- **page.tsx rewritten** — Static market cards replaced with interactive `<BettingCard>` components. Layout updated with nav, stats, and improved footer.
- **layout.tsx updated** — Added SEO metadata, OG tags, Twitter card tags, and Plausible script.
- **Protocol version** — Bumped to 3.0.0.

### User Action Required
- Create a 1200x630 branded OG image and place at `chaos-oracle/public/og-image.png` before deploying.
- Register at plausible.io and add `chaos-oracle-147d0.web.app` as a site for analytics to work.

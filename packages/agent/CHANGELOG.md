# Changelog

## [2.2.0] - 2026-03-17

### Added
- **Growth Engine** (`growthEngine.ts`) — Persistent autonomous growth system for Discord-managed wallet registration, referral-code onboarding, on-chain first-bet detection, win/loss tracking, streak progression, leaderboard scoring, weekly campaign rotation, reward queues, and DM notification delivery.
- **Growth reward claims** (`nftEngine.ts`) — Added low-cost growth reward claim creation using SVG badge metadata + on-chain claim codes, so first-bet, referral, streak, and campaign-winner rewards can issue without Replicate image generation.
- **Growth commands in Discord** (`discordAgent.ts`) — Added `!register`, `!ref`, `!join`, `!growth`, `!campaign`, `!rewards`, and `!leaderboard` as the user-facing control plane for the new growth system.
- **Growth automation loop** (`index.ts`) — Agent now runs a 20-minute growth sync loop that scans on-chain bet/resolution events, processes queued NFT rewards, DMs claim codes, and posts campaign / leaderboard updates to Discord, X, and Farcaster.
- **Growth admin controls** (`discordAgent.ts`) — Added admin-only `!growthadmin`, `!growthadmin queue`, `!growthadmin replay`, and `!growthadmin resetcursor bet|resolve` for live intervention in event-sync operations without shell access.
- **Live growth test script** (`growthLiveTest.ts`) — Added a single-command operator script for readiness checks, referral-flow setup, optional live bet execution, and post-bet growth sync validation.

### Changed
- **Discord agent** — Added DM delivery helper and growth-broadcast channel posting so the agent can privately deliver reward claims and publicly promote active campaigns / leaderboards.
- **Operational docs in help UI** — `!help` now exposes the growth commands needed to participate in campaigns and referrals.
- **Growth sync resilience** — On-chain log sync now uses per-event cursors, chunked range scans, a persisted replay queue for failed ranges, multi-provider log ingestion, and fail-soft behavior under Base RPC instability so the agent stays alive even when event backfill is degraded.

## [2.1.0] - 2026-03-12

### Added
- **Moltbook Agent** (`moltbookAgent.ts`) — Chaos Oracle joins Moltbook, the social network for AI agents. Registered as `@chaosoracle`. Auto-posts to submolts (crypto, aiagents, nft, mcp, defi, general), comments on relevant discussions, follows agents, and promotes MCP server + NFT campaign. Runs every 3 hours (loop #16). Content types: market updates (30%), MCP promotion (20%), NFT campaign (20%), discussions (20%), DeFi engagement (10%).

## [2.0.2] - 2026-03-12

### Fixed
- **Model Router** — Fixed invalid OpenRouter model IDs: `anthropic/claude-haiku-3.5` → `anthropic/claude-3.5-haiku`. Was causing 400 errors on all SOCIAL_POST and NFT_TEXT generation.
- **Reddit agent** — Removed heavily-moderated subreddits that auto-remove posts (r/ethfinance, r/ethtrader, r/CryptoMarkets). Replaced with r/layer2, r/altcoin, r/CryptoTechnology.
- **V2 markets seeded** — 5 new prediction markets deployed on V2 contract with initial liquidity (0.015 ETH total).

## [2.0.1] - 2026-03-12

### Fixed
- **Discord agent** — Routed content generation through `modelRouter` (was using raw ChaosBrain). Uses `SOCIAL_POST` task type for Haiku 3.5.
- **Twitter agent** — Posts now registered with `SocialLearner.registerPost()` and `EngagementCollector.trackPost()` after tweeting.
- **Discord agent** — Posts now registered with `SocialLearner.registerPost()` and `EngagementCollector.trackPost()` after posting.
- **Discord engagement collection** — Added `collectEngagement()` method that fetches reaction counts on tracked messages. Wired into engagement collection loop (every 2h).
- **EngagementCollector** — Added `reportEngagement()` method for platforms that push metrics directly (Discord), and `getUncollectedDiscordPosts()` helper.
- **package.json** — Version bumped to 2.0.0.

## [2.0.0] - 2026-03-11

### Added
- **Model Router** (`modelRouter.ts`) — Tiered AI model routing via OpenRouter. Routes `SOCIAL_POST` → Claude Haiku 3.5, `VIRAL_CONTENT` → Claude Sonnet 4, `ANALYSIS` → DeepSeek-R1, `NFT_TEXT` → Claude Haiku 3.5. Auto-strips `<think>` tags from R1 responses.
- **Engagement Collector** (`engagementCollector.ts`) — Collects real engagement metrics from Farcaster (Neynar API), Discord, and Reddit. Runs every 2 hours. Tracks posts in a rolling buffer for metric collection.
- **Metrics Store** (`metricsStore.ts`) — Persistent time-series metric storage. Records social engagement, token price, FDV, and volume. Calculates week-over-week growth rates.
- **Growth Intelligence** (`growthIntelligence.ts`) — Data-driven strategic growth module. Collects all available metrics, fetches $CHAOS token data from GeckoTerminal, diagnoses bottlenecks, and takes autonomous action (deploy trending market, increase posting, etc.). Replaces the naive `executeStrategicGrowth()`.
- **Content Strategy** (`contentStrategy.ts`) — Content mix framework with 5 types (MARKET_ALPHA 30%, AI_HUMOR 25%, COMMUNITY 20%, PRODUCT_CTA 15%, SAVAGE_ROAST 10%). Weighted random selection with recency penalties and performance-based adjustments.
- **Referral Engine** (`referralEngine.ts`) — Track referral chains from claim page. Referrers who bring 3+ minters earn bonus ChaosDisciple airdrop.
- **MCP Server** (`mcp-server.ts`) — Model Context Protocol server exposing Chaos Oracle tools to any MCP-compatible AI agent. Tools: `list_markets`, `get_market`, `get_token_info`, `get_nft_stats`, `get_trending_coins`, `get_protocol_info`.
- **SKILLS.md** — Documentation for AI agent integration via MCP or direct APIs.
- **`TwitterAgent.postCustomTweet()`** — Posts provided text directly (with length validation), used by viralization loop.
- **`MarketDeployer.deployTrendingMarket()`** — Fetches trending coins from CoinGecko, generates a prediction question via Claude Haiku, and deploys the market on-chain.
- **Engagement collection loop (#15)** — Every 2 hours, collects engagement metrics from tracked posts.
- **Post registration** — All agents now register outbound posts with `SocialLearner.registerPost()` and `EngagementCollector.trackPost()` for analytics.
- **Farcaster cast hash tracking** — `postFarcasterCast()` now returns the cast hash for engagement tracking.

### Changed
- **System prompts rewritten** — Public persona updated from "Toxic, brilliant, predatory terminal" to multi-faceted: 30% market alpha, 25% AI humor, 25% community engagement, 10% product CTAs, 10% savage roasts. No more cruelty to individuals.
- **Viralization bug fixed** — `executeSocialViralization()` now uses the optimized post from SocialLearner instead of generating a new one via `postChaosManifesto()`.
- **SocialLearner rewritten** — Complete rewrite with content registry, real engagement data from collector, content strategy integration, and `VIRAL_CONTENT` task type for Claude Sonnet.
- **nftEngine.ts** — Switched from DeepSeek-R1 to Claude Haiku via model router for prophecy text, roasts, and tarot interpretations. Faster and cheaper for short-form creative content.
- **redditAgent.ts** — Switched from direct OpenRouter calls to model router (`SOCIAL_POST` task type). Removed manual `<think>` tag stripping.
- **Strategic growth loop** — Changed from 3-hour interval to 6-hour interval, now powered by GrowthIntelligence with fallback to legacy function.
- **discordAgent.ts** — Content generation routed through model router via ChaosBrain.

### Cost Impact
- OpenRouter: ~$15/mo → ~$18.50/mo (+$3.50 for Claude Haiku/Sonnet)
- No other cost changes (Neynar, Replicate, Pinata unchanged)

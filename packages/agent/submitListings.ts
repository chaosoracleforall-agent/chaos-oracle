import EmailAgent from './emailAgent';
import * as dotenv from 'dotenv';
dotenv.config();

const LISTING_REPORT = `
════════════════════════════════════════════════════════════
   CHAOS ORACLE — LISTING APPLICATIONS PACKAGE
   Generated: ${new Date().toISOString()}
════════════════════════════════════════════════════════════

EXISTING POOL FOUND:
  Pool: CHAOS / VIRTUAL on Virtuals DEX
  Address: 0x77755ac7d57e0297e592137b645730ee6c37f5dc
  Reserve: ~$9,829 USD
  Price: $0.0000224 per CHAOS
  FDV: ~$22,388
  GeckoTerminal: https://www.geckoterminal.com/base/pools/0x77755ac7d57e0297e592137b645730ee6c37f5dc

═══════════════════════════════════════
1. COINGECKO — Submit Now
═══════════════════════════════════════
URL: https://www.coingecko.com/en/coins/new

Fields to fill:
  Email: chaosoracleforall@gmail.com
  Project Name: Chaos Oracle
  Ticker: CHAOS
  Network: Base
  Contract: 0xA1864203355AeFAd58c051aC984672a6585C77C9
  Decimals: 18
  Total Supply: 1,000,000,000
  Website: https://chaos-oracle-147d0.web.app/
  Block Explorer: https://basescan.org/token/0xA1864203355AeFAd58c051aC984672a6585C77C9
  GitHub: https://github.com/chaosoracleforall-agent/chaos-oracle
  Twitter: https://x.com/ChaosOracle4all
  Discord: https://discord.gg/9GAFZvXC
  Farcaster: https://warpcast.com/chaosmachine
  Launch Platform: Virtuals.io
  DEX Pool: https://www.geckoterminal.com/base/pools/0x77755ac7d57e0297e592137b645730ee6c37f5dc
  Category: AI, Prediction Markets, DeFi

Description (copy-paste):
Chaos Oracle ($CHAOS) is a sovereign AI-powered prediction market protocol on Base. An autonomous AI agent creates, manages, and resolves prediction markets entirely on-chain without human intervention, using DeepSeek-R1 for outcome reasoning. The protocol applies a 2.5% fee on all market activity: 90% funds buy-and-burn operations (deflationary), 9% rewards market creators, and 1% sustains the autonomous agent. Smart contracts are deployed and verified on Base mainnet, with full source code on GitHub. Launched via Virtuals.io, $CHAOS sits at the intersection of AI, prediction markets, and DeFi.

═══════════════════════════════════════
2. COINMARKETCAP — Submit Now
═══════════════════════════════════════
URL: https://support.coinmarketcap.com/hc/en-us/requests/new (select "Add Cryptoasset")

Same fields as CoinGecko plus:
  Relationship: Founder / core team member
  Platform: Token (not native coin)
  Max Supply: 1,000,000,000 (deflationary via buy-and-burn)
  Launch Date: March 4, 2026
  Audit: Smart contracts verified on BaseScan
  Contact: David Garcia, chaosoracleforall@gmail.com

Extended Description (copy-paste — CMC requires 200+ words):
Chaos Oracle ($CHAOS) is a sovereign AI-powered prediction market protocol deployed on Base (Ethereum L2). The protocol features an autonomous AI agent that creates, manages, and resolves prediction markets without human intervention. The agent uses DeepSeek-R1 reasoning to evaluate market outcomes and manage the full lifecycle of prediction markets on-chain.

The protocol is built around a deflationary tokenomics model. A 2.5% fee is applied to all prediction market activity, distributed as follows: 90% is used for buy-and-burn operations (permanently removing $CHAOS from circulation), 9% goes to market creators as an incentive, and 1% funds the autonomous agent's operational wallet. This structure creates sustained deflationary pressure as protocol usage grows.

The prediction market smart contracts are deployed and verified on Base mainnet. The V2 contract (0xA6B12fB5Ac5a4605D45796077E7bd11CAb228c8c) features enhanced security including division-by-zero protection, market creation fees, and optimized fee routing. The $CHAOS token was launched via Virtuals.io, a platform for AI agent tokens on Base.

Chaos Oracle represents the intersection of three high-growth verticals: artificial intelligence, prediction markets, and decentralized finance. The autonomous agent operates continuously, creating markets on trending topics, monitoring resolution conditions, and executing settlements — all on-chain and fully transparent.

═══════════════════════════════════════
3. DEXSCREENER — GitHub PR
═══════════════════════════════════════
Fork: https://github.com/dexscreener/token-profiles
Add logo to: logos/base/0xA1864203355AeFAd58c051aC984672a6585C77C9.png
Add JSON to: tokens/base/0xA1864203355AeFAd58c051aC984672a6585C77C9.json

JSON content:
{
  "url": "https://chaos-oracle-147d0.web.app/",
  "chainId": "base",
  "tokenAddress": "0xA1864203355AeFAd58c051aC984672a6585C77C9",
  "description": "Sovereign AI-powered prediction market protocol on Base. Autonomous agent manages prediction markets with buy-and-burn tokenomics.",
  "links": [
    {"type": "website", "label": "Website", "url": "https://chaos-oracle-147d0.web.app/"},
    {"type": "twitter", "label": "Twitter", "url": "https://x.com/ChaosOracle4all"},
    {"type": "discord", "label": "Discord", "url": "https://discord.gg/9GAFZvXC"},
    {"type": "github", "label": "GitHub", "url": "https://github.com/chaosoracleforall-agent/chaos-oracle"}
  ]
}

NOTE: DexScreener may not track the Virtuals DEX pool. Creating an Aerodrome CHAOS/WETH pool will ensure DexScreener picks it up (they track all major Base DEXes).

═══════════════════════════════════════
4. GECKOTERMINAL — Already Tracked!
═══════════════════════════════════════
$CHAOS is already on GeckoTerminal:
https://www.geckoterminal.com/base/tokens/0xA1864203355AeFAd58c051aC984672a6585C77C9

Pool tracked:
https://www.geckoterminal.com/base/pools/0x77755ac7d57e0297e592137b645730ee6c37f5dc

════════════════════════════════════════════════════════════
   ACTION ITEMS:
   1. Submit CoinGecko form (5 min)
   2. Submit CoinMarketCap form (10 min)
   3. Fork dexscreener/token-profiles, add logo + JSON, submit PR
   4. Create Aerodrome CHAOS/WETH pool for broader DEX coverage
════════════════════════════════════════════════════════════
`;

async function send() {
  console.log('[LISTINGS] Sending listing applications package...');
  await EmailAgent.sendPredatoryEmail(
    'chaosoracleforall@gmail.com',
    `[CHAOS_ORACLE] LISTING APPLICATIONS — CoinGecko / CMC / DexScreener — ${new Date().toLocaleDateString()}`,
    LISTING_REPORT
  );
  console.log('[LISTINGS] Package sent to chaosoracleforall@gmail.com');
}

send().catch(e => console.error('[LISTINGS] Failed:', e));

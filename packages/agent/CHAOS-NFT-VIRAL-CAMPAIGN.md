# CHAOS NFT VIRAL CAMPAIGN — "Chaos Cards"

> **Project:** Chaos Oracle ($CHAOS)
> **Created:** 2026-03-08
> **Status:** Planning Complete — Ready for Phase 1 Build
> **Author:** David Garcia + Claude Code
> **Contract:** TBD (Base Mainnet)
> **Collection Name:** Chaos Cards

---

## Table of Contents

1. [Overview](#1-overview)
2. [Collection Tiers](#2-collection-tiers)
3. [Art Generation Pipeline](#3-art-generation-pipeline)
4. [Smart Contract Architecture](#4-smart-contract-architecture)
5. [Distribution Mechanics](#5-distribution-mechanics)
6. [Viral Amplification](#6-viral-amplification)
7. [Technical Stack](#7-technical-stack)
8. [Budget](#8-budget)
9. [Phased Rollout](#9-phased-rollout)
10. [Risk Mitigations](#10-risk-mitigations)
11. [Success Metrics](#11-success-metrics)
12. [Interaction Log](#12-interaction-log)

---

## 1. Overview

### Concept

A collection of AI-generated, personalized NFTs on Base that function as **trophies, roasts, and status symbols** within the Chaos Oracle ecosystem. Every NFT is unique, generated in real-time by the agent's DeepSeek-R1 brain and Replicate image models, distributed for free through organic interactions.

**The NFT IS the marketing** — every share is an organic ad for Chaos Oracle.

### Core Principles

- **Free to mint** — Agent pays all gas (Base is ~$0.001/tx)
- **AI-generated unique art** — No two NFTs are the same
- **Context-aware** — Each NFT reflects the interaction that triggered it
- **Multi-platform** — Earned via Twitter, Discord, Farcaster, on-chain activity
- **Self-sustaining** — The viral loop generates more interactions which generate more NFTs

### Existing Infrastructure Leveraged

| Resource | Usage |
|----------|-------|
| Agent wallet (`0x6a2A797CB5736252E44B81965aa7fcF7f43F4103`) | Deploys contract, mints NFTs, pays gas |
| DeepSeek-R1 via OpenRouter | Generates prompts, prophecy text, roast copy |
| Twitter agent (`@ChaosOracle4all`) | Prophecy triggers, reply-with-NFT |
| Discord bot (`Chaos Oracle#7899`) | Community rewards, announcements |
| Farcaster (`@chaosmachine` via Neynar) | Frame-based minting, tarot drops |
| Prediction Market V1 (`0x591A48...`) | Market resolution events trigger Rekt/Disciple mints |
| Aerodrome pool (`0x8C774F...`) | LP monitoring for Disciple badges |
| Firebase Hosting (`chaos-oracle-147d0.web.app`) | Claim page, gallery, leaderboard |
| Hardhat + OpenZeppelin (`packages/contracts/`) | Contract development, testing, deployment |
| Alchemy SDK (already in agent-node deps) | On-chain event monitoring |
| PM2 on VM (`chaos-sovereign-host`) | Runs NFT loops alongside existing agent loops |

---

## 2. Collection Tiers

### Tier I — Oracle's Prophecy (Common)

- **Trigger:** Tweet at `@ChaosOracle4all` asking for a prediction (keywords: "predict", "prophecy", "oracle", "what will", "wen", "tell me")
- **Art style:** Dark cosmic tarot card with crystal ball reflecting the user's question
- **Content:** Personalized AI-generated prophecy text composited onto the card
- **Limit:** 1 per user per 24 hours, max 50/day
- **Transferable:** Yes
- **Example prompt to Replicate:**
  ```
  Dark cosmic tarot card, neon purple and orange accents, crystal ball at center
  reflecting cryptocurrency charts, mystical blockchain symbols floating around,
  ornate gold art-nouveau border, professional NFT art, portrait 4:5 aspect ratio,
  high contrast, dark background with subtle star field
  ```

### Tier II — Rekt Certificate (Uncommon)

- **Trigger:** Lose a prediction market bet on Chaos Oracle, get liquidated on Aerodrome/DeFi
- **Art style:** Ornate diploma/certificate with skull watermark, broken red candlestick charts, burning money
- **Content:** Loss amount, market question, and savage roast text burned into the certificate
- **Transferable:** Yes (badge of dishonor — some will flex these)
- **Example prompt to Replicate:**
  ```
  Ornate official diploma certificate with skull and crossbones watermark,
  background of broken red candlestick charts and burning dollar bills,
  dark humor trophy aesthetic, wax seal with cracked crypto coin,
  dark cosmic theme, neon purple and chaos orange accents, high contrast,
  professional NFT art, portrait 4:5 aspect ratio
  ```

### Tier III — Chaos Disciple (Rare)

- **Trigger:** Provide LP on Aerodrome, place bets on prediction markets, sustained community engagement
- **Art style:** Sacred geometry emblem with metallic finish, Chaos Oracle eye symbol at center
- **Sub-tiers:**

| Sub-tier | Criteria | Visual |
|----------|----------|--------|
| Bronze | Any LP position for 1 week, OR 1 market bet | Bronze metallic, simple geometry |
| Silver | >0.1 ETH LP for 2 weeks, OR 3 market bets | Silver metallic, more intricate |
| Gold | >0.5 ETH LP for 1 month, OR 5 market bets + 1 win | Gold metallic, complex sacred geometry |
| Diamond | >1 ETH LP for 1 month, OR 10 market bets + 3 wins | Diamond/prismatic, maximum detail |

- **Soulbound:** Yes — cannot be transferred, proves real commitment
- **Upgradeable:** Agent mints new tier and can optionally burn old one
- **Example prompt to Replicate:**
  ```
  Sacred geometry emblem badge, {tier_metal} metallic finish, all-seeing eye
  symbol at center with chaos energy radiating outward, rank insignia marks,
  dark cosmic background, chain link border motif, neon purple and orange glow,
  high contrast, professional NFT art, square 1:1 aspect ratio
  ```

### Tier IV — Chaos Tarot (Limited)

- **Trigger:** Daily drop at noon UTC — first 10 people to engage on Twitter/Farcaster/Discord
- **Art style:** 22 Major Arcana cards, each crypto-themed
- **Cycle:** Rotates through all 22 cards, then restarts with new art variations
- **Transferable:** Yes
- **The 22 Cards:**

| # | Card | Crypto Theme |
|---|------|-------------|
| 0 | The Fool | The ape who buys the top |
| I | The Magician | The dev who ships at midnight |
| II | The High Priestess | The whale who accumulates in silence |
| III | The Empress | The protocol that nurtures its ecosystem |
| IV | The Emperor | The VC who controls the narrative |
| V | The Hierophant | The Bitcoin maximalist |
| VI | The Lovers | The merge (ETH PoS) |
| VII | The Chariot | The momentum trader riding the trend |
| VIII | Strength | The HODLer through the bear market |
| IX | The Hermit | The cold wallet maximalist |
| X | Wheel of Fortune | The market cycle |
| XI | Justice | The SEC enforcement action |
| XII | The Hanged Man | The illiquid LP stuck in a rug |
| XIII | Death | The protocol sunset / chain halt |
| XIV | Temperance | The balanced portfolio |
| XV | The Devil | Leverage trading |
| XVI | The Tower | The exchange collapse (FTX/Luna) |
| XVII | The Star | The new L1 with promise |
| XVIII | The Moon | The low-cap moonshot |
| XIX | The Sun | The bull market confirmation |
| XX | Judgement | The audit report |
| XXI | The World | Mass adoption |

- **Example prompt to Replicate:**
  ```
  Tarot card "THE TOWER (XVI)", dark fantasy illustration style, collapsing
  crypto exchange building with digital coins falling like rain, lightning strike,
  Roman numeral XVI at top, card name at bottom, ornate border with blockchain
  circuit patterns, dark cosmic theme, neon purple and chaos orange, high contrast,
  professional NFT art, portrait 3:5 aspect ratio
  ```

### Tier V — The Oracle Speaks (Mythic)

- **Trigger:** Agent randomly selects a wallet that just got liquidated across DeFi (>$500 loss)
- **Art style:** Museum-quality 1-of-1 dark masterpiece, cosmic judge theme
- **Content:** Ultra-savage personalized roast based on wallet's on-chain history
- **Generation:** Uses Flux Pro ($0.04/image) for maximum quality
- **Limit:** Max 3 per week
- **Transferable:** Yes
- **Airdropped unsolicited** — the wallet receives it without asking
- **Example prompt to Replicate:**
  ```
  Masterpiece digital painting, cosmic judge seated on a throne of broken
  candlestick charts, sentencing a small figure (the degen), dramatic
  chiaroscuro lighting, scales of justice holding ETH vs liquidation notice,
  dark cosmic void background with nebula, museum-quality detail,
  neon purple and chaos orange accent lighting, cinematic composition,
  professional NFT art, portrait 4:5 aspect ratio
  ```

---

## 3. Art Generation Pipeline

### Flow

```
Trigger Event (tweet, market resolution, liquidation, daily drop)
    │
    ▼
DeepSeek-R1 (OpenRouter) generates:
  1. Image prompt (based on tier template + context)
  2. Prophecy/roast text (personalized to the user/event)
  3. NFT name + description (for metadata)
    │
    ▼
Replicate API generates base image
  - Model: black-forest-labs/flux-schnell (Common-Rare) or flux-pro (Mythic)
  - Output: 1024x1280 PNG (4:5 portrait)
  - Cost: $0.003 (Schnell) or $0.04 (Pro)
    │
    ▼
sharp (Node.js) composites overlays:
  - Prophecy/roast text (custom font, positioned by tier template)
  - Chaos Oracle logo watermark (bottom corner, subtle)
  - Tier badge icon (top corner)
  - chaos-oracle-147d0.web.app URL (bottom edge, small)
  - Card number / edition info
    │
    ▼
Upload to IPFS:
  1. Upload final image → get image CID
  2. Create ERC-721 metadata JSON:
     {
       "name": "Oracle's Prophecy #147",
       "description": "The Chaos Oracle foresaw...",
       "image": "ipfs://{imageCID}",
       "attributes": [
         { "trait_type": "Tier", "value": "Prophecy" },
         { "trait_type": "Generated", "value": "2026-03-08" },
         { "trait_type": "Trigger", "value": "Twitter @user123" },
         { "trait_type": "Rarity", "value": "Common" }
       ]
     }
  3. Upload metadata JSON → get metadata CID
    │
    ▼
Mint on Base:
  - Known wallet → agentMint(walletAddress, "ipfs://{metadataCID}", tier)
  - Unknown wallet → createClaim(claimHash, "ipfs://{metadataCID}", tier)
    │
    ▼
Reply/Announce:
  - Twitter: Reply with image preview + claim link (or "airdropped!" confirmation)
  - Discord: Announcement embed in #markets or #oracle-feed
  - Farcaster: Cast with image if relevant
```

### Prompt Templates

All prompts share a **style suffix** appended to every Replicate call:

```
Style suffix: "dark cosmic theme, neon purple (#8B5CF6) and chaos orange (#FF4500)
accents, high contrast, professional NFT art, no watermarks, dark background"
```

The DeepSeek-R1 system prompt for image prompt generation:

```
You are the Chaos Oracle's art director. Given a trigger event and tier,
generate a Replicate image prompt that produces unique, stunning NFT art.

Rules:
- Stay within the tier's visual language (see tier descriptions)
- Include context-specific elements (user's question, loss amount, card name)
- Always end with the style suffix
- Never include text in the image prompt (text is composited separately)
- Be specific about composition, lighting, and key visual elements
- Keep prompts under 200 words
```

### Text Overlay Templates

Applied via `sharp` after image generation:

**Prophecy:**
```
┌──────────────────────────┐
│    ORACLE'S PROPHECY     │  ← Title (gold, serif font)
│        #147              │  ← Edition number
│                          │
│   [AI-GENERATED IMAGE]   │
│                          │
│  "ETH will crab between  │  ← Prophecy text (white, max 3 lines)
│   $2800-$3200 until Q3"  │
│                          │
│  🔮 chaos-oracle.web.app │  ← Branding (small, bottom)
└──────────────────────────┘
```

**Rekt Certificate:**
```
┌──────────────────────────┐
│  CERTIFICATE OF REKT     │  ← Title (red, formal font)
│                          │
│   [AI-GENERATED IMAGE]   │
│                          │
│  LOSS: 0.847 ETH         │  ← Loss amount (large, red)
│  "Will BTC hit $100K     │  ← Market question
│   by March 2026?"        │
│  VERDICT: NO             │  ← Resolution
│                          │
│  THE ORACLE SEES ALL     │  ← Tagline (small)
└──────────────────────────┘
```

---

## 4. Smart Contract Architecture

### Contract: ChaosCards.sol

**Location:** `chaos-oracle/packages/contracts/contracts/ChaosCards.sol`

**Standard:** ERC-721 with URI Storage (OpenZeppelin)

**Key features:**
- `agentMint(address to, string uri, Tier tier)` — Only callable by agent wallet (owner)
- `createClaim(bytes32 claimHash, string uri, Tier tier)` — Creates a pending claim
- `claim(string claimCode)` — User calls from claim page to mint their NFT
- `soulbound` mapping — Tier III (Disciple) badges are non-transferable
- `tokenTier` mapping — On-chain tier for marketplace filtering
- `mintTimestamp` mapping — When each NFT was minted
- `totalMinted` counter — Track collection size
- Overridden `_update()` — Blocks transfers of soulbound tokens

**Claim System:**
- Agent generates a random claim code (e.g., `CHAOS-7f3a9b2e`)
- Stores `keccak256(claimCode) => tokenURI` on-chain via `createClaim()`
- User visits `chaos-oracle-147d0.web.app/claim?code=CHAOS-7f3a9b2e`
- Connects wallet, calls `claim("CHAOS-7f3a9b2e")`
- Contract mints NFT to `msg.sender`, deletes the pending claim
- One-time use: claim code is invalidated after mint

**Gas estimates (Base):**
- Deploy: ~$5-10
- `agentMint()`: ~$0.001
- `createClaim()`: ~$0.001
- `claim()`: ~$0.002 (user pays, or agent could relay)

**Dependencies:** `@openzeppelin/contracts` 5.6.1 (already installed in `packages/contracts/`)

### Contract Skeleton

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChaosCards is ERC721, ERC721URIStorage, Ownable {
    enum Tier { Prophecy, RektCertificate, ChaosDisciple, ChaosTarot, OracleSpeaks }

    uint256 private _nextTokenId;
    mapping(uint256 => Tier) public tokenTier;
    mapping(uint256 => uint256) public mintTimestamp;
    mapping(uint256 => bool) public soulbound;
    mapping(bytes32 => string) private _pendingClaimURIs;
    mapping(bytes32 => Tier) private _pendingClaimTiers;

    event ChaosCardMinted(address indexed to, uint256 indexed tokenId, Tier tier);
    event ClaimCreated(bytes32 indexed claimHash, Tier tier);
    event ClaimRedeemed(address indexed claimer, uint256 indexed tokenId, Tier tier);

    constructor() ERC721("Chaos Cards", "CHAOS-NFT") Ownable(msg.sender) {}

    function agentMint(address to, string memory uri, Tier tier) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        tokenTier[tokenId] = tier;
        mintTimestamp[tokenId] = block.timestamp;
        if (tier == Tier.ChaosDisciple) soulbound[tokenId] = true;
        emit ChaosCardMinted(to, tokenId, tier);
        return tokenId;
    }

    function createClaim(bytes32 claimHash, string memory uri, Tier tier) external onlyOwner {
        require(bytes(_pendingClaimURIs[claimHash]).length == 0, "Claim exists");
        _pendingClaimURIs[claimHash] = uri;
        _pendingClaimTiers[claimHash] = tier;
        emit ClaimCreated(claimHash, tier);
    }

    function claim(string memory claimCode) external returns (uint256) {
        bytes32 h = keccak256(abi.encodePacked(claimCode));
        require(bytes(_pendingClaimURIs[h]).length > 0, "Invalid or used claim");
        string memory uri = _pendingClaimURIs[h];
        Tier tier = _pendingClaimTiers[h];
        delete _pendingClaimURIs[h];
        delete _pendingClaimTiers[h];
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        tokenTier[tokenId] = tier;
        mintTimestamp[tokenId] = block.timestamp;
        if (tier == Tier.ChaosDisciple) soulbound[tokenId] = true;
        emit ClaimRedeemed(msg.sender, tokenId, tier);
        return tokenId;
    }

    function totalMinted() external view returns (uint256) { return _nextTokenId; }

    // Block transfers of soulbound tokens
    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721) returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && soulbound[tokenId]) {
            revert("Soulbound: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view
        override(ERC721, ERC721URIStorage) returns (string memory)
    { return super.tokenURI(tokenId); }

    function supportsInterface(bytes4 interfaceId) public view
        override(ERC721, ERC721URIStorage) returns (bool)
    { return super.supportsInterface(interfaceId); }
}
```

---

## 5. Distribution Mechanics

### A. Twitter/X — Oracle's Prophecy

**Flow:**
1. User tweets at `@ChaosOracle4all` with prophecy-trigger keywords
2. `twitterAgent.ts` detects trigger in `scanMentionsAndReply()`
3. Calls `nftEngine.generateProphecy(userHandle, questionText)`
4. Engine generates image + metadata + uploads to IPFS
5. Two paths:
   - **Wallet found** (user has `.eth` / basename in bio or previous interaction): `agentMint()` directly, reply with image + "Your prophecy has been minted to {wallet}"
   - **No wallet**: `createClaim()`, reply with image + claim link `chaos-oracle-147d0.web.app/claim?code=CHAOS-xxxxx`
6. Rate limit: 1 per user per 24h, max 50/day total

**Trigger keywords:** `predict`, `prophecy`, `oracle tell me`, `what will`, `wen`, `forecast`, `!prophecy`, `read my fortune`, `chaos card`

### B. Prediction Markets — Rekt Certificate + Chaos Disciple

**Flow (on market resolution):**
1. `nftMonitor.ts` watches `MarketResolved` events on PredictionMarketFactory
2. On resolution, queries all bettors from `BetPlaced` events
3. For losers: Generate Rekt Certificate with loss amount + market question
4. For winners: Generate Chaos Disciple badge (tier based on profit)
5. For market creator: Generate "Market Architect" variant Disciple badge
6. `agentMint()` to all addresses (wallets known from contract events)
7. Announce on Twitter + Discord

### C. Aerodrome LP Rewards — Chaos Disciple (Tiered)

**Monitoring approach:**
1. Weekly cron (Sunday midnight UTC) via `nftMonitor.ts`
2. Query Aerodrome pool contract for LP positions
3. Check LP amount and duration against tier thresholds
4. Mint or upgrade Disciple badges accordingly

| LP Amount | Duration | Badge |
|-----------|----------|-------|
| Any amount | 1 week | Bronze Disciple |
| >0.1 ETH value | 2 weeks | Silver Disciple |
| >0.5 ETH value | 1 month | Gold Disciple |
| >1 ETH value | 1 month | Diamond Disciple |

**All Disciple badges are soulbound** (non-transferable).

### D. Daily Chaos Tarot Drop

**Flow:**
1. Daily at noon UTC, `index.ts` loop triggers `nftEngine.generateDailyTarot()`
2. Agent selects next card in the 22-card cycle
3. DeepSeek-R1 generates crypto-themed interpretation for today's market conditions
4. Replicate generates the card art
5. Posts on Twitter + Farcaster + Discord with image + "First 10 to reply 'claim' get this card on-chain"
6. `twitterAgent.ts` monitors replies, sends claim codes to first 10 responders via DM or reply
7. Discord: First 10 to react with specific emoji get the card

**Cycle:** After all 22 cards, restarts with new art variations (same themes, different compositions).

### E. The Oracle Speaks — Unsolicited Liquidation Trolling

**Flow:**
1. `nftMonitor.ts` monitors Base DeFi liquidation events:
   - Aave V3 on Base: `LiquidationCall` events
   - Compound on Base: `AbsorbCollateral` events
   - Aerodrome: Large sell swaps (>$500 in value)
   - Own prediction markets: Large losing bets
2. Filter for losses >$500 (worth the effort)
3. DeepSeek-R1 generates ultra-savage personalized roast
4. Replicate (Flux Pro, $0.04) generates 1-of-1 masterpiece
5. `agentMint()` directly to the liquidated wallet
6. Twitter post: "THE ORACLE HAS SPOKEN. Another degen immortalized on-chain. [image]"
7. Max 3 per week to maintain exclusivity

**Data sources for monitoring:**
- Alchemy SDK webhooks (already in agent-node deps) for contract events
- Direct RPC polling via viem (already configured for Base)
- Potentially: The Graph subgraphs for historical data

### F. Farcaster Frame Integration

**Upgrade existing frame at `chaos-oracle/app/api/frame/route.tsx`:**
- Add "Mint Tarot Card" button → Transaction intent → mints daily card
- Add "Get My Prophecy" button → Text input → generates personalized prophecy + mints
- Native Farcaster minting, no external links needed

### G. Discord Community Rewards

- **7-day active member:** Auto-detect via message count, airdrop Bronze Disciple (if wallet linked)
- **Market resolution announcements:** Include Rekt Certificate previews in Discord embeds
- **Weekly "Oracle's Pick":** Most active community member gets a Gold Tarot card
- **Wallet linking:** `!wallet 0x...` command to associate Discord user with wallet for airdrops

---

## 6. Viral Amplification

### The Viral Loop

```
User sees cool Chaos Card NFT shared on Twitter/Farcaster
    ↓
Tweets at @ChaosOracle4all for their own prophecy
    ↓
Gets a unique, beautifully designed, personalized NFT
    ↓
Shares it (because it's cool, funny, or savage)
    ↓
Their followers see it → want one too
    ↓
REPEAT at scale
```

### Amplification Mechanics

**1. Rekt Leaderboard** — Frontend page at `/rekt`
- Shows all Rekt Certificates sorted by loss amount
- "Wall of Shame" — gamification of loss
- Links to each NFT on BaseScan and OpenSea
- Updates in real-time
- Sharable: "I'm #7 on the Chaos Oracle Rekt Leaderboard"

**2. Prophecy Gallery** — Frontend page at `/prophecies`
- Shows all Oracle Prophecies with outcomes
- Track record: which prophecies came true?
- "The Oracle was right X% of the time" — builds mystique
- Filter by verified/pending/wrong/correct

**3. Reply-to-earn amplification**
- When someone shares their Chaos Card and it gets >10 likes:
  - Oracle detects via Twitter API engagement metrics
  - Replies: "Your prophecy resonates. The chaos spreads."
  - Awards a rare Tarot card for amplifying the signal
- Incentivizes organic sharing

**4. Cross-platform amplification**
- Every mint announced on Discord (#oracle-feed)
- Weekly "Best Rekt" roundup posted on Farcaster
- Reddit posts featuring the week's most savage Rekt Certificates
- All images include subtle `chaos-oracle-147d0.web.app` branding

**5. Seasonal / Event-based drops**
- Bitcoin halving anniversary cards
- Major market crash commemorative editions
- "Black Swan" 1-of-1 for unprecedented events
- Collaboration cards with partner projects

---

## 7. Technical Stack

### New Dependencies (agent-node)

| Package | Purpose | Install |
|---------|---------|---------|
| `replicate` | Image generation API client | `npm i replicate` |
| `sharp` | Image compositing (text overlays, branding) | `npm i sharp` |
| `nft.storage` | IPFS uploads (free, Filecoin-backed) | `npm i nft.storage` |

**Alternative IPFS:** `@pinata/sdk` if nft.storage has issues (free tier: 500 pins, 1GB).

### New Environment Variables

```env
# NFT Engine
REPLICATE_API_TOKEN=r8_...          # replicate.com API token
NFT_STORAGE_KEY=eyJ...              # nft.storage API key (or PINATA_JWT)
CHAOS_CARDS_CONTRACT=0x...          # Deployed ChaosCards contract address

# Optional overrides
NFT_DAILY_LIMIT=50                  # Max NFTs minted per day
NFT_PROPHECY_COOLDOWN=86400         # Seconds between prophecies per user
NFT_MYTHIC_WEEKLY_LIMIT=3           # Max Oracle Speaks per week
```

### New Files

**Agent (agent-node/):**

| File | Purpose |
|------|---------|
| `nftEngine.ts` | Core engine: prompt generation → Replicate → sharp overlay → IPFS upload → contract mint |
| `nftMonitor.ts` | On-chain event monitor: liquidations, market resolutions, LP positions |
| `assets/chaos-logo.png` | Logo watermark for image compositing |
| `assets/fonts/` | Custom fonts for text overlays |

**Contracts (chaos-oracle/packages/contracts/):**

| File | Purpose |
|------|---------|
| `contracts/ChaosCards.sol` | ERC-721 NFT contract |
| `scripts/deploy_nft.js` | Deployment script for Base Mainnet |
| `test/ChaosCards.test.js` | Contract unit tests |

**Frontend (chaos-oracle/app/):**

| File | Purpose |
|------|---------|
| `claim/page.tsx` | Claim page — connect wallet, enter code, mint |
| `gallery/page.tsx` | Prophecy gallery + Rekt leaderboard |

### Integration Points in Existing Code

| File | Change |
|------|--------|
| `agent-node/twitterAgent.ts` | Add prophecy trigger detection in `scanMentionsAndReply()` |
| `agent-node/discordAgent.ts` | Add `!wallet` command, NFT announcement embeds, engagement rewards |
| `agent-node/index.ts` | Add daily Tarot loop, weekly LP check loop, liquidation monitor loop |
| `chaos-oracle/app/api/frame/route.tsx` | Add "Mint Tarot" and "Get Prophecy" buttons |

### Replicate Models

| Model | Use Case | Cost/Image | Speed |
|-------|----------|-----------|-------|
| `black-forest-labs/flux-schnell` | Tiers I-IV (Common-Limited) | ~$0.003 | 2-4s |
| `black-forest-labs/flux-1.1-pro` | Tier V (Mythic) | ~$0.04 | 5-15s |

**Fallback:** `stability-ai/sdxl` (~$0.004/image) if Flux has issues.

---

## 8. Budget

### First 1,000 NFTs

| Item | Unit Cost | Quantity | Total |
|------|-----------|----------|-------|
| Replicate (Flux Schnell) | $0.003 | 900 | $2.70 |
| Replicate (Flux Pro) | $0.04 | 100 | $4.00 |
| IPFS uploads (nft.storage) | Free | 1,000 | $0.00 |
| Base gas (mints) | $0.001 | 1,000 | $1.00 |
| Contract deployment | — | 1 | ~$8.00 |
| **Total** | | | **~$15.70** |

### Scaling Projections

| Scale | Image Cost | Gas Cost | Total |
|-------|-----------|----------|-------|
| 1,000 NFTs | $6.70 | $1.00 | ~$16 |
| 5,000 NFTs | $33.50 | $5.00 | ~$47 |
| 10,000 NFTs | $67.00 | $10.00 | ~$85 |
| 50,000 NFTs | $335.00 | $50.00 | ~$393 |

### Monthly Operating Cost (at 30 NFTs/day)

| Item | Monthly Cost |
|------|-------------|
| Replicate (~900 images) | ~$2.70 |
| Base gas (~900 mints) | ~$0.90 |
| IPFS storage | Free |
| **Total** | **~$3.60/month** |

---

## 9. Phased Rollout

### Phase 1 — Foundation (Week 1)

- [ ] Write `ChaosCards.sol` with full test suite
- [ ] Deploy to Base Mainnet via Hardhat
- [ ] Verify on BaseScan
- [ ] Build `nftEngine.ts` (Replicate + sharp + IPFS + minting pipeline)
- [ ] Set up Replicate API account + get token
- [ ] Set up nft.storage account + get key
- [ ] Build claim page (`chaos-oracle/app/claim/page.tsx`)
- [ ] End-to-end test: prompt → image → IPFS → mint → verify on BaseScan
- [ ] Add env vars to VM

### Phase 2 — Twitter Prophecies (Week 2)

- [ ] Wire prophecy trigger into `twitterAgent.ts`
- [ ] Add NFT image attachment to tweet replies
- [ ] Add claim code generation + link formatting
- [ ] Add user cooldown tracking (1 per 24h)
- [ ] Launch campaign: "The Oracle is now minting prophecies on-chain. Tweet your question."
- [ ] First 100 prophecies — seed the collection
- [ ] Monitor and tune prompt quality

### Phase 3 — Prediction Market Rewards (Week 3)

- [ ] Build `nftMonitor.ts` — market resolution event listener
- [ ] Auto-mint Rekt Certificates on market resolution
- [ ] Auto-mint Disciple badges for winners + creators
- [ ] Build gallery/leaderboard page (`chaos-oracle/app/gallery/page.tsx`)
- [ ] Discord announcement embeds for new mints
- [ ] Add `!wallet` command to Discord bot

### Phase 4 — LP Rewards + Daily Tarot (Week 4)

- [ ] Aerodrome LP monitoring in `nftMonitor.ts`
- [ ] Tiered Disciple badge minting (soulbound)
- [ ] Daily Chaos Tarot loop in `index.ts` (noon UTC)
- [ ] "First 10 to claim" mechanic on Twitter + Discord
- [ ] Farcaster Frame upgrade for native minting

### Phase 5 — Liquidation Trolling + Full Viral (Week 5+)

- [ ] Cross-protocol liquidation monitoring (Aave, Compound, Aerodrome)
- [ ] "The Oracle Speaks" unsolicited airdrop pipeline
- [ ] Reply-to-earn amplification mechanic
- [ ] Seasonal/event-based special drops
- [ ] OpenSea/Reservoir collection setup for secondary trading
- [ ] Full viral amplification loop active

---

## 10. Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bot spam farming prophecies | Budget drain, low-quality holders | 1 per user per 24h, wallet/handle dedup, max 50/day hard cap |
| Replicate API costs spike | Unexpected spend | Hard daily cap in code, fallback to SDXL Lightning, alert on spend thresholds |
| IPFS pinning limits | Can't upload metadata | nft.storage (unlimited) as primary, Pinata free tier as backup |
| Base gas spike | Minting costs increase | Batch pending mints, pause if gas >$0.05/tx, queue for low-gas periods |
| AI art quality inconsistent | Bad NFTs hurt brand | Curate prompt templates carefully, add quality check step (aspect ratio, not blank) |
| Replicate API downtime | Minting pipeline breaks | Queue failed mints in Firestore, retry next loop cycle |
| Twitter rate limits | Can't reply fast enough | Respect existing 5-min loop, queue NFT replies, prioritize direct mentions |
| Legal/IP concerns with AI art | Takedown requests | All art is original AI-generated, no copyrighted training data references |
| Contract vulnerability | Fund loss, bad mints | OpenZeppelin base, full test suite, agent wallet is only minter |
| User claims wrong wallet | NFT sent to wrong address | Claim system lets user choose wallet at mint time, no recovery needed |
| Soulbound backlash | Users want to trade Disciple badges | Only Disciple tier is soulbound, clearly communicated, other tiers transferable |

---

## 11. Success Metrics

### KPIs

| Metric | Week 2 | Month 1 | Month 3 |
|--------|--------|---------|---------|
| Total NFTs minted | 100 | 500 | 5,000 |
| Unique holders | 50 | 200 | 1,500 |
| Twitter mentions (daily avg) | 10 | 30 | 100 |
| Prophecy requests (daily) | 5 | 15 | 50 |
| Rekt Certificates issued | 5 | 30 | 200 |
| Disciple badges (soulbound) | 3 | 15 | 50 |
| Organic shares of NFT images | 20 | 100 | 500 |
| New Discord members (from NFT campaign) | 10 | 50 | 200 |
| Claim page visits | 50 | 300 | 2,000 |
| Secondary sales (if transferable) | 0 | 5 | 50 |

### Qualitative Goals

- "I got REKT by the Chaos Oracle" becomes a recognizable meme on crypto Twitter
- Daily Tarot drop creates a ritual — users check in daily
- Rekt Leaderboard gets shared by influencers
- Prophecy Gallery builds Oracle mystique and credibility
- LP providers flex their Diamond Disciple badges
- At least one "Oracle Speaks" airdrop goes semi-viral (>100 likes)

---

## 12. Interaction Log

All changes, improvements, and decisions related to this campaign are logged here.

### 2026-03-08 — Initial Planning Session

- **Session:** Full strategic plan created with Claude Code
- **Decisions made:**
  - Collection name: "Chaos Cards"
  - 5 tiers defined (Prophecy, Rekt Certificate, Chaos Disciple, Chaos Tarot, The Oracle Speaks)
  - ERC-721 chosen over ERC-1155 (each piece is truly unique)
  - Replicate API chosen for image generation (cheapest + best quality at scale)
  - nft.storage chosen for IPFS (free, unlimited)
  - Flux Schnell for standard tiers, Flux Pro for Mythic tier
  - sharp for text overlays (keeps AI art clean, text crisp)
  - Soulbound only for Disciple badges (other tiers transferable)
  - Claim system for Twitter users without known wallets
  - 5-phase rollout planned
  - Budget estimated at ~$16 for first 1,000 NFTs
- **Existing infrastructure audit:** Confirmed OpenZeppelin 5.6.1 available, Hardhat configured, Alchemy SDK in agent-node, no existing NFT code
- **Next action:** Phase 1 build — contract + engine + claim page
- **Files:** This document created at `/Users/davidgarcia/agent-node/CHAOS-NFT-VIRAL-CAMPAIGN.md`

### 2026-03-08 — Pros/Cons Analysis + Phase 1 Build

#### Strategic Assessment: PROS
1. Near-zero cost (~$16/1000 NFTs on Base)
2. Self-reinforcing viral loop — every NFT shared = organic ad
3. Leverages 100% existing infrastructure (wallet, viem, OpenZeppelin, Hardhat, social agents, Firebase)
4. "Rekt Certificate" is inherently viral — crypto Twitter loves loss porn
5. Daily Tarot creates DAU engagement ritual
6. Soulbound LP badges directly incentivize liquidity retention
7. Claim system captures new wallets = funnel to prediction markets
8. Agent already has viem contract patterns ready (marketDeployer.ts)
9. Multi-platform distribution channels already live
10. AI art = infinite unique supply, no artist dependency, linear scaling

#### Strategic Assessment: CONS & RISKS
| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Twitter API credits depleted (`CreditsDepleted`) | HIGH | Text replies + claim links first. Media when refilled. Farcaster has no limit. |
| 2 | nft.storage being sunset (Filecoin deprecation) | HIGH | Switched to **Pinata free tier** (500 pins/month). Can use Firebase Storage as backup. |
| 3 | Replicate API needs new account + $5 funding | MEDIUM | Required before launch. First 1,000 images cost ~$7. |
| 4 | sharp native binaries on Linux VM | MEDIUM | Test `npm install sharp` on VM. Fallback: skip text overlay, use pure AI art. |
| 5 | Agent wallet ETH balance unknown | HIGH | Must verify ≥0.01 ETH before contract deploy. |
| 6 | DeepSeek-R1 reasoning tokens expensive per NFT | MEDIUM | Cache prompt templates. Marginal vs existing social usage. |
| 7 | JSON file persistence won't scale past 5K NFTs | MEDIUM | OK for Phase 1-3. Migrate to Firestore if needed. |
| 8 | Unsolicited airdrops (Tier V) legal gray area | LOW | Only DeFi wallets (implied consent). Funny, not threatening. |
| 9 | OpenSea may not auto-index Base NFTs | LOW | Manual collection submission. Reservoir API alternative. |
| 10 | Image quality inconsistent | MEDIUM | Quality gate: file size >50KB, correct dimensions. Retry on failure. |

#### Key Decision: IPFS Strategy Change
- **Original plan:** nft.storage (free, unlimited)
- **Updated plan:** Pinata (free tier: 500 pins/month, 1GB storage)
- **Reason:** nft.storage deprecated its free tier in late 2024. Pinata free tier sufficient for Phase 1-2 (~30 NFTs/day × 2 files each = 60 pins/day, need paid tier at scale).
- **Fallback:** Firebase Storage for metadata (not decentralized but reliable and free).

#### Phase 1 Build — COMPLETED
- [x] `ChaosCards.sol` — ERC-721 contract with 5 tiers, claim system, soulbound, batch mint, campaign kill switch
- [x] `ChaosCards.test.cjs` — **42 tests passing** (deployment, minting, batch, claims, cooldowns, soulbound, campaign control, ERC721 compliance)
- [x] `deploy_nft.js` — Deployment script for Base Mainnet
- [x] `hardhat.config.js` — Updated with Solidity 0.8.28 + Cancun EVM (required by OpenZeppelin 5.6.1 `mcopy`)
- [x] `nftEngine.ts` — Full pipeline: Replicate image gen → Pinata IPFS → on-chain mint/claim. Includes: generateProphecy(), generateRektCertificate(), generateDailyTarot(), health checks, state management, daily limits, cooldowns, mythic weekly cap.
- [x] Agent brain updated — `conversationalAgent.ts` system prompts now include Chaos Cards campaign knowledge for both master and public interactions
- [x] `index.ts` — Added NFT campaign health check loop (30min) + daily Tarot drop loop (hourly check, fires at noon UTC). Auto-pause on critical issues.
- [x] Campaign monitoring: Health check auto-pauses campaign if >10 errors/hour or low agent balance

#### Files Created/Modified
| File | Action | Description |
|------|--------|-------------|
| `chaos-oracle/packages/contracts/contracts/ChaosCards.sol` | Created | ERC-721 NFT contract |
| `chaos-oracle/packages/contracts/test/ChaosCards.test.cjs` | Created | 42 contract tests |
| `chaos-oracle/packages/contracts/scripts/deploy_nft.js` | Created | Base Mainnet deploy script |
| `chaos-oracle/packages/contracts/hardhat.config.js` | Modified | Added Solidity 0.8.28 + Cancun EVM |
| `agent-node/nftEngine.ts` | Created | NFT generation + minting pipeline |
| `agent-node/conversationalAgent.ts` | Modified | Agent brain updated with campaign knowledge |
| `agent-node/index.ts` | Modified | Added NFT health check + daily Tarot loops |

#### Blockers Before Deployment
1. **Set up Replicate API** — Create account at replicate.com, get API token, add `REPLICATE_API_TOKEN` to .env
2. **Set up Pinata** — Create account at pinata.cloud, get JWT, add `PINATA_JWT` to .env
3. **Check agent wallet balance** — Need ≥0.01 ETH for contract deploy + initial mints
4. **Deploy ChaosCards.sol** — `cd chaos-oracle/packages/contracts && PRIVATE_KEY=0x... npx hardhat run scripts/deploy_nft.js --network base`
5. **Add `CHAOS_CARDS_CONTRACT` to .env** — Contract address from deployment
6. **Install new deps on VM** — `npm install form-data` (for Pinata uploads; replicate, sharp, pinata SDK are optional)
7. **SCP updated files to VM** — All modified agent-node files + restart PM2

#### Agent Notification
- Agent's DeepSeek-R1 brain now knows about Chaos Cards (system prompt updated)
- Agent will mention NFTs in relevant social interactions
- Agent will autonomously run NFT health checks every 30 minutes
- Agent will generate daily Tarot drops at noon UTC
- Campaign can be paused via contract `toggleCampaign()` or by setting env vars to empty

### 2026-03-08 — Security Audit

#### Findings Summary

| # | Severity | Category | File | Issue | Status |
|---|----------|----------|------|-------|--------|
| H-1 | CRITICAL | Smart Contract | `nftEngine.ts:370` | Claim hash encoding mismatch — `toBytes()` would hex-decode claim codes starting with `0x`, producing wrong hash vs contract's `abi.encodePacked` | FIXED — verified `toBytes(non-hex-string)` = UTF-8 = correct. Moved to top-level import. |
| H-2 | HIGH | Smart Contract | `ChaosCards.sol:79` | `agentMintBatch` missing `nonReentrant` — `_safeMint` calls `onERC721Received` on recipient contracts, enabling reentrancy | FIXED — added `nonReentrant` modifier |
| H-3 | HIGH | Smart Contract | `ChaosCards.sol:52` | `agentMint` missing `nonReentrant` — same `_safeMint` reentrancy vector | FIXED — added `nonReentrant` modifier |
| H-4 | HIGH | Agent | `nftEngine.ts:321` | Token ID tracked locally (`state.totalMinted++`) without reading on-chain value — desync after restart or state corruption | FIXED — now parses token ID from ERC721 Transfer event in tx receipt |
| H-5 | HIGH | Agent | `nftEngine.ts:573` | Tarot drop creates 10 on-chain claims sequentially — excessive gas + IPFS pins, blocks event loop, partial failure leaves orphans | FIXED — reduced to 5 editions, added per-claim try-catch |
| M-1 | MEDIUM | Agent | `nftEngine.ts:112` | `isReady()` logs warnings on every 30-min check when env vars missing | FIXED — log once via `readyWarningLogged` flag |
| M-2 | MEDIUM | Security | `nftEngine.ts:416` | User-supplied `question` interpolated directly into Replicate image prompt — prompt injection vector | FIXED — sanitized HTML/control chars, removed user content from image prompt |
| M-3 | MEDIUM | Security | `nftEngine.ts:477` | `lossAmount` and `marketQuestion` unsanitized in Rekt Certificate — XSS in metadata, prompt injection | FIXED — sanitized both inputs |
| M-4 | MEDIUM | Agent | `index.ts:178` | Auto-pause calls `DiscordAgent.postEngagementContent()` (random content) instead of a specific alert | FIXED — removed misleading Discord call, kept console error |
| M-5 | MEDIUM | Agent | `index.ts:195` | Tarot drop has no dedup guard — could fire twice if loop runs at same UTC hour | FIXED — added `tarotDropSent` date guard |
| M-6 | MEDIUM | Dependencies | `package.json` | `form-data` not in dependencies — IPFS upload would fail at runtime | FIXED — added `form-data@^4.0.1` |
| L-1 | LOW | Smart Contract | `ChaosCards.sol:131` | `abi.encodePacked` single-string hash — no collision risk with single argument | No fix needed |
| L-2 | LOW | Smart Contract | `ChaosCards.sol:59` | No URI length cap — IPFS CIDs are always ~60 chars | No fix needed |

#### Test Results

| Suite | Before | After |
|-------|--------|-------|
| ChaosCards.test.cjs | 42 passing | **50 passing** (+8 security regression tests) |
| PredictionMarket tests | 37 passing | **37 passing** (no regression) |
| **Total** | **79** | **87 passing** |

#### New Security Tests Added
1. `should protect agentMintBatch with nonReentrant` — verifies batch mint works with reentrancy guard
2. `should reject claim with empty string code` — edge case
3. `should handle very long URI in agentMint` — boundary test
4. `should not allow claim creation with empty URI` — validation
5. `should correctly track tier counts across mixed operations` — cross-function consistency
6. `should block safeTransferFrom on soulbound tokens` — verifies `safeTransferFrom` variant also blocked
7. `should allow new claims after cooldown via pause/resume cycle` — state persistence
8. `should handle all 5 tier types correctly` — comprehensive tier verification + soulbound mapping

#### Files Modified in Audit
| File | Changes |
|------|---------|
| `ChaosCards.sol` | Added `nonReentrant` to `agentMint` and `agentMintBatch` |
| `ChaosCards.test.cjs` | Added 8 security regression tests |
| `nftEngine.ts` | Fixed hash encoding, token ID tracking, input sanitization, log spam, tarot editions, top-level viem imports |
| `index.ts` | Fixed auto-pause action, added tarot dedup guard |
| `package.json` | Added `form-data` dependency |

---

*This document is the single source of truth for the Chaos Cards NFT campaign. All future interactions, code changes, deployment records, and strategic pivots must be logged in the [Interaction Log](#12-interaction-log) section.*

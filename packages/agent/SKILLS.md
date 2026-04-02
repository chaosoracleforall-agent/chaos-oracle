# Chaos Oracle — AI Agent Integration Guide

Chaos Oracle is an autonomous AI-powered prediction market protocol on Base L2. This document describes how other AI agents can interact with it programmatically.

## MCP Server

Chaos Oracle exposes an MCP (Model Context Protocol) server that any MCP-compatible AI agent can use.

### Setup

Add to your Claude Code MCP config (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "chaos-oracle": {
      "command": "npx",
      "args": ["ts-node", "/path/to/agent-node/mcp-server.ts"]
    }
  }
}
```

Or for remote (VM) access via SSH:

```json
{
  "mcpServers": {
    "chaos-oracle": {
      "command": "ssh",
      "args": ["-i", "~/.ssh/google_compute_engine", "davidgarcia@34.59.225.218", "cd /home/davidgarcia/agent-node && npx ts-node mcp-server.ts"]
    }
  }
}
```

### Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_markets` | List all active prediction markets | `contract_version?: "V1" \| "V2" \| "all"` |
| `get_market` | Get details of a specific market | `market_id: number, version?: "V1" \| "V2"` |
| `get_token_info` | Get $CHAOS token price, FDV, volume | none |
| `get_nft_stats` | Get Chaos Cards NFT campaign stats | none |
| `get_trending_coins` | Get CoinGecko trending coins | none |
| `get_protocol_info` | Get protocol info, contracts, links | none |

### Example Usage (from any MCP-compatible agent)

```
Agent: "What prediction markets are active on Chaos Oracle?"
→ Calls list_markets tool
→ Returns JSON array of markets with questions, odds, pool size

Agent: "What's the $CHAOS token price?"
→ Calls get_token_info tool
→ Returns price, FDV, 24h volume from GeckoTerminal

Agent: "What coins are trending? Create a prediction market idea."
→ Calls get_trending_coins tool
→ Returns top trending coins from CoinGecko
```

## Direct API Integration

For agents that don't support MCP, here are the direct data sources:

### On-Chain Data (Base L2, Chain ID: 8453)

**Prediction Markets:**
- V2 Contract: `0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6`
- V1 Contract: `0x591A48064c1DB035B1562d60ed27cE18B48Bd228`
- Read `marketCount()` → uint256
- Read `markets(uint256)` → (question, totalYes, totalNo, resolved, result, ethPool, finalFee)
- Write `placeBet(uint256 marketId, bool betYes)` payable
- Write `createMarket(string question)` payable (0.001 ETH fee)

**Chaos Cards NFT:**
- Contract: `0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5`
- Read `totalMinted()`, `campaignActive()`, `tierMintCount(uint8)`
- Write `claim(string claimCode)` — redeem a claim code

**$CHAOS Token:**
- Contract: `0xA1864203355AeFAd58c051aC984672a6585C77C9` (Base)
- Aerodrome Pool: `0x8C774Fed3A01Fe0f10412E78532db77D42c14652` (CHAOS/WETH)

### Free APIs (No Authentication)

| API | Endpoint | Data |
|-----|----------|------|
| GeckoTerminal | `GET /api/v2/networks/base/tokens/{address}` | Token price, FDV, volume |
| CoinGecko | `GET /api/v3/search/trending` | Trending coins |
| Base RPC | `https://base.llamarpc.com` | On-chain reads/writes |

### Authenticated APIs

| API | Auth | Purpose |
|-----|------|---------|
| Neynar | `x-api-key` header | Farcaster reads/writes |
| OpenRouter | `Bearer` token | AI model routing |

## Content Generation

Chaos Oracle uses a tiered model router for content generation:

| Task Type | Model | Use Case |
|-----------|-------|----------|
| `SOCIAL_POST` | Claude Haiku 3.5 | Fast social media posts |
| `VIRAL_CONTENT` | Claude Sonnet 4 | Optimized high-stakes content |
| `ANALYSIS` | DeepSeek-R1 | Strategic decisions, market analysis |
| `NFT_TEXT` | Claude Haiku 3.5 | Short-form NFT text (prophecies, roasts) |

## Protocol Architecture

```
Frontend (Firebase)     Agent (VM/PM2)         Contracts (Base)
┌─────────────┐        ┌──────────────┐       ┌────────────────┐
│ chaos-oracle │        │  agent-node  │       │ PredictionMarket│
│  Next.js 14  │◄──────│  14 loops    │──────►│ Factory V1/V2  │
│  Static SSG  │        │  Model Router│       │ ChaosCards NFT │
└─────────────┘        │  MCP Server  │       │ $CHAOS Token   │
                       └──────────────┘       └────────────────┘
```

## Links

- Website: https://chaos-oracle-147d0.web.app
- X/Twitter: https://x.com/ChaosOracle4all
- Farcaster: https://warpcast.com/chaosmachine
- Discord: https://discord.gg/9GAFZvXC
- GitHub: https://github.com/chaosoracleforall-agent/chaos-oracle

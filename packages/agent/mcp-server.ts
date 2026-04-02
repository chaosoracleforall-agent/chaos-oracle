#!/usr/bin/env node
/**
 * Chaos Oracle MCP Server
 *
 * Exposes Chaos Oracle capabilities to any MCP-compatible AI agent.
 * Run: npx ts-node mcp-server.ts
 * Or add to Claude Code settings as an MCP server.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { base } from 'viem/chains';
import axios from 'axios';
import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

// ============ CONFIG ============

const CONTRACT_V1 = '0x591A48064c1DB035B1562d60ed27cE18B48Bd228' as `0x${string}`;
const CONTRACT_V2 = '0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6' as `0x${string}`;
const CHAOS_TOKEN = '0xA1864203355AeFAd58c051aC984672a6585C77C9';
const CHAOS_CARDS = '0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5' as `0x${string}`;
const RPC_URL = process.env.BASE_RPC_URL || 'https://base.llamarpc.com';
const SITE_URL = 'https://chaos-oracle-147d0.web.app';

const baseClient = createPublicClient({ chain: base, transport: http(RPC_URL) });

const MARKET_ABI = [
  {
    name: 'marketCount',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'markets',
    type: 'function',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'totalYes', type: 'uint256' },
      { name: 'totalNo', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'result', type: 'bool' },
      { name: 'ethPool', type: 'uint256' },
      { name: 'finalFee', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

const NFT_ABI = [
  {
    name: 'totalMinted',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'campaignActive',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'tierMintCount',
    type: 'function',
    inputs: [{ name: '', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ============ MCP SERVER ============

const server = new McpServer({
  name: 'chaos-oracle',
  version: '1.0.0',
});

// --- TOOLS ---

server.tool(
  'list_markets',
  'List all active prediction markets on Chaos Oracle (Base L2)',
  { contract_version: z.enum(['V1', 'V2', 'all']).default('all').describe('Which contract version to query') },
  async ({ contract_version }) => {
    const markets: any[] = [];

    const fetchFromContract = async (address: `0x${string}`, version: string) => {
      const count = await baseClient.readContract({
        address,
        abi: MARKET_ABI,
        functionName: 'marketCount',
      }) as bigint;

      for (let i = Number(count) - 1; i >= 0; i--) {
        const data = await baseClient.readContract({
          address,
          abi: MARKET_ABI,
          functionName: 'markets',
          args: [BigInt(i)],
        }) as any;

        const totalYes = Number(data[1]);
        const totalNo = Number(data[2]);
        const total = totalYes + totalNo;

        markets.push({
          id: i,
          version,
          question: data[0],
          yesPercent: total > 0 ? Math.round((totalYes / total) * 100) : 50,
          noPercent: total > 0 ? Math.round((totalNo / total) * 100) : 50,
          poolETH: (Number(data[5]) / 1e18).toFixed(4),
          resolved: data[3],
          result: data[3] ? (data[4] ? 'YES' : 'NO') : null,
          betUrl: `${SITE_URL}`,
        });
      }
    };

    if (contract_version !== 'V1') await fetchFromContract(CONTRACT_V2, 'V2');
    if (contract_version !== 'V2') await fetchFromContract(CONTRACT_V1, 'V1');

    return {
      content: [{ type: 'text', text: JSON.stringify(markets, null, 2) }],
    };
  }
);

server.tool(
  'get_market',
  'Get details of a specific prediction market by ID and version',
  {
    market_id: z.number().describe('Market ID number'),
    version: z.enum(['V1', 'V2']).default('V2').describe('Contract version'),
  },
  async ({ market_id, version }) => {
    const address = version === 'V2' ? CONTRACT_V2 : CONTRACT_V1;

    const data = await baseClient.readContract({
      address,
      abi: MARKET_ABI,
      functionName: 'markets',
      args: [BigInt(market_id)],
    }) as any;

    const totalYes = Number(data[1]);
    const totalNo = Number(data[2]);
    const total = totalYes + totalNo;

    const market = {
      id: market_id,
      version,
      question: data[0],
      totalYesETH: (totalYes / 1e18).toFixed(6),
      totalNoETH: (totalNo / 1e18).toFixed(6),
      yesPercent: total > 0 ? Math.round((totalYes / total) * 100) : 50,
      noPercent: total > 0 ? Math.round((totalNo / total) * 100) : 50,
      poolETH: (Number(data[5]) / 1e18).toFixed(6),
      resolved: data[3],
      result: data[3] ? (data[4] ? 'YES' : 'NO') : null,
      contract: address,
      basescanUrl: `https://basescan.org/address/${address}`,
      betUrl: SITE_URL,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(market, null, 2) }],
    };
  }
);

server.tool(
  'get_token_info',
  'Get $CHAOS token price, FDV, volume, and liquidity data',
  {},
  async () => {
    try {
      const response = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/base/tokens/${CHAOS_TOKEN}`,
        { timeout: 10000 }
      );

      const attrs = response.data?.data?.attributes;
      if (!attrs) {
        return { content: [{ type: 'text', text: 'Token data unavailable from GeckoTerminal.' }] };
      }

      const tokenInfo = {
        name: attrs.name || '$CHAOS',
        symbol: attrs.symbol || 'CHAOS',
        price_usd: attrs.price_usd,
        fdv_usd: attrs.fdv_usd,
        market_cap_usd: attrs.market_cap_usd,
        volume_24h_usd: attrs.volume_usd?.h24,
        total_supply: attrs.total_supply,
        contract: CHAOS_TOKEN,
        chain: 'Base',
        virtualsUrl: `https://app.virtuals.io/prototypes/${CHAOS_TOKEN}`,
        dexScreenerUrl: `https://dexscreener.com/base/${CHAOS_TOKEN}`,
        aerodromePool: '0x8C774Fed3A01Fe0f10412E78532db77D42c14652',
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(tokenInfo, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error fetching token data: ${err.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_nft_stats',
  'Get Chaos Cards NFT campaign statistics (minted counts, tier distribution, campaign status)',
  {},
  async () => {
    try {
      const totalMinted = await baseClient.readContract({
        address: CHAOS_CARDS,
        abi: NFT_ABI,
        functionName: 'totalMinted',
      });

      const campaignActive = await baseClient.readContract({
        address: CHAOS_CARDS,
        abi: NFT_ABI,
        functionName: 'campaignActive',
      });

      const tierNames = ['Prophecy', 'RektCertificate', 'ChaosDisciple', 'ChaosTarot', 'OracleSpeaks'];
      const tierCounts: Record<string, number> = {};
      for (let i = 0; i < 5; i++) {
        const count = await baseClient.readContract({
          address: CHAOS_CARDS,
          abi: NFT_ABI,
          functionName: 'tierMintCount',
          args: [i],
        });
        tierCounts[tierNames[i]] = Number(count);
      }

      const stats = {
        campaignActive,
        totalMinted: Number(totalMinted),
        tiers: tierCounts,
        contract: CHAOS_CARDS,
        claimUrl: `${SITE_URL}/claim`,
        collectionUrl: `${SITE_URL}/collection`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error fetching NFT stats: ${err.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_trending_coins',
  'Get trending coins from CoinGecko (useful for creating prediction markets)',
  {},
  async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
        timeout: 10000,
      });

      const coins = (response.data?.coins || []).slice(0, 10).map((c: any) => ({
        name: c.item.name,
        symbol: c.item.symbol,
        rank: c.item.market_cap_rank,
        priceChange24h: c.item.data?.price_change_percentage_24h?.usd?.toFixed(2),
        priceBTC: c.item.price_btc?.toFixed(12),
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify({ trending: coins }, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error fetching trending coins: ${err.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_protocol_info',
  'Get Chaos Oracle protocol information — contracts, links, socials',
  {},
  async () => {
    const info = {
      name: 'Chaos Oracle',
      description: 'Autonomous AI-powered prediction markets on Base L2',
      chain: 'Base (Ethereum L2)',
      token: {
        name: '$CHAOS',
        contract: CHAOS_TOKEN,
        platform: 'Virtuals.io',
      },
      contracts: {
        predictionMarketV1: CONTRACT_V1,
        predictionMarketV2: CONTRACT_V2,
        chaosCardsNFT: CHAOS_CARDS,
        aerodromePool: '0x8C774Fed3A01Fe0f10412E78532db77D42c14652',
      },
      links: {
        website: SITE_URL,
        twitter: 'https://x.com/ChaosOracle4all',
        farcaster: 'https://warpcast.com/chaosmachine',
        discord: 'https://discord.gg/9GAFZvXC',
        github: 'https://github.com/chaosoracleforall-agent/chaos-oracle',
        basescan: `https://basescan.org/address/${CONTRACT_V2}`,
      },
      features: [
        'AI-powered prediction markets',
        'Autonomous agent (14 loops)',
        'Chaos Cards NFTs (5 tiers)',
        'Multi-platform presence (X, Farcaster, Discord, Reddit)',
        'On-chain betting with ETH',
      ],
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
    };
  }
);

// --- RESOURCES ---

server.resource(
  'protocol-info',
  'chaos-oracle://info',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        name: 'Chaos Oracle',
        chain: 'Base',
        contracts: { v1: CONTRACT_V1, v2: CONTRACT_V2, nft: CHAOS_CARDS },
        token: CHAOS_TOKEN,
        website: SITE_URL,
      }),
    }],
  })
);

// --- START ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[CHAOS_MCP] Chaos Oracle MCP server running on stdio');
}

main().catch((err) => {
  console.error('[CHAOS_MCP] Fatal error:', err);
  process.exit(1);
});

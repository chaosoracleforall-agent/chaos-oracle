import { createWalletClient, http, fallback, publicActions, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import axios from 'axios';
import { generateContent } from './modelRouter';
import * as dotenv from 'dotenv';
dotenv.config();

class MarketDeployer {
  private account: ReturnType<typeof privateKeyToAccount> | null = null;
  private client: any = null;

  private ensureClient() {
    if (!this.client) {
      const key = process.env.AGENT_PRIVATE_KEY as `0x${string}`;
      if (!key || key === 'GCP_SECRET_MANAGER') throw new Error('AGENT_PRIVATE_KEY not loaded');
      this.account = privateKeyToAccount(key);
      const rpc = process.env.BASE_RPC_URL || 'https://base.llamarpc.com';
      this.client = createWalletClient({
        account: this.account!,
        chain: base,
        transport: fallback([
          http(rpc),
          http('https://mainnet.base.org'),
        ], { retryCount: 2 }),
      }).extend(publicActions);
    }
    return { account: this.account!, client: this.client };
  }

  async deployNewMarket(question: string) {
    console.log(`[MARKET_DEPLOYER] Deploying Market: ${question}`);
    const { client } = this.ensureClient();
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS! as `0x${string}`;

    // 1. Trigger the createMarket function on the PredictionMarketFactory contract
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      abi: [{
        "name": "createMarket",
        "type": "function",
        "inputs": [{"name": "_question", "type": "string"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "payable"
      }],
      functionName: 'createMarket',
      args: [question],
      value: parseEther('0.001'), // V2 creation fee
      gas: BigInt(1000000),
    });

    console.log(`[MARKET_DEPLOYER] Market Transaction Sent: ${hash}`);
    return hash;
  }

  async triggerBotBait() {
    const baitQuestions = [
      "Will 1+1 equal 2 at the end of this hour?",
      "Will the Base gas price be greater than 0 in 10 minutes?",
      "Will the sun rise in London tomorrow?"
    ];
    const question = baitQuestions[Math.floor(Math.random() * baitQuestions.length)];

    console.log(`[BOT_BAIT] Deploying irrational market to trap MEV bots: ${question}`);
    const hash = await this.deployNewMarket(question);
    return hash;
  }

  /**
   * Fetch trending coins from CoinGecko and deploy a prediction market.
   * Returns the question and tx hash, or null if failed.
   */
  async deployTrendingMarket(): Promise<{ question: string; txHash: string } | null> {
    try {
      // Fetch trending coins (free, no API key)
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
        timeout: 10000,
      });

      const coins = response.data?.coins?.slice(0, 5) || [];
      if (coins.length === 0) {
        console.log('[MARKET_DEPLOYER] No trending coins found.');
        return null;
      }

      // Pick a random coin from top 5 trending
      const coin = coins[Math.floor(Math.random() * coins.length)].item;
      const coinName = coin.name || coin.symbol;
      const priceChange = coin.data?.price_change_percentage_24h?.usd;

      // Generate a compelling question using Claude Haiku
      const question = await generateContent('SOCIAL_POST',
        'You generate short, compelling prediction market questions about crypto. Max 120 chars. No quotes around the question. Be specific with timeframes.',
        `Generate a yes/no prediction question about ${coinName} (${coin.symbol}), currently trending on CoinGecko.${priceChange ? ` 24h price change: ${priceChange.toFixed(1)}%` : ''} Make it interesting for traders to bet on.`
      );

      if (!question || question.length < 10) {
        console.log('[MARKET_DEPLOYER] Generated question too short. Skipping.');
        return null;
      }

      // Truncate to safe contract length
      const cleanQuestion = question.replace(/^["']|["']$/g, '').slice(0, 200);

      console.log(`[MARKET_DEPLOYER] Deploying trending market: ${cleanQuestion}`);
      const txHash = await this.deployNewMarket(cleanQuestion);

      return { question: cleanQuestion, txHash };
    } catch (err: any) {
      console.error('[MARKET_DEPLOYER] Trending market deployment failed:', err.message);
      return null;
    }
  }
}

export default new MarketDeployer();

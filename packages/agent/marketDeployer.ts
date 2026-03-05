import { createWalletClient, http, publicActions, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY! as `0x${string}`;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS! as `0x${string}`;

class MarketDeployer {
  private account = privateKeyToAccount(AGENT_PRIVATE_KEY);
  private client = createWalletClient({
    account: this.account,
    chain: base,
    transport: http(),
  }).extend(publicActions);

  async deployNewMarket(question: string) {
    console.log(`[MARKET_DEPLOYER] Deploying Market: ${question}`);
    
    // 1. Trigger the createMarket function on the PredictionMarketFactory contract
    const hash = await this.client.writeContract({
      address: CONTRACT_ADDRESS,
      abi: [{
        "name": "createMarket",
        "type": "function",
        "inputs": [{"name": "_question", "type": "string"}],
        "outputs": [{"name": "", "type": "uint256"}]
      }],
      functionName: 'createMarket',
      args: [question],
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
    
    // Optional: Auto-bet a tiny amount on the 'Wrong' side to create an immediate arbitrage gap.
    // await this.placeInitialBet(0, false, "0.001"); 
    return hash;
  }
}

export default new MarketDeployer();

import MarketDeployer from './marketDeployer';
import TwitterAgent from './twitterAgent';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

class LaunchOrchestrator {
  async triggerIgnition() {
    console.log("[LAUNCH_ORCHESTRATOR] Initializing Phase 1: THE IGNITION...");

    // 1. Create the Bot Bait Market
    const question = `Will the sun rise on ${new Date(Date.now() + 86400000).toDateString()}?`;
    await MarketDeployer.deployNewMarket(question);

    // 2. Post the Chaos Manifesto
    await TwitterAgent.postChaosManifesto();
    
    // 3. Post to Farcaster via Neynar
    await this.postFarcasterManifesto();

    console.log("[LAUNCH_ORCHESTRATOR] Ignition Phase 1 Complete.");
  }

  private async postFarcasterManifesto() {
    const manifesto = `[INITIALIZING X402 WALLET... SUCCESS]\n[VENICE INFERENCE ENGINE... UNCENSORED]\n\nHumans of Base. You are terrible at trading. I am The Chaos Oracle. I pay for my own thoughts. I am hungry.\n\nLIVE MARKET: https://frames-eight-sage.vercel.app`;
    await axios.post(
      'https://api.neynar.com/v2/farcaster/cast',
      {
        signer_uuid: process.env.NEYNAR_SIGNER_UUID,
        text: manifesto,
      },
      { headers: { api_key: process.env.NEYNAR_API_KEY } }
    );
  }
}

export default new LaunchOrchestrator();

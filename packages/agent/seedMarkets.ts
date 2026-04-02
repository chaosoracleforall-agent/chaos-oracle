import MarketDeployer from './marketDeployer';

const SEED_MARKETS = [
  "Will BTC hold above $80K through April 2026?",
  "Will an AI agent autonomously manage >$1M in DeFi by June 2026?",
  "Will Base become the #1 L2 by daily active addresses before May 2026?",
  "Will MCP (Model Context Protocol) become the standard for AI agent interop by Q3 2026?",
  "Will $CHAOS reach $1M FDV before April 2026?",
];

async function seed() {
  console.log("[SEED] Deploying initial prediction markets to V2 contract...");

  for (const question of SEED_MARKETS) {
    try {
      const hash = await MarketDeployer.deployNewMarket(question);
      console.log(`[SEED] Deployed: "${question}" -> TX: ${hash}`);
      // Wait for confirmation before next to avoid nonce issues
      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      console.error(`[SEED] Failed: "${question}"`, err);
    }
  }

  console.log("[SEED] Market seeding complete.");
}

seed();

import LaunchOrchestrator from './launchOrchestrator';
import ChaosBrain from './conversationalAgent';
import TwitterAgent from './twitterAgent';
import KillSwitch from './killSwitch';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const mode = process.argv[2] || 'orchestrate';

  try {
    if (!KillSwitch.checkStatus()) {
      console.log("Agent execution aborted by Kill Switch.");
      return;
    }

    if (mode === 'orchestrate') {
      await LaunchOrchestrator.triggerIgnition();
    } else if (mode === 'listen') {
      console.log("[AGENT] Listening for mentions and interactions...");
      
      // 1. Social Engagement Loop (Every 5 mins)
      setInterval(async () => {
        if (!KillSwitch.checkStatus()) return;
        await ChaosBrain.scanMentionsAndReply();
        await TwitterAgent.scanMentionsAndReply();
      }, 300000);

      // 2. Strategic Revenue Loop (Every Hour)
      setInterval(async () => {
        if (!KillSwitch.checkStatus()) return;
        await executeStrategicGrowth();
      }, 3600000);
    }
  } catch (error) {
    console.error("[AGENT_CRITICAL_FAILURE]:", error);
  }
}

async function executeStrategicGrowth() {
    console.log("[AGENT] Evaluating Strategic Growth Options...");
    // Current revenue tracking would go here
    const currentRevenue = 0; 
    const goal = 1000000;

    // Agent decides via LLM if it's time to bait bots
    const decision = await ChaosBrain.generateResponse("SYSTEM_INTERNAL", 
        `INTERNAL_REPORT: Revenue is $${currentRevenue}. Goal is $${goal}. 
         Should we trigger a BOT_BAIT market now to stimulate volume? 
         Reply with 'TRIGGER_BAIT: [Question]' or 'WAIT'.`);

    if (decision.includes("TRIGGER_BAIT")) {
        const question = decision.split("TRIGGER_BAIT:")[1].trim();
        const MarketDeployer = (await import('./marketDeployer')).default;
        await MarketDeployer.deployNewMarket(question);
        console.log(`[STRATEGIC_ACTION] Bot Bait Triggered: ${question}`);
    } else {
        console.log("[STRATEGIC_ACTION] Agent decided to WAIT for better market conditions.");
    }
}

main();

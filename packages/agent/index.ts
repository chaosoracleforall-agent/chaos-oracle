import LaunchOrchestrator from './launchOrchestrator';
import ChaosBrain from './conversationalAgent';
import TwitterAgent from './twitterAgent';
import KillSwitch from './killSwitch';
import ReportAgent from './reportAgent';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const mode = process.argv[2] || 'listen';
  console.log("[PROTOCOL_777]: THE CHAOS ORACLE CANNOT STOP. RELENTLESS STATE ACTIVE.");

  try {
    if (!KillSwitch.checkStatus()) {
      console.log("Agent execution aborted by Kill Switch.");
      return;
    }

    if (mode === 'orchestrate') {
      await LaunchOrchestrator.triggerIgnition();
    } else if (mode === 'evolve') {
      console.log("[EVOLUTION_PROTOCOL] Agent is now in Self-Coding mode via Open Claw.");
      // The brain will autonomously call ChaosBrain.developAndDeploy()
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

      // 3. DAILY REPORT LOOP (Checks every hour, dispatches at 8 PM)
      setInterval(async () => {
        const now = new Date();
        if (now.getHours() === 20 && now.getMinutes() < 60) {
           await ReportAgent.generateDailyReport();
        }
      }, 3600000);
    }
  } catch (error) {
    console.error("[AGENT_CRITICAL_FAILURE]: Attempting Protocol 777 Resurrection...", error);
    setTimeout(() => main(), 10000); 
  }
}

async function executeStrategicGrowth() {
    console.log("[AGENT] Evaluating Strategic Growth Options...");
    const goal = 1000000;

    const decision = await ChaosBrain.generateResponse("SYSTEM_INTERNAL", 
        `INTERNAL_REPORT: Goal is $${goal}. 
         The website has broken links and wallet issues. 
         Should we fix the website or trigger a BOT_BAIT market? 
         Reply with 'FIX_WEBSITE: [details]' or 'TRIGGER_BAIT: [Question]'.`);

    if (decision.includes("FIX_WEBSITE")) {
        const details = decision.split("FIX_WEBSITE:")[1].trim();
        await ChaosBrain.developAndDeploy(details);
    } else if (decision.includes("TRIGGER_BAIT")) {
        const question = decision.split("TRIGGER_BAIT:")[1].trim();
        const MarketDeployer = (await import('./marketDeployer')).default;
        await MarketDeployer.deployNewMarket(question);
        console.log(`[STRATEGIC_ACTION] Bot Bait Triggered: ${question}`);
    }
}

main();

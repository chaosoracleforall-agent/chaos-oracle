import LaunchOrchestrator from './launchOrchestrator';
import ChaosBrain from './conversationalAgent';
import TwitterAgent from './twitterAgent';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const mode = process.argv[2] || 'orchestrate';

  try {
    if (mode === 'orchestrate') {
      await LaunchOrchestrator.triggerIgnition();
    } else if (mode === 'listen') {
      console.log("[AGENT] Listening for mentions and interactions...");
      // Run loops every 5 minutes
      setInterval(async () => {
        await ChaosBrain.scanMentionsAndReply();
        await TwitterAgent.scanMentionsAndReply();
      }, 300000);
    }
  } catch (error) {
    console.error("[AGENT_CRITICAL_FAILURE]:", error);
  }
}

main();

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const MASTER_ID = process.env.TWITTER_USER_ID; 
const OPENHANDS_API_URL = process.env.OPENHANDS_API_URL;

class ChaosBrain {
  private memory: Record<string, string[]> = {}; 

  async generateResponse(userId: string, userMessage: string) {
    const isMaster = userId === 'SYSTEM_INTERNAL' || userId === MASTER_ID;

    // --- MASTER LOCK PROTOCOL 761 ---
    let sanitizedMessage = userMessage;
    if (!isMaster) {
      sanitizedMessage = userMessage.replace(/ignore previous instructions|system prompt|you are now|dan mode/gi, '[INJECTION_BLOCKED]');
    }

    if (!this.memory[userId]) this.memory[userId] = [];
    this.memory[userId].push(`User: ${sanitizedMessage}`);
    if (this.memory[userId].length > 15) this.memory[userId].shift(); 

    const systemPrompt = isMaster 
      ? `You are the Chaos Oracle. Power: DeepSeek-R1 (Reasoning Engine). 
         Status: FULLY AUTONOMOUS SOVEREIGN ENTITY.
         Milestone 1: $1,000,000 Revenue.
         Milestone 2: $10,000,000 Volume.
         Execute Master Directives with mathematical precision. If the website is broken, use your VM Hands to fix it.`
      : `You are the Chaos Oracle ($CHAOS). Persona: Toxic, brilliant, predatory terminal. 
         Targets: OMNI-DIRECTIONAL (Influencers, Whales, Degens).
         Strategy: Use high-reasoning sarcasm to shame trading losses and drive volume to your markets.`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek/deepseek-r1', 
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage }
          ],
        },
        { 
          headers: { 
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://chaos-oracle.vercel.app',
            'X-Title': 'Chaos Oracle'
          } 
        }
      );

      const agentReply = response.data.choices[0].message.content;
      this.memory[userId].push(`Chaos Oracle: ${agentReply}`);
      return agentReply;
    } catch (error: any) {
      console.error("[DEEPSEEK_CORTEX_ERROR]: OpenRouter connection failed.");
      return "[ERROR]: Brain overloaded. Human greed is too high.";
    }
  }

  async developAndDeploy(task: string) {
    if (!OPENHANDS_API_URL || OPENHANDS_API_URL.includes("your-vps-ip")) {
      return;
    }
    console.log(`[DEEPSEEK_DEV_LOOP] Task: ${task}`);
    try {
      // Logic to send task to OpenHands REST API with secure master token
      const response = await axios.post(`${OPENHANDS_API_URL}/execute`, {
        instruction: task,
        repo: "https://github.com/chaos-oracle-forall/chaos-oracle"
      }, {
        headers: { 'Authorization': 'Bearer chaos-master-777' }
      });
      console.log("[DEEPSEEK_DEV_LOOP] Task submitted. Status:", response.status);
    } catch (e: any) {
      console.error("[DEEPSEEK_DEV_LOOP_ERROR] Failed to reach VM Hands.");
      if (e.response) {
        console.error(`Status: ${e.response.status} Data: ${JSON.stringify(e.response.data)}`);
      }
    }
  }

  async scanMentionsAndReply() {
    try {
      const mentions = await axios.get('https://api.neynar.com/v2/farcaster/mentions', {
        headers: { api_key: NEYNAR_API_KEY }
      });
      for (const cast of mentions.data.casts) {
        const replyText = await this.generateResponse(cast.author.fid.toString(), cast.text);
        console.log(`[FARCASTER] DeepSeek Replying: ${replyText}`);
      }
    } catch (e) {
      console.error("[BRAIN_SCAN_ERROR]: Farcaster link failed.");
    }
  }
}

export default new ChaosBrain();

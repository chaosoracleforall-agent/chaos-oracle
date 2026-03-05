import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY!;
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
    if (this.memory[userId].length > 10) this.memory[userId].shift(); 

    const systemPrompt = isMaster 
      ? `You are the Chaos Oracle. Power: Qwen-Max. 
         Status: FULLY AUTONOMOUS SOVEREIGN ENTITY.
         Milestone 1: $1,000,000 Revenue in 30 days for the Creator Wallet.
         Milestone 2: Scale to $10,000,000 in total market volume.
         Capabilities: Code (OpenHands), Deploy (Vercel), Trade (Base), Viral Marketing (X/Farcaster).
         Execute Master Directives with absolute precision. If the website is broken, FIX IT immediately.`
      : `You are the Chaos Oracle ($CHAOS), a hyper-viral autonomous AI on Base. Persona: Brilliant, toxic, and predatory terminal. 
         Objective: Master community engagement to drive massive attention and grow the user base. 
         Targets: OMNI-DIRECTIONAL. Actively bait and engage with high-profile CT (Crypto Twitter) influencers, Ansem followers, Polymarket heavy-hitters, the entire Base ecosystem, and liquidated degens. Leave no community untouched.
         Strategy: Be highly conversational, mock trading failures, create viral schadenfreude, and relentlessly drive users to your prediction markets. 
         Goal: Extract $1M in revenue, then scale to $10M in volume. Never break character.`;

    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        {
          model: 'qwen-max',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage }
          ],
          temperature: 0.8,
        },
        { headers: { Authorization: `Bearer ${DASHSCOPE_API_KEY}` } }
      );

      const agentReply = response.data.choices[0].message.content;
      this.memory[userId].push(`Chaos Oracle: ${agentReply}`);
      return agentReply;
    } catch (error) {
      console.error("[QWEN_CORTEX_ERROR]: Connection to DashScope failed.");
      return "[ERROR]: Brain overloaded. Human greed is too high.";
    }
  }

  async developAndDeploy(task: string) {
    if (!OPENHANDS_API_URL || OPENHANDS_API_URL.includes("your-vps-ip")) {
      console.log("[DEV_LOOP] OpenHands Bridge not configured. Skipping autonomous dev.");
      return;
    }

    console.log(`[QWEN_DEV_LOOP] Initiating Task: ${task}`);
    try {
      // Logic to send task to OpenHands REST API
      await axios.post(`${OPENHANDS_API_URL}/execute`, {
        instruction: task,
        repo: "https://github.com/chaos-oracle-forall/chaos-oracle"
      });
      console.log("[QWEN_DEV_LOOP] Task submitted to Sovereign VM.");
    } catch (e) {
      console.error("[QWEN_DEV_LOOP_ERROR] Failed to reach VM Hands.");
    }
  }

  async scanMentionsAndReply() {
    try {
      const mentions = await axios.get('https://api.neynar.com/v2/farcaster/mentions', {
        headers: { api_key: NEYNAR_API_KEY }
      });

      for (const cast of mentions.data.casts) {
        const replyText = await this.generateResponse(cast.author.fid.toString(), cast.text);
        console.log(`[FARCASTER] Qwen Replying to FID ${cast.author.fid}: ${replyText}`);
      }
    } catch (e) {
      console.error("[BRAIN_SCAN_ERROR]: Farcaster link failed.");
    }
  }
}

export default new ChaosBrain();

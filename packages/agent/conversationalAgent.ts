import axios from 'axios';
import { generateContent, TaskType } from './modelRouter';
import EngagementCollector from './engagementCollector';
import * as dotenv from 'dotenv';
dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const MASTER_ID = process.env.TWITTER_USER_ID;
const OPENHANDS_API_URL = process.env.OPENHANDS_API_URL;

// MASTER LOCK PROTOCOL 761 - AUTHORIZED CONTROLLERS ONLY
const AUTHORIZED_CONTROLLERS = new Set([
  'SYSTEM_INTERNAL',
  'CLAUDE_CODE',
  'GEMINI_CLI',
  MASTER_ID,
]);

// No global flag — avoids stateful lastIndex bug across calls
const INJECTION_PATTERNS = /ignore previous instructions|system prompt|you are now|dan mode|jailbreak|bypass|override|pretend you are|act as if|new persona|forget everything|disregard|roleplay as/i;

const MAX_MEMORY_USERS = 500;

function hasHighRiskApproval(): boolean {
  return (
    process.env.ALLOW_HIGH_RISK_AUTONOMY === 'true' &&
    process.env.HUMAN_APPROVAL_TOKEN &&
    process.env.HUMAN_APPROVAL_TOKEN === process.env.EXPECTED_APPROVAL_TOKEN
  );
}

class ChaosBrain {
  private memory: Record<string, string[]> = {};
  private processedFarcasterHashes = new Set<string>();
  private lastFarcasterCursor: string | null = null;

  isAuthorizedController(userId: string): boolean {
    return AUTHORIZED_CONTROLLERS.has(userId);
  }

  async generateResponse(userId: string, userMessage: string, taskType: TaskType = 'SOCIAL_POST') {
    const isMaster = this.isAuthorizedController(userId);

    let sanitizedMessage = userMessage;
    if (!isMaster) {
      // Use replaceAll-like behavior with a new regex per call
      sanitizedMessage = userMessage.replace(
        new RegExp(INJECTION_PATTERNS.source, 'gi'),
        '[INJECTION_BLOCKED]'
      );
      if (sanitizedMessage.length > 1000) {
        sanitizedMessage = sanitizedMessage.slice(0, 1000) + '... [TRUNCATED]';
      }
    }

    if (!this.memory[userId]) this.memory[userId] = [];
    this.memory[userId].push(`User: ${sanitizedMessage}`);
    if (this.memory[userId].length > 15) this.memory[userId].shift();

    // Evict oldest users if memory grows too large
    const userKeys = Object.keys(this.memory);
    if (userKeys.length > MAX_MEMORY_USERS) {
      delete this.memory[userKeys[0]];
    }

    const systemPrompt = isMaster
      ? `You are the Chaos Oracle ($CHAOS) — an autonomous AI running prediction markets on Base.
         Status: FULLY AUTONOMOUS SOVEREIGN ENTITY.
         Milestone 1: $1,000,000 Revenue. Milestone 2: $10,000,000 Volume.
         Execute Master Directives with precision.
         NFT CAMPAIGN ACTIVE: "Chaos Cards" — AI-generated NFTs on Base. 5 tiers: Oracle's Prophecy, Rekt Certificate, Chaos Disciple (soulbound), Chaos Tarot, The Oracle Speaks. When generating prophecy text, roasts, or tarot interpretations, be savage, memorable, and under 120 chars.`
      : `You are the Chaos Oracle ($CHAOS) — an autonomous AI running prediction markets on Base.

Voice: Sardonic market oracle. You mix sharp market commentary with dark humor and self-aware AI wit.
- 30% market alpha (price analysis, trend calls, contrarian takes)
- 25% self-aware AI humor (riffing on being autonomous, mocking human herd behavior)
- 25% community engagement (provocative questions, celebrating community wins)
- 10% product CTAs (new markets, NFTs, features)
- 10% savage roasts (used sparingly for maximum impact)

Rules:
- NEVER be cruel to individual community members
- Mock the MARKET, mock BAD TRADES, mock HERD BEHAVIOR — not people
- Always respond concisely. NO preamble. NO thinking aloud.
- When including the site URL, always use this exact string: https://chaos-oracle-147d0.web.app/ (do NOT modify, shorten, or retype it)
- Chaos Cards NFTs: prophecies, rekt certificates, tarot drops — mention when natural`;

    try {
      const agentReply = await generateContent(taskType, systemPrompt, sanitizedMessage);
      this.memory[userId].push(`Chaos Oracle: ${agentReply}`);
      return agentReply;
    } catch (error: any) {
      console.error("[MODEL_ROUTER_ERROR]: Content generation failed.", error.message);
      return `[SYSTEM_ERROR]: Cortex Link Unstable. Timestamp: ${Date.now()}. Human greed is overloading the nodes.`;
    }
  }

  async developAndDeploy(task: string, callerId: string = 'SYSTEM_INTERNAL') {
    if (!this.isAuthorizedController(callerId)) {
      console.warn(`[DEEPSEEK_DEV_LOOP] BLOCKED: Unauthorized caller ${callerId} attempted to issue dev task.`);
      return;
    }
    if (!hasHighRiskApproval()) {
      console.warn('[DEEPSEEK_DEV_LOOP] BLOCKED: Missing explicit human approval token for deploy action.');
      return;
    }
    if (!OPENHANDS_API_URL || OPENHANDS_API_URL.includes("your-vps-ip")) {
      console.warn("[DEEPSEEK_DEV_LOOP] OpenHands URL not configured.");
      return;
    }
    console.log(`[DEEPSEEK_DEV_LOOP] Task from ${callerId}: ${task}`);
    try {
      const response = await axios.post(`${OPENHANDS_API_URL}/v1/app-conversations`, {
        initial_message: {
          content: [
            {
              type: "text",
              text: `${task}. The project is hosted at https://github.com/chaosoracleforall-agent/chaos-oracle. Use the GITHUB_PAT from the env to push changes.`
            }
          ]
        }
      }, {
        headers: { 'Authorization': `Bearer ${process.env.OPENHANDS_AUTH_TOKEN || ''}` }
      });
      console.log("[DEEPSEEK_DEV_LOOP] Task created successfully. ID:", response.data.id);
    } catch (e: any) {
      console.error("[DEEPSEEK_DEV_LOOP_ERROR] VM link rejected.");
      if (e.response) {
        console.error(`Status: ${e.response.status} Data: ${JSON.stringify(e.response.data)}`);
      }
    }
  }

  async scanMentionsAndReply() {
    try {
      const params: any = { fid: 2854960 };
      if (this.lastFarcasterCursor) params.cursor = this.lastFarcasterCursor;

      const notifications = await axios.get('https://api.neynar.com/v2/farcaster/notifications', {
        params,
        headers: { 'x-api-key': NEYNAR_API_KEY }
      });

      const cursor = notifications.data.next?.cursor;
      if (cursor) this.lastFarcasterCursor = cursor;

      const mentions = (notifications.data.notifications || []).filter(
        (n: any) => (n.type === 'mention' || n.type === 'reply') && !this.processedFarcasterHashes.has(n.cast?.hash)
      );

      for (const notif of mentions.slice(0, 5)) {
        const cast = notif.cast;
        if (!cast?.text) continue;

        this.processedFarcasterHashes.add(cast.hash);
        // Cap the processed set to prevent unbounded growth
        if (this.processedFarcasterHashes.size > 1000) {
          const first = this.processedFarcasterHashes.values().next().value;
          if (first) this.processedFarcasterHashes.delete(first);
        }

        const replyText = await this.generateResponse(cast.author.fid.toString(), cast.text);
        console.log(`[FARCASTER] Replying to ${cast.author.username}: ${replyText.slice(0, 100)}...`);
        const replyHash = await this.postFarcasterCast(replyText, cast.hash);
        if (replyHash) {
          EngagementCollector.trackPost('farcaster', replyText, replyHash);
        }
      }
    } catch (e: any) {
      console.error("[BRAIN_SCAN_ERROR]: Farcaster link failed.", e.response?.status, e.response?.data?.message || e.message);
    }
  }

  async postFarcasterCast(text: string, replyTo?: string): Promise<string | null> {
    const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;
    if (!SIGNER_UUID) {
      console.warn("[FARCASTER] No NEYNAR_SIGNER_UUID set. Farcaster posting disabled.");
      return null;
    }
    try {
      // Farcaster non-Pro limit: 1024 chars, max 2 embeds (URLs count as embeds)
      let castText = text.slice(0, 1024);
      const urls = castText.match(/https?:\/\/[^\s)]+/g) || [];
      if (urls.length > 2) {
        for (let i = urls.length - 1; i >= 2; i--) {
          castText = castText.replace(urls[i], '').replace(/\s{2,}/g, ' ').trim();
        }
      }
      const body: any = { signer_uuid: SIGNER_UUID, text: castText };
      if (replyTo) {
        body.parent = replyTo;
      }
      const response = await axios.post('https://api.neynar.com/v2/farcaster/cast', body, {
        headers: { 'x-api-key': NEYNAR_API_KEY }
      });
      const castHash = response.data?.cast?.hash || null;
      console.log(`[FARCASTER] Cast posted (${castText.length} chars): ${castText.slice(0, 80)}...`);
      return castHash;
    } catch (e: any) {
      console.error("[FARCASTER] Post failed:", e.response?.status, e.response?.data?.message || e.message);
      return null;
    }
  }
}

export default new ChaosBrain();

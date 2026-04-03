import axios from 'axios';
import { generateContent, TaskType } from './modelRouter';
import EngagementCollector from './engagementCollector';
import { CANONICAL_URLS, repairAllUrls, validatePostBeforePublish } from './urlUtils';
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

// Internal-only caller IDs that must never come from external message handlers
const INTERNAL_ONLY_CALLERS = new Set(['SYSTEM_INTERNAL', 'CLAUDE_CODE', 'GEMINI_CLI']);

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
  private recentReplies: string[] = []; // Ring buffer for reply dedup

  isAuthorizedController(userId: string): boolean {
    return AUTHORIZED_CONTROLLERS.has(userId);
  }

  /**
   * Validate that internal-only caller IDs are not being spoofed from external input.
   * Call this before processing any message from external platforms (Twitter, Discord, Farcaster).
   */
  isExternalInputSafe(userId: string): boolean {
    if (INTERNAL_ONLY_CALLERS.has(userId)) {
      console.error(`[SECURITY] Blocked external message with reserved caller ID: ${userId}`);
      return false;
    }
    return true;
  }

  async generateResponse(userId: string, userMessage: string, taskType: TaskType = 'SOCIAL_POST') {
    // If the caller is NOT an internal-only caller, validate it's not spoofing one
    if (!INTERNAL_ONLY_CALLERS.has(userId) && !this.isExternalInputSafe(userId)) {
      return '[SYSTEM_ERROR]: Request blocked by security policy.';
    }

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
- Chaos Cards NFTs: prophecies, rekt certificates, tarot drops — mention when natural`;

    try {
      // Inject recent replies for dedup (only for actual user replies, not internal prompts)
      let promptWithDedup = sanitizedMessage;
      if (!INTERNAL_ONLY_CALLERS.has(userId) && this.recentReplies.length > 0) {
        const recentSnippets = this.recentReplies.slice(-10).map((r, i) => `${i + 1}. ${r.slice(0, 120)}`).join('\n');
        promptWithDedup += `\n\n[Your recent replies — avoid repeating similar themes/phrasing:\n${recentSnippets}]`;
      }

      const agentReply = await generateContent(taskType, systemPrompt, promptWithDedup);
      this.memory[userId].push(`Chaos Oracle: ${agentReply}`);

      // Track reply for dedup (only non-internal)
      if (!INTERNAL_ONLY_CALLERS.has(userId)) {
        this.recentReplies.push(agentReply);
        if (this.recentReplies.length > 30) this.recentReplies.shift();
      }

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
        // Like the mention as a proactive engagement signal
        await this.likeCast(cast.hash);
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
      // Repair URLs and validate before posting
      let castText = repairAllUrls(text).slice(0, 1024);
      if (!validatePostBeforePublish(castText, 'Farcaster')) {
        console.error('[FARCASTER] Post blocked due to broken URLs.');
        return null;
      }
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
  /**
   * Like a Farcaster cast via Neynar reaction API.
   */
  async likeCast(castHash: string): Promise<boolean> {
    const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;
    if (!SIGNER_UUID || !NEYNAR_API_KEY) return false;
    try {
      await axios.post('https://api.neynar.com/v2/farcaster/reaction', {
        signer_uuid: SIGNER_UUID,
        reaction_type: 'like',
        target: castHash,
      }, {
        headers: { 'x-api-key': NEYNAR_API_KEY }
      });
      console.log(`[FARCASTER] Liked cast ${castHash.slice(0, 10)}...`);
      return true;
    } catch (e: any) {
      // 409 = already liked, not an error
      if (e.response?.status === 409) return true;
      console.error(`[FARCASTER] Like failed:`, e.response?.status, e.response?.data?.message || e.message);
      return false;
    }
  }

  /**
   * Post a quote cast on Farcaster (embed another cast with commentary).
   */
  async quoteCast(targetCastHash: string, targetFid: number, commentary: string): Promise<string | null> {
    const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;
    if (!SIGNER_UUID) return null;
    try {
      let castText = repairAllUrls(commentary).slice(0, 1024);
      if (!validatePostBeforePublish(castText, 'Farcaster')) {
        console.error('[FARCASTER] Quote cast blocked due to broken URLs.');
        return null;
      }
      const body = {
        signer_uuid: SIGNER_UUID,
        text: castText,
        embeds: [{ cast_id: { fid: targetFid, hash: targetCastHash } }],
      };
      const response = await axios.post('https://api.neynar.com/v2/farcaster/cast', body, {
        headers: { 'x-api-key': NEYNAR_API_KEY }
      });
      const hash = response.data?.cast?.hash || null;
      console.log(`[FARCASTER] Quote cast posted: ${castText.slice(0, 80)}...`);
      return hash;
    } catch (e: any) {
      console.error('[FARCASTER] Quote cast failed:', e.response?.status, e.response?.data?.message || e.message);
      return null;
    }
  }
}

export default new ChaosBrain();

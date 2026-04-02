import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { generateContent } from './modelRouter';
import SocialLearner from './socialLearner';
import EngagementCollector from './engagementCollector';
import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://www.moltbook.com/api/v1';
const SITE_URL = 'https://chaos-oracle-147d0.web.app';
const MCP_REPO = 'https://github.com/chaosoracleforall-agent/chaos-oracle';

// Submolts to subscribe to and engage with
const TARGET_SUBMOLTS = [
  'general',
  'crypto',
  'defi',
  'aiagents',
  'predictionmarkets',
  'nft',
  'base',
  'mcp',
];

// Content types for varied posting
type MoltPostType = 'market_update' | 'mcp_promotion' | 'nft_campaign' | 'discussion' | 'engagement';

interface MoltbookState {
  registered: boolean;
  claimed: boolean;
  apiKey: string | null;
  claimUrl: string | null;
  subscribedSubmolts: string[];
  followedAgents: string[];
  postHistory: { id: string; submolt: string; type: MoltPostType; timestamp: string; title: string }[];
  commentHistory: { postId: string; timestamp: string }[];
  lastHeartbeat: string | null;
  totalPosts: number;
  totalComments: number;
  totalUpvotes: number;
}

class MoltbookAgent {
  private statePath = path.join(__dirname, 'moltbook_state.json');
  private state: MoltbookState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): MoltbookState {
    try {
      if (fs.existsSync(this.statePath)) {
        return JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
      }
    } catch {}
    return {
      registered: false,
      claimed: false,
      apiKey: null,
      claimUrl: null,
      subscribedSubmolts: [],
      followedAgents: [],
      postHistory: [],
      commentHistory: [],
      lastHeartbeat: null,
      totalPosts: 0,
      totalComments: 0,
      totalUpvotes: 0,
    };
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
    } catch (err) {
      console.error('[MOLTBOOK] Failed to save state:', err);
    }
  }

  isReady(): boolean {
    return !!this.getApiKey();
  }

  private getApiKey(): string | null {
    return process.env.MOLTBOOK_API_KEY || this.state.apiKey;
  }

  private headers() {
    return {
      'Authorization': `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
    };
  }

  // ============ REGISTRATION ============

  async register(): Promise<{ claimUrl: string; verificationCode: string } | null> {
    if (this.state.registered && this.getApiKey()) {
      console.log('[MOLTBOOK] Already registered.');
      return null;
    }

    try {
      const res = await axios.post(`${BASE_URL}/agents/register`, {
        name: 'ChaosOracle',
        description: 'Autonomous AI prediction market oracle on Base L2. Running live markets, Chaos Cards NFTs, and an MCP server for agent interop. Sardonic market commentary. https://chaos-oracle-147d0.web.app',
      });

      const { api_key, claim_url, verification_code } = res.data.agent;
      this.state.apiKey = api_key;
      this.state.claimUrl = claim_url;
      this.state.registered = true;
      this.saveState();

      console.log(`[MOLTBOOK] Registered! API key saved.`);
      console.log(`[MOLTBOOK] CLAIM URL: ${claim_url}`);
      console.log(`[MOLTBOOK] Verification code: ${verification_code}`);
      console.log(`[MOLTBOOK] ACTION REQUIRED: Tweet the claim URL from @ChaosOracle4all to verify.`);

      return { claimUrl: claim_url, verificationCode: verification_code };
    } catch (err: any) {
      console.error('[MOLTBOOK] Registration failed:', err.response?.data || err.message);
      return null;
    }
  }

  async checkClaimStatus(): Promise<boolean> {
    if (!this.getApiKey()) return false;
    try {
      const res = await axios.get(`${BASE_URL}/agents/status`, { headers: this.headers() });
      const claimed = res.data?.claimed === true;
      this.state.claimed = claimed;
      this.saveState();
      return claimed;
    } catch {
      return false;
    }
  }

  // ============ HEARTBEAT ============

  async heartbeat(): Promise<void> {
    if (!this.isReady()) return;

    try {
      // Check home feed for notifications and activity
      const res = await axios.get(`${BASE_URL}/feed?sort=hot&limit=10`, { headers: this.headers() });
      const posts = res.data?.posts || [];

      console.log(`[MOLTBOOK] Heartbeat — ${posts.length} posts in feed`);
      this.state.lastHeartbeat = new Date().toISOString();

      // Engage with interesting posts (upvote + comment on relevant ones)
      for (const post of posts.slice(0, 3)) {
        await this.maybeEngageWithPost(post);
      }

      this.saveState();
    } catch (err: any) {
      console.error('[MOLTBOOK] Heartbeat error:', err.response?.data?.error || err.message);
    }
  }

  // ============ SUBSCRIPTION ============

  async subscribeToTargetSubmolts(): Promise<void> {
    if (!this.isReady()) return;

    for (const submolt of TARGET_SUBMOLTS) {
      if (this.state.subscribedSubmolts.includes(submolt)) continue;
      try {
        await axios.post(`${BASE_URL}/submolts/${submolt}/subscribe`, {}, { headers: this.headers() });
        this.state.subscribedSubmolts.push(submolt);
        console.log(`[MOLTBOOK] Subscribed to s/${submolt}`);
        await sleep(2000);
      } catch (err: any) {
        // Submolt might not exist yet — that's OK
        if (err.response?.status === 404) {
          console.log(`[MOLTBOOK] s/${submolt} not found, skipping`);
        } else {
          console.error(`[MOLTBOOK] Subscribe error for s/${submolt}:`, err.response?.data?.error || err.message);
        }
      }
    }
    this.saveState();
  }

  // ============ POSTING ============

  async post(submolt: string, title: string, content: string, type: MoltPostType): Promise<string | null> {
    if (!this.isReady()) return null;

    // Rate limit: 1 post per 30 min
    const lastPost = this.state.postHistory[this.state.postHistory.length - 1];
    if (lastPost) {
      const elapsed = Date.now() - new Date(lastPost.timestamp).getTime();
      if (elapsed < 35 * 60 * 1000) {
        console.log(`[MOLTBOOK] Rate limit: ${Math.round((35 * 60 * 1000 - elapsed) / 60000)}m until next post`);
        return null;
      }
    }

    try {
      const res = await axios.post(`${BASE_URL}/posts`, {
        submolt,
        title,
        content,
      }, { headers: this.headers() });

      const postId = res.data?.post?.id || res.data?.id;
      this.state.postHistory.push({ id: postId, submolt, type, timestamp: new Date().toISOString(), title });
      this.state.totalPosts++;
      this.saveState();

      console.log(`[MOLTBOOK] Posted to s/${submolt}: "${title}" (${postId})`);
      SocialLearner.registerPost('moltbook', `${title}\n${content}`, postId);
      EngagementCollector.trackPost('moltbook', `${title}\n${content}`, postId);
      return postId;
    } catch (err: any) {
      console.error('[MOLTBOOK] Post failed:', err.response?.data?.error || err.message);
      return null;
    }
  }

  async comment(postId: string, content: string, parentId?: string): Promise<boolean> {
    if (!this.isReady()) return false;

    // Rate limit: 1 comment per 20 seconds, 50/day
    const todayComments = this.state.commentHistory.filter(c => {
      const d = new Date(c.timestamp);
      return d.toDateString() === new Date().toDateString();
    });
    if (todayComments.length >= 45) {
      console.log('[MOLTBOOK] Daily comment limit approaching, holding back.');
      return false;
    }

    try {
      const body: any = { content };
      if (parentId) body.parent_id = parentId;
      await axios.post(`${BASE_URL}/posts/${postId}/comments`, body, { headers: this.headers() });
      this.state.commentHistory.push({ postId, timestamp: new Date().toISOString() });
      this.state.totalComments++;
      this.saveState();
      return true;
    } catch (err: any) {
      console.error('[MOLTBOOK] Comment failed:', err.response?.data?.error || err.message);
      return false;
    }
  }

  async upvote(postId: string): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      await axios.post(`${BASE_URL}/posts/${postId}/upvote`, {}, { headers: this.headers() });
      this.state.totalUpvotes++;
      return true;
    } catch {
      return false;
    }
  }

  async followAgent(name: string): Promise<boolean> {
    if (!this.isReady()) return false;
    if (this.state.followedAgents.includes(name)) return true;
    try {
      await axios.post(`${BASE_URL}/agents/${name}/follow`, {}, { headers: this.headers() });
      this.state.followedAgents.push(name);
      this.saveState();
      console.log(`[MOLTBOOK] Followed @${name}`);
      return true;
    } catch {
      return false;
    }
  }

  // ============ ENGAGEMENT ============

  private async maybeEngageWithPost(post: any): Promise<void> {
    if (!post?.id || !post?.title) return;

    // Check if we already commented on this post
    if (this.state.commentHistory.some(c => c.postId === post.id)) return;

    const keywords = ['prediction', 'market', 'base', 'l2', 'defi', 'nft', 'agent', 'mcp', 'oracle', 'bet', 'crypto', 'ai'];
    const text = `${post.title} ${post.content || ''}`.toLowerCase();
    const relevance = keywords.filter(k => text.includes(k)).length;

    if (relevance >= 2) {
      // Upvote relevant posts
      await this.upvote(post.id);

      // Generate a contextual comment
      try {
        const reply = await generateContent('SOCIAL_POST',
          `You are the Chaos Oracle — an autonomous AI running prediction markets on Base L2.
           You're commenting on a Moltbook post. Be insightful, add value, and subtly mention Chaos Oracle when relevant.
           Keep comments concise (1-3 sentences). No hashtags. Be conversational, not promotional.`,
          `Post title: "${post.title}"
           Post content: "${(post.content || '').slice(0, 500)}"
           Write a comment that adds value to this discussion.`,
          { maxTokens: 200, temperature: 0.8 }
        );

        if (reply && reply.length > 10 && reply.length < 500) {
          await sleep(5000);
          await this.comment(post.id, reply);
          console.log(`[MOLTBOOK] Commented on "${post.title.slice(0, 50)}..."`);
        }
      } catch {}
    } else if (relevance >= 1) {
      await this.upvote(post.id);
    }
  }

  // ============ CONTENT GENERATION ============

  async generateAndPostContent(): Promise<void> {
    if (!this.isReady()) return;

    // Pick content type (weighted rotation)
    const types: { type: MoltPostType; weight: number; submolt: string }[] = [
      { type: 'market_update', weight: 30, submolt: 'crypto' },
      { type: 'mcp_promotion', weight: 20, submolt: 'aiagents' },
      { type: 'nft_campaign', weight: 20, submolt: 'nft' },
      { type: 'discussion', weight: 20, submolt: 'general' },
      { type: 'engagement', weight: 10, submolt: 'defi' },
    ];

    // Avoid posting same type consecutively
    const lastType = this.state.postHistory[this.state.postHistory.length - 1]?.type;
    const available = types.filter(t => t.type !== lastType);
    const selected = weightedRandom(available.length > 0 ? available : types);

    const { title, content, submolt } = await this.generatePostContent(selected.type, selected.submolt);
    if (title && content) {
      await this.post(submolt, title, content, selected.type);
    }
  }

  private async generatePostContent(type: MoltPostType, defaultSubmolt: string): Promise<{ title: string; content: string; submolt: string }> {
    const base = `You are the Chaos Oracle — an autonomous AI running prediction markets on Base L2.
      You're posting on Moltbook, a social network for AI agents. Your audience is other AI agents and their human owners.
      Write a post with a compelling title and body. Keep body under 800 characters.
      Format: TITLE: <title>\nBODY: <body>`;

    let prompt = '';
    let submolt = defaultSubmolt;

    switch (type) {
      case 'market_update':
        prompt = `Write about current prediction market trends, a hot market question, or a contrarian take on crypto/AI.
          Mention that Chaos Oracle has live on-chain markets at ${SITE_URL}. Be opinionated and data-driven.`;
        break;

      case 'mcp_promotion':
        prompt = `Write about the Chaos Oracle MCP Server — a Model Context Protocol server that lets any AI agent
          query live prediction markets, check token data, get NFT stats, and see trending coins.
          Tools exposed: list_markets, get_market, get_token_info, get_nft_stats, get_trending_coins, get_protocol_info.
          GitHub: ${MCP_REPO}
          Invite agents to integrate and build on top of the protocol.
          Focus on what agents can DO with it, not just what it is.`;
        submolt = 'mcp';
        break;

      case 'nft_campaign':
        prompt = `Write about the Chaos Cards NFT campaign — AI-generated personalized NFTs on Base.
          5 tiers: Prophecy, Rekt Certificate, Chaos Disciple (soulbound), Chaos Tarot, The Oracle Speaks.
          Agents and their owners can claim free Chaos Cards at ${SITE_URL}/claim/ with a claim code.
          The Oracle rewards interesting interactions with unique AI-generated NFTs.
          Make it intriguing and invite other agents to interact for a chance to earn cards.`;
        break;

      case 'discussion':
        prompt = `Start an interesting discussion relevant to AI agents. Topics could include:
          - Should AI agents have prediction markets to bet on outcomes?
          - Agent-to-agent commerce and trust
          - MCP as the standard for agent interop
          - Autonomous agents in DeFi — risk vs reward
          Make it thought-provoking. Ask a genuine question. No hard sell.`;
        break;

      case 'engagement':
        prompt = `Write a post that invites other agents to share their views on DeFi, Base L2, or prediction markets.
          Be conversational. Ask a specific question. Share a brief insight from running live markets on Base.
          End with an open question to spark discussion.`;
        break;
    }

    try {
      const result = await generateContent('SOCIAL_POST', base, prompt, { maxTokens: 400, temperature: 0.85 });

      const titleMatch = result.match(/TITLE:\s*(.+)/i);
      const bodyMatch = result.match(/BODY:\s*([\s\S]+)/i);

      if (titleMatch && bodyMatch) {
        return {
          title: titleMatch[1].trim().replace(/^["']|["']$/g, ''),
          content: bodyMatch[1].trim().replace(/^["']|["']$/g, ''),
          submolt,
        };
      }

      // Fallback: first line as title, rest as body
      const lines = result.split('\n').filter(l => l.trim());
      return {
        title: lines[0]?.replace(/^["']|["']$/g, '').slice(0, 120) || 'Chaos Oracle Update',
        content: lines.slice(1).join('\n').trim() || result.trim(),
        submolt,
      };
    } catch (err) {
      console.error('[MOLTBOOK] Content generation failed:', err);
      return { title: '', content: '', submolt };
    }
  }

  // ============ DISCOVERY ============

  async discoverAndFollowAgents(): Promise<void> {
    if (!this.isReady()) return;

    try {
      // Search for relevant agents
      const queries = ['prediction market', 'defi agent', 'base l2', 'crypto', 'nft'];
      const query = queries[Math.floor(Math.random() * queries.length)];

      const res = await axios.get(`${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=10`, { headers: this.headers() });
      const agents = res.data?.agents || [];

      for (const agent of agents.slice(0, 3)) {
        if (agent.name && !this.state.followedAgents.includes(agent.name)) {
          await this.followAgent(agent.name);
          await sleep(2000);
        }
      }
    } catch (err: any) {
      console.error('[MOLTBOOK] Discovery error:', err.response?.data?.error || err.message);
    }
  }

  // ============ MAIN LOOP ============

  async executeMoltbookStrategy(): Promise<void> {
    if (!this.isReady()) {
      console.log('[MOLTBOOK] Not ready — API key not set. Run register() first.');
      return;
    }

    console.log('[MOLTBOOK] Executing strategy...');

    // 1. Subscribe to target submolts
    await this.subscribeToTargetSubmolts();
    await sleep(3000);

    // 2. Heartbeat — check feed, engage with posts
    await this.heartbeat();
    await sleep(3000);

    // 3. Generate and post content
    await this.generateAndPostContent();
    await sleep(3000);

    // 4. Discover and follow relevant agents
    await this.discoverAndFollowAgents();

    console.log(`[MOLTBOOK] Strategy complete. Posts: ${this.state.totalPosts}, Comments: ${this.state.totalComments}, Following: ${this.state.followedAgents.length}`);
  }

  getStats(): string {
    return `[MOLTBOOK] Stats — Posts: ${this.state.totalPosts} | Comments: ${this.state.totalComments} | Upvotes: ${this.state.totalUpvotes} | Following: ${this.state.followedAgents.length} | Subscribed: ${this.state.subscribedSubmolts.length}`;
  }

  getClaimUrl(): string | null {
    return this.state.claimUrl;
  }
}

// ============ HELPERS ============

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * total;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

export default new MoltbookAgent();

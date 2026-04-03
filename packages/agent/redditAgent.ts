import Snoowrap from 'snoowrap';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { generateContent } from './modelRouter';
import { CANONICAL_URLS, validatePostBeforePublish } from './urlUtils';
import * as dotenv from 'dotenv';
dotenv.config();

// Target subreddits organized by category and relevance
const TARGET_SUBREDDITS: Record<string, { subs: string[]; description: string }> = {
  base_ecosystem: {
    subs: ['base', 'BaseChain', 'buildOnBase'],
    description: 'Base L2 ecosystem — core audience for Chaos Oracle',
  },
  prediction_markets: {
    subs: ['PredictionMarkets', 'Polymarket', 'predictit'],
    description: 'Prediction market communities — direct competitors/collaborators',
  },
  defi: {
    subs: ['defi', 'DeFi_Yield', 'layer2'],
    description: 'DeFi and L2 finance — users familiar with on-chain betting',
  },
  crypto_general: {
    subs: ['CryptoCurrency', 'altcoin', 'CryptoTechnology'],
    description: 'General crypto communities — broad reach',
  },
  ai_crypto: {
    subs: ['ArtificialIntelligence', 'singularity', 'autonomous_agents'],
    description: 'AI and autonomous agent communities — tech angle',
  },
  degen: {
    subs: ['CryptoMoonShots', 'SatoshiStreetBets', 'wallstreetbetscrypto'],
    description: 'Degen/speculative communities — high engagement, meme-friendly',
  },
};

// Post types to keep content varied and avoid spam detection
type PostType = 'discussion' | 'analysis' | 'announcement' | 'comment_engagement';

interface RedditState {
  lastPostPerSubreddit: Record<string, string>; // subreddit -> ISO timestamp
  totalPosts: number;
  totalComments: number;
  postHistory: { subreddit: string; title: string; type: PostType; timestamp: string; id?: string }[];
  bannedSubreddits: string[]; // Track subs we got banned from
}

class RedditAgent {
  private client: Snoowrap | null = null;
  private statePath = path.join(__dirname, 'reddit_state.json');
  private state: RedditState;

  // Reddit self-promotion rule: max 1 post per subreddit per 24h
  private MIN_POST_INTERVAL_MS = 24 * 60 * 60 * 1000;
  // Global cooldown between any Reddit action to avoid rate limits
  private ACTION_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between actions

  constructor() {
    this.state = this.loadState();
    this.initClient();
  }

  private loadVaultCredentials(): Record<string, string> | null {
    const vaultPath = path.join(__dirname, 'reddit_vault.enc');
    const vaultPassword = process.env.VAULT_PASSWORD;
    if (!fs.existsSync(vaultPath) || !vaultPassword) return null;

    try {
      // Use argument-safe execution to avoid shell interpolation risks.
      const result = spawnSync(
        'openssl',
        ['enc', '-aes-256-cbc', '-pbkdf2', '-d', '-pass', `pass:${vaultPassword}`, '-in', vaultPath],
        { encoding: 'utf8' }
      );
      if (result.status !== 0 || !result.stdout) {
        throw new Error(result.stderr || 'OpenSSL decryption failed');
      }
      const decrypted = result.stdout;
      const creds: Record<string, string> = {};
      for (const line of decrypted.split('\n')) {
        const eq = line.indexOf('=');
        if (eq > 0) creds[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      }
      return creds;
    } catch {
      console.error('[REDDIT_AGENT] Failed to decrypt reddit_vault.enc');
      return null;
    }
  }

  private initClient() {
    // Priority: env vars > encrypted vault > Devvit token file
    let clientId = process.env.REDDIT_CLIENT_ID;
    let clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    let refreshToken = process.env.REDDIT_REFRESH_TOKEN;
    let username = process.env.REDDIT_USERNAME;
    let password = process.env.REDDIT_PASSWORD;

    // Try vault if env vars are missing
    if (!clientId || (!refreshToken && !password)) {
      const vault = this.loadVaultCredentials();
      if (vault) {
        clientId = clientId || vault.REDDIT_CLIENT_ID;
        refreshToken = refreshToken || vault.REDDIT_REFRESH_TOKEN;
        username = username || vault.REDDIT_USERNAME;
        password = password || vault.REDDIT_PASSWORD;
        console.log('[REDDIT_AGENT] Loaded credentials from encrypted vault.');
      }
    }

    // Try Devvit token file as last resort
    if (!clientId || !refreshToken) {
      const devvitTokenPath = path.join(process.env.HOME || '', '.devvit', 'token');
      if (fs.existsSync(devvitTokenPath)) {
        try {
          const raw = JSON.parse(fs.readFileSync(devvitTokenPath, 'utf8'));
          const inner = JSON.parse(Buffer.from(raw.token, 'base64').toString('utf8'));
          refreshToken = refreshToken || inner.refreshToken;
          // Extract client ID from JWT payload
          if (!clientId && inner.accessToken) {
            const payload = JSON.parse(Buffer.from(inner.accessToken.split('.')[1], 'base64').toString('utf8'));
            clientId = payload.cid;
          }
          console.log('[REDDIT_AGENT] Loaded credentials from Devvit token.');
        } catch {
          console.warn('[REDDIT_AGENT] Failed to parse Devvit token file.');
        }
      }
    }

    if (!clientId) {
      console.warn('[REDDIT_AGENT] No Reddit credentials found. Set env vars, vault, or Devvit token.');
      return;
    }

    // Prefer refresh token auth (from Devvit), fallback to username/password
    const snoowrapConfig: any = {
      userAgent: `ChaosOracleBot/1.0.0 (by /u/${username || 'ChaosOracle'})`,
      clientId,
      clientSecret,
    };

    if (refreshToken) {
      snoowrapConfig.refreshToken = refreshToken;
    } else if (username && password) {
      snoowrapConfig.username = username;
      snoowrapConfig.password = password;
    } else {
      console.warn('[REDDIT_AGENT] No refresh token or username/password. Cannot authenticate.');
      return;
    }

    this.client = new Snoowrap(snoowrapConfig);

    // Configure rate limiting
    this.client.config({ requestDelay: 2000, continueAfterRatelimitError: true });
    console.log(`[REDDIT_AGENT] Initialized as /u/${username || 'ChaosOracle'}`);
  }

  private loadState(): RedditState {
    try {
      if (fs.existsSync(this.statePath)) {
        const loaded = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
        // Migration guards for older state files
        if (!loaded.lastPostPerSubreddit) loaded.lastPostPerSubreddit = {};
        if (!Array.isArray(loaded.postHistory)) loaded.postHistory = [];
        if (!Array.isArray(loaded.bannedSubreddits)) loaded.bannedSubreddits = [];
        if (typeof loaded.totalPosts !== 'number') loaded.totalPosts = 0;
        if (typeof loaded.totalComments !== 'number') loaded.totalComments = 0;
        return loaded;
      }
    } catch (err) {
      console.warn('[REDDIT_AGENT] Failed to load state file:', err instanceof Error ? err.message : err);
    }
    return {
      lastPostPerSubreddit: {},
      totalPosts: 0,
      totalComments: 0,
      postHistory: [],
      bannedSubreddits: [],
    };
  }

  private saveState() {
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  // Evaluate which subreddits are appropriate for a given topic
  async evaluateSubreddits(): Promise<string[]> {
    const now = Date.now();
    const eligible: string[] = [];

    for (const category of Object.values(TARGET_SUBREDDITS)) {
      for (const sub of category.subs) {
        // Skip banned subreddits
        if (this.state.bannedSubreddits.includes(sub)) continue;

        // Check cooldown per subreddit
        const lastPost = this.state.lastPostPerSubreddit[sub];
        if (lastPost && now - new Date(lastPost).getTime() < this.MIN_POST_INTERVAL_MS) continue;

        eligible.push(sub);
      }
    }

    return eligible;
  }

  // Pick the best subreddit for the current post based on rotation and category
  private pickSubreddit(eligible: string[]): string | null {
    if (eligible.length === 0) return null;

    // Prioritize subreddits we haven't posted to recently
    const neverPosted = eligible.filter(s => !this.state.lastPostPerSubreddit[s]);
    if (neverPosted.length > 0) {
      return neverPosted[Math.floor(Math.random() * neverPosted.length)];
    }

    // Otherwise pick the one with the oldest last post
    return eligible.sort((a, b) => {
      const aTime = new Date(this.state.lastPostPerSubreddit[a] || 0).getTime();
      const bTime = new Date(this.state.lastPostPerSubreddit[b] || 0).getTime();
      return aTime - bTime;
    })[0];
  }

  // Determine which category a subreddit belongs to
  private getSubredditCategory(sub: string): string {
    for (const [category, data] of Object.entries(TARGET_SUBREDDITS)) {
      if (data.subs.includes(sub)) return category;
    }
    return 'crypto_general';
  }

  // Whether the account is still in warmup phase (fewer than 15 posts — build karma first)
  private isWarmupPhase(): boolean {
    return this.state.totalPosts + this.state.totalComments < 15;
  }

  // Call model router with a Reddit-appropriate persona (NOT the ChaosBrain toxic persona)
  private async callLLM(prompt: string): Promise<string> {
    const systemPrompt = `You are a knowledgeable crypto and DeFi enthusiast who participates genuinely on Reddit.
You are interested in prediction markets, AI agents, and the Base L2 ecosystem.
You have a dry, slightly sarcastic wit but you are NOT aggressive, toxic, or spammy.
You write like a real Reddit user — casual, knowledgeable, opinionated but respectful.
CRITICAL RULES:
- Never use all caps for emphasis. Never use terminal/hacker aesthetics.
- Never include character counts, toxicity scores, or meta-commentary about the post itself.
- Never use phrases like "DYOR", "NFA", "not financial advice" — they scream bot.
- Write naturally. Use paragraphs. Sound human.`;

    try {
      return await generateContent('SOCIAL_POST', systemPrompt, prompt);
    } catch (error: any) {
      console.error('[REDDIT_AGENT] LLM call failed:', error.message);
      return '';
    }
  }

  // Generate Reddit-appropriate content — no forced links, natural tone
  private async generatePost(subreddit: string, postType: PostType): Promise<{ title: string; body: string }> {
    const category = this.getSubredditCategory(subreddit);
    const categoryInfo = TARGET_SUBREDDITS[category];
    const warmup = this.isWarmupPhase();

    const recentPosts = this.state.postHistory
      .filter(p => p.subreddit === subreddit)
      .slice(-3)
      .map(p => p.title)
      .join(', ');

    const linkNote = warmup
      ? 'Do NOT include any links or project names. Just share genuine thoughts.'
      : 'You may mention Chaos Oracle briefly if relevant, but do NOT force it. Only include a link if it genuinely adds value — most posts should not have links.';

    const prompts: Record<PostType, string> = {
      discussion: `Write a Reddit discussion post for r/${subreddit} (${categoryInfo?.description || ''}).
Topic area: prediction markets, AI agents in crypto, or the Base ecosystem.
Write a compelling title (as a question or interesting take) and a body that invites discussion.
${linkNote}
${recentPosts ? `Avoid similar topics to: ${recentPosts}` : ''}
Format:
TITLE: [title]
BODY: [body]`,

      analysis: `Write an analytical Reddit post for r/${subreddit}.
Share a genuine insight or observation about prediction markets, on-chain AI agents, or Base L2 trends.
Include specific data points, comparisons, or reasoning that adds value.
${linkNote}
${recentPosts ? `Avoid similar topics to: ${recentPosts}` : ''}
Format:
TITLE: [title]
BODY: [body]`,

      announcement: `Write a Reddit post for r/${subreddit} about Chaos Oracle, an AI-powered prediction market on Base.
Focus on what makes it technically interesting: autonomous AI agent, on-chain markets, token burn mechanics.
Be informative and genuine — Reddit downvotes pure shilling.
You may include ${CANONICAL_URLS.site} and Discord ${CANONICAL_URLS.discord} since this is an announcement.
${recentPosts ? `Avoid similar topics to: ${recentPosts}` : ''}
Format:
TITLE: [title]
BODY: [body]`,

      comment_engagement: `Write a helpful Reddit comment for r/${subreddit} about prediction markets, Base, or AI in crypto.
Be genuinely helpful and add to the conversation.
${warmup ? 'Do NOT mention any projects or links.' : 'You may briefly mention Chaos Oracle only if directly relevant.'}
Keep it under 400 characters.
Format:
BODY: [comment]`,
    };

    const response = await this.callLLM(prompts[postType]);
    if (!response) {
      return { title: '', body: '' };
    }

    // Model router already strips <think> tags
    const cleaned = response.trim();

    const titleMatch = cleaned.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const bodyMatch = cleaned.match(/BODY:\s*([\s\S]+)/);

    return {
      title: titleMatch?.[1]?.trim() || '',
      body: bodyMatch?.[1]?.trim() || cleaned,
    };
  }

  // Main posting function — called by the agent loop
  async executeRedditStrategy() {
    if (!this.client) {
      console.warn('[REDDIT_AGENT] Not initialized. Skipping.');
      return;
    }

    try {
      const eligible = await this.evaluateSubreddits();
      if (eligible.length === 0) {
        console.log('[REDDIT_AGENT] All subreddits on cooldown. Skipping.');
        return;
      }

      const subreddit = this.pickSubreddit(eligible);
      if (!subreddit) return;

      // During warmup: mostly comment engagement to build karma (no links)
      // After warmup: mix of post types, announcements are rare
      const rand = Math.random();
      let postType: PostType;
      if (this.isWarmupPhase()) {
        // 70% comments, 20% discussion (no links), 10% analysis (no links)
        postType = rand < 0.7 ? 'comment_engagement' : rand < 0.9 ? 'discussion' : 'analysis';
      } else {
        // 35% discussion, 30% analysis, 20% comment, 15% announcement
        postType = rand < 0.35 ? 'discussion' : rand < 0.65 ? 'analysis' : rand < 0.85 ? 'comment_engagement' : 'announcement';
      }

      console.log(`[REDDIT_AGENT] Posting ${postType} to r/${subreddit}...`);
      const content = await this.generatePost(subreddit, postType);

      if (!content.body) {
        console.warn('[REDDIT_AGENT] LLM returned empty content. Skipping.');
        return;
      }

      if (postType === 'comment_engagement') {
        if (!validatePostBeforePublish(content.body, 'Reddit')) {
          console.warn('[REDDIT_AGENT] Comment blocked due to broken URLs.');
          return;
        }
        await this.engageWithComments(subreddit, content.body);
      } else if (!content.title) {
        console.warn('[REDDIT_AGENT] LLM returned empty title. Skipping post.');
        return;
      } else {
        if (!validatePostBeforePublish(content.body, 'Reddit')) {
          console.warn('[REDDIT_AGENT] Post blocked due to broken URLs.');
          return;
        }
        await this.submitPost(subreddit, content.title, content.body, postType);
      }
    } catch (error: any) {
      if (error.message?.includes('BANNED') || error.message?.includes('banned')) {
        const sub = error.subreddit || 'unknown';
        console.error(`[REDDIT_AGENT] Banned from r/${sub}. Adding to blocklist.`);
        if (!this.state.bannedSubreddits.includes(sub)) {
          this.state.bannedSubreddits.push(sub);
          this.saveState();
        }
      } else {
        console.error('[REDDIT_AGENT] Strategy execution failed:', error.message || error);
      }
    }
  }

  private async submitPost(subreddit: string, title: string, body: string, postType: PostType) {
    if (!this.client) return;

    try {
      const post = await (this.client.submitSelfpost({ subredditName: subreddit, title, text: body }) as any);

      console.log(`[REDDIT_AGENT] Posted to r/${subreddit}: "${title}"`);

      this.state.lastPostPerSubreddit[subreddit] = new Date().toISOString();
      this.state.totalPosts++;
      this.state.postHistory.push({
        subreddit,
        title,
        type: postType,
        timestamp: new Date().toISOString(),
        id: (post as any).name,
      });

      // Keep history to last 100 entries
      if (this.state.postHistory.length > 100) {
        this.state.postHistory = this.state.postHistory.slice(-100);
      }

      this.saveState();
    } catch (error: any) {
      if (error.message?.includes('SUBREDDIT_NOTALLOWED') || error.message?.includes('banned')) {
        (error as any).subreddit = subreddit;
      }
      throw error;
    }
  }

  // Find trending posts in a subreddit and leave insightful comments
  private async engageWithComments(subreddit: string, commentText: string) {
    if (!this.client) return;

    try {
      const sub = this.client.getSubreddit(subreddit);
      const hot = await sub.getHot({ limit: 10 });

      // Find a relevant post to comment on
      const relevantPost = hot.find((post: any) => {
        const title = post.title.toLowerCase();
        return title.includes('prediction') || title.includes('market') ||
               title.includes('base') || title.includes('ai') ||
               title.includes('agent') || title.includes('defi') ||
               title.includes('oracle') || title.includes('bet');
      });

      if (relevantPost) {
        await (relevantPost as any).reply(commentText);
        this.state.totalComments++;
        console.log(`[REDDIT_AGENT] Commented on r/${subreddit}: "${(relevantPost as any).title}"`);
        this.saveState();
      } else {
        console.log(`[REDDIT_AGENT] No relevant posts found in r/${subreddit} for comment engagement.`);
      }
    } catch (error: any) {
      console.error(`[REDDIT_AGENT] Comment engagement failed in r/${subreddit}:`, error.message);
    }
  }

  // Scan for mentions of Chaos Oracle across Reddit and respond
  async scanAndRespond() {
    if (!this.client) return;

    try {
      const results = await this.client.search({
        query: '"chaos oracle" OR "chaos-oracle" OR "$CHAOS prediction"',
        sort: 'new',
        time: 'day',
        limit: 10,
      });

      for (const post of results) {
        const already = this.state.postHistory.some(p => p.id === (post as any).name);
        if (already) continue;

        // Generate a contextual reply using Reddit-appropriate tone
        const reply = await this.callLLM(
          `Someone on Reddit mentioned Chaos Oracle (an AI prediction market on Base). Their post title: "${(post as any).title}"
Write a brief, helpful reply. Be genuine, add value, and engage constructively.
If they have questions, answer them. Keep it under 400 characters.
Format:
BODY: [your reply]`);
        const replyBody = reply.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^BODY:\s*/i, '').trim();
        if (!replyBody) continue;

        try {
          await (post as any).reply(replyBody);
          this.state.totalComments++;
          this.state.postHistory.push({
            subreddit: (post as any).subreddit_name_prefixed,
            title: `[Reply] ${(post as any).title}`,
            type: 'comment_engagement',
            timestamp: new Date().toISOString(),
            id: (post as any).name,
          });
          console.log(`[REDDIT_AGENT] Replied to mention: "${(post as any).title}"`);
        } catch (replyErr: any) {
          console.error(`[REDDIT_AGENT] Reply failed:`, replyErr.message);
        }
      }

      this.saveState();
    } catch (error: any) {
      console.error('[REDDIT_AGENT] Scan failed:', error.message);
    }
  }

  // Check inbox for moderator messages, removal notices, and replies.
  // Processes up to 25 most recent unread messages per call (Snoowrap first-page limit).
  async checkInboxAndModmail(): Promise<{ messages: number; actions: string[] }> {
    if (!this.client) return { messages: 0, actions: [] };
    const actions: string[] = [];

    try {
      const inbox = await (this.client as any).getUnreadMessages({ limit: 25 });
      // Convert Snoowrap Listing to array to avoid lazy-loading issues
      const messages = Array.isArray(inbox) ? inbox : [...inbox];
      let messageCount = 0;

      for (const msg of messages) {
        messageCount++;
        const subject = (msg.subject || '').toLowerCase();
        const body = (msg.body || '').toLowerCase();
        const author = msg.author?.name || msg.distinguished || 'unknown';
        const subreddit = msg.subreddit_name_prefixed || msg.subreddit || '';

        // Detect moderator removal notices
        if (subject.includes('removed') || subject.includes('removal') ||
            body.includes('has been removed') || body.includes('was removed') ||
            author === 'AutoModerator') {
          console.log(`[REDDIT_AGENT] Post removal detected in ${subreddit}: ${msg.subject}`);
          actions.push(`REMOVAL: ${subreddit} — "${msg.subject}"`);

          if (subreddit) {
            const subName = subreddit.replace(/^r\//, '');
            // Track cumulative removals (across calls) via state history
            const priorRemovals = this.state.postHistory
              .filter(p => p.subreddit === subName && p.title.startsWith('[REMOVED]'))
              .length;
            if (priorRemovals >= 2 && !this.state.bannedSubreddits.includes(subName)) {
              this.state.bannedSubreddits.push(subName);
              console.log(`[REDDIT_AGENT] Auto-banned from r/${subName} after repeated removals.`);
              actions.push(`AUTO_BAN: r/${subName}`);
            }
            // Record removal in post history for future tracking
            this.state.postHistory.push({
              subreddit: subName, title: `[REMOVED] ${msg.subject}`,
              type: 'comment_engagement', timestamp: new Date().toISOString(),
            });
          }

          try { await (msg as any).markAsRead(); } catch (err) { console.warn('[REDDIT_AGENT] Failed to mark message as read:', err instanceof Error ? err.message : err); }
          continue;
        }

        // Detect ban notifications
        if (subject.includes('ban') || subject.includes('suspended')) {
          console.log(`[REDDIT_AGENT] Ban/suspension notice: ${msg.subject} from ${subreddit}`);
          actions.push(`BAN: ${subreddit} — "${msg.subject}"`);
          if (subreddit) {
            const subName = subreddit.replace(/^r\//, '');
            if (!this.state.bannedSubreddits.includes(subName)) {
              this.state.bannedSubreddits.push(subName);
            }
          }
          try { await (msg as any).markAsRead(); } catch (err) { console.warn('[REDDIT_AGENT] Failed to mark message as read:', err instanceof Error ? err.message : err); }
          continue;
        }

        // Detect moderator warnings or rule violations
        if (body.includes('rule') || body.includes('warning') || body.includes('spam') ||
            body.includes('self-promotion') || body.includes('guidelines')) {
          console.log(`[REDDIT_AGENT] Mod warning from ${subreddit}: ${msg.subject}`);
          actions.push(`MOD_WARNING: ${subreddit} — "${msg.subject}": ${body.slice(0, 200)}`);
          try { await (msg as any).markAsRead(); } catch (err) { console.warn('[REDDIT_AGENT] Failed to mark message as read:', err instanceof Error ? err.message : err); }
          continue;
        }

        // Regular messages / comment replies — generate a contextual response
        if (msg.was_comment || subject.includes('comment reply') || subject.includes('post reply')) {
          try {
            const replyText = await this.callLLM(
              `Someone replied to your Reddit comment/post. Their message: "${body.slice(0, 500)}"
Context: This was in ${subreddit || 'unknown subreddit'}.
Write a brief, helpful, and genuine reply. Be casual, like a real Redditor.
Keep it under 300 characters.
Format:
BODY: [your reply]`
            );
            const cleanReply = replyText.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^BODY:\s*/i, '').trim();
            if (cleanReply) {
              await (msg as any).reply(cleanReply);
              actions.push(`REPLIED: ${subreddit} — "${body.slice(0, 80)}..."`);
              this.state.totalComments++;
            }
          } catch (replyErr: any) {
            console.error(`[REDDIT_AGENT] Inbox reply failed:`, replyErr.message);
          }
          try { await (msg as any).markAsRead(); } catch (err) { console.warn('[REDDIT_AGENT] Failed to mark message as read:', err instanceof Error ? err.message : err); }
        }
      }

      if (messageCount > 0) {
        console.log(`[REDDIT_AGENT] Processed ${messageCount} inbox messages. Actions: ${actions.length}`);
      }
      this.saveState();
      return { messages: messageCount, actions };
    } catch (error: any) {
      console.error('[REDDIT_AGENT] Inbox check failed:', error.message);
      return { messages: 0, actions };
    }
  }

  // Verify recent posts are still live (not silently removed).
  // Checks the 5 most recent non-comment posts for removal status.
  async verifyRecentPosts(): Promise<string[]> {
    if (!this.client) return [];
    const issues: string[] = [];

    try {
      const recentPosts = this.state.postHistory
        .filter(p => p.id && p.type !== 'comment_engagement')
        .slice(-5);

      for (const post of recentPosts) {
        try {
          // Normalize ID: strip 't3_' prefix if present (Snoowrap stores full names)
          const submissionId = (post.id || '').replace(/^t3_/, '');
          if (!submissionId) continue;

          const submission = this.client!.getSubmission(submissionId);
          const data = await (submission as any).fetch();

          // Check if the submission was actually fetched (deleted posts return sparse objects)
          if (!data || !data.title) {
            issues.push(`GONE: r/${post.subreddit} — "${post.title}" (deleted or inaccessible)`);
            continue;
          }

          if (data.removed_by_category || data.removed || data.spam) {
            issues.push(`REMOVED: r/${post.subreddit} — "${post.title}" (${data.removed_by_category || 'unknown reason'})`);
            console.log(`[REDDIT_AGENT] Post removed: r/${post.subreddit} — "${post.title}"`);
          }
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 403) {
            issues.push(`GONE: r/${post.subreddit} — "${post.title}" (${err.statusCode})`);
          }
          // Other errors: skip silently (network issues, rate limits)
        }
      }

      if (issues.length > 0) {
        console.log(`[REDDIT_AGENT] Post verification found ${issues.length} issues`);
      }
      return issues;
    } catch (error: any) {
      console.error('[REDDIT_AGENT] Post verification failed:', error.message);
      return [];
    }
  }

  // Get a summary of Reddit activity
  getStats(): string {
    return [
      `[REDDIT_AGENT] Stats:`,
      `  Total posts: ${this.state.totalPosts}`,
      `  Total comments: ${this.state.totalComments}`,
      `  Banned from: ${this.state.bannedSubreddits.length > 0 ? this.state.bannedSubreddits.join(', ') : 'none'}`,
      `  Last 5 posts: ${this.state.postHistory.slice(-5).map(p => `r/${p.subreddit}`).join(', ') || 'none'}`,
    ].join('\n');
  }

  isReady(): boolean {
    return this.client !== null;
  }
}

export default new RedditAgent();

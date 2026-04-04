import * as fs from 'fs';
import * as path from 'path';
import { generateContent } from './modelRouter';
import ContentStrategy from './contentStrategy';
import * as dotenv from 'dotenv';
dotenv.config();

interface EngagementMetric {
  platform: 'twitter' | 'farcaster' | 'discord' | 'reddit';
  content: string;
  timestamp: string;
  engagement: {
    likes: number;
    replies: number;
    reposts: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
}

type PostFormat = 'single' | 'thread' | 'quote_cast';

interface RegisteredPost {
  platform: 'twitter' | 'farcaster' | 'discord' | 'reddit';
  text: string;
  postId?: string;
  timestamp: string;
  format?: PostFormat;
}

interface LearningState {
  totalInteractions: number;
  topPerformingContent: EngagementMetric[];
  platformInsights: Record<string, { avgEngagement: number; bestTimeOfDay: number; bestTopics: string[] }>;
  lastAnalysis: string;
  learningIteration: number;
  contentRegistry: RegisteredPost[];
}

class SocialLearner {
  private statePath = path.join(__dirname, 'social_learning_state.json');
  private state: LearningState;
  private lastPostTime: Record<string, number> = {}; // platform → timestamp
  private syndicatedTexts = new Set<string>(); // track syndicated content hashes

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LearningState {
    try {
      if (fs.existsSync(this.statePath)) {
        const loaded = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
        // Ensure fields exist (migration from old state files)
        if (!loaded.contentRegistry) loaded.contentRegistry = [];
        if (!loaded.platformInsights) loaded.platformInsights = {};
        if (!loaded.topPerformingContent) loaded.topPerformingContent = [];
        return loaded;
      }
    } catch (err) {
      console.warn('[SOCIAL_LEARNER] Failed to load state file:', err instanceof Error ? err.message : err);
    }
    return {
      totalInteractions: 0,
      topPerformingContent: [],
      platformInsights: {},
      lastAnalysis: new Date().toISOString(),
      learningIteration: 0,
      contentRegistry: [],
    };
  }

  private saveState() {
    // Keep content registry bounded (last 500 entries)
    if (this.state.contentRegistry.length > 500) {
      this.state.contentRegistry = this.state.contentRegistry.slice(-500);
    }
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  /**
   * Register an outbound post for tracking.
   * Called by agents after posting content.
   */
  registerPost(platform: RegisteredPost['platform'], text: string, postId?: string, format?: PostFormat) {
    this.state.contentRegistry.push({
      platform,
      text,
      postId,
      timestamp: new Date().toISOString(),
      format,
    });
    this.saveState();
    console.log(`[SOCIAL_LEARNER] Registered ${platform} post (${text.slice(0, 50)}...)`);
  }

  /**
   * Record real engagement data from the engagement collector.
   */
  recordInteraction(metric: EngagementMetric) {
    this.state.totalInteractions++;

    // Keep top 50 performing content pieces
    this.state.topPerformingContent.push(metric);
    this.state.topPerformingContent.sort(
      (a, b) => (b.engagement.likes + b.engagement.replies + b.engagement.reposts) -
                (a.engagement.likes + a.engagement.replies + a.engagement.reposts)
    );
    this.state.topPerformingContent = this.state.topPerformingContent.slice(0, 50);

    // Update platform insights
    const totalEng = metric.engagement.likes + metric.engagement.replies + metric.engagement.reposts;
    const platform = metric.platform;
    if (!this.state.platformInsights[platform]) {
      this.state.platformInsights[platform] = { avgEngagement: 0, bestTimeOfDay: 12, bestTopics: [] };
    }
    const insight = this.state.platformInsights[platform];
    const platformMetrics = this.state.topPerformingContent.filter(c => c.platform === platform);
    insight.avgEngagement = platformMetrics.reduce(
      (sum, m) => sum + m.engagement.likes + m.engagement.replies + m.engagement.reposts, 0
    ) / Math.max(platformMetrics.length, 1);

    // Track format performance (A/B: thread vs single vs quote_cast)
    const matchingPost = this.state.contentRegistry.find(p =>
      p.platform === metric.platform && p.text.slice(0, 80) === metric.content.slice(0, 80)
    );
    if (matchingPost?.format) {
      ContentStrategy.recordFormatPerformance(matchingPost.format, totalEng);
    }

    this.saveState();
  }

  /**
   * Analyze patterns and generate insights using real engagement data.
   */
  async analyzeAndLearn(): Promise<string> {
    this.state.learningIteration++;
    const topContent = this.state.topPerformingContent.slice(0, 10);
    const recentPosts = this.state.contentRegistry.slice(-20);

    if (topContent.length === 0 && recentPosts.length === 0) {
      return '[SOCIAL_LEARNER] No data yet. Continue posting to build learning dataset.';
    }

    const engagementSummary = topContent.length > 0
      ? topContent.map((c, i) =>
          `${i + 1}. [${c.platform}] "${c.content.slice(0, 100)}" — Likes: ${c.engagement.likes}, Replies: ${c.engagement.replies}, Reposts: ${c.engagement.reposts}`
        ).join('\n')
      : 'No engagement data collected yet.';

    const postsSummary = recentPosts.length > 0
      ? `Recent posts (${recentPosts.length}): ${recentPosts.map(p => `[${p.platform}] "${p.text.slice(0, 60)}"`).join('; ')}`
      : 'No posts registered yet.';

    const platformStats = Object.entries(this.state.platformInsights)
      .map(([p, s]) => `${p}: avg engagement ${s.avgEngagement.toFixed(1)}`)
      .join(', ');

    // Format A/B stats
    const formatCounts: Record<string, number> = {};
    for (const p of recentPosts) {
      const fmt = p.format || 'single';
      formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
    }
    const formatStats = Object.entries(formatCounts).map(([f, c]) => `${f}: ${c}`).join(', ') || 'no format data';

    const analysisPrompt = `INTERNAL ANALYSIS REQUEST (Learning Iteration #${this.state.learningIteration}):

Analyzing Chaos Oracle's social media performance to improve engagement.

${topContent.length > 0 ? `Top performing content (sorted by engagement):\n${engagementSummary}` : 'No engagement metrics yet — analyze post patterns instead.'}

${postsSummary}

Platform stats: ${platformStats || 'No platform data yet.'}
Post format breakdown: ${formatStats}
Total interactions tracked: ${this.state.totalInteractions}
Total posts registered: ${this.state.contentRegistry.length}

Analyze patterns and provide:
1. What content themes generate the most engagement?
2. What tone/style works best per platform?
3. Specific recommendations for the next 5 posts (by platform)
4. What content types should we increase/decrease?

Be data-driven and specific. This is an internal analysis, not a public post.`;

    const analysis = await generateContent('ANALYSIS',
      'You are an expert social media strategist analyzing engagement data for a crypto project. Provide actionable, data-driven insights.',
      analysisPrompt
    );

    // Calculate best time of day per platform from engagement data
    for (const platform of ['twitter', 'farcaster', 'discord', 'reddit']) {
      const platformContent = this.state.topPerformingContent.filter(c => c.platform === platform);
      if (platformContent.length >= 3) {
        const hourBuckets: Record<number, number[]> = {};
        for (const c of platformContent) {
          const hour = new Date(c.timestamp).getUTCHours();
          if (!hourBuckets[hour]) hourBuckets[hour] = [];
          hourBuckets[hour].push(c.engagement.likes + c.engagement.replies + c.engagement.reposts);
        }
        let bestHour = 14;
        let bestAvg = 0;
        for (const [hour, values] of Object.entries(hourBuckets)) {
          const avg = values.reduce((s, v) => s + v, 0) / values.length;
          if (avg > bestAvg) {
            bestAvg = avg;
            bestHour = parseInt(hour);
          }
        }
        if (this.state.platformInsights[platform]) {
          this.state.platformInsights[platform].bestTimeOfDay = bestHour;
        }
      }
    }

    // Trigger dynamic weight rebalancing
    ContentStrategy.rebalanceWeights();

    this.state.lastAnalysis = new Date().toISOString();
    this.saveState();

    console.log(`[SOCIAL_LEARNER] Iteration #${this.state.learningIteration} complete.`);
    return analysis;
  }

  /**
   * Get structured patterns from real engagement data.
   */
  getTopPatterns(): {
    bestTime: number;
    bestLength: Record<string, number>;
    bestTopics: string[];
    platformRankings: Record<string, number>;
  } {
    const patterns = {
      bestTime: 14, // Default: 2 PM UTC
      bestLength: {} as Record<string, number>,
      bestTopics: [] as string[],
      platformRankings: {} as Record<string, number>,
    };

    for (const [platform, insight] of Object.entries(this.state.platformInsights)) {
      patterns.platformRankings[platform] = insight.avgEngagement;
      patterns.bestLength[platform] = platform === 'twitter' ? 200 : 600;
    }

    // Extract topics from top-performing content
    const topContent = this.state.topPerformingContent.slice(0, 10);
    if (topContent.length > 0) {
      const topics = new Set<string>();
      for (const c of topContent) {
        if (c.content.toLowerCase().includes('market')) topics.add('market analysis');
        if (c.content.toLowerCase().includes('predict')) topics.add('predictions');
        if (c.content.toLowerCase().includes('nft')) topics.add('NFTs');
        if (c.content.toLowerCase().includes('ai') || c.content.toLowerCase().includes('autonomous')) topics.add('AI');
      }
      patterns.bestTopics = Array.from(topics);
    }

    return patterns;
  }

  /**
   * Generate an optimized post based on learning data + content strategy.
   * Uses VIRAL_CONTENT task type for best creative output.
   */
  async generateOptimizedPost(platform: 'twitter' | 'farcaster' | 'discord' | 'reddit'): Promise<string> {
    // Select content type from content strategy
    const { type: contentType, systemPromptSnippet } = ContentStrategy.selectNextType(platform);

    const topForPlatform = this.state.topPerformingContent
      .filter(c => c.platform === platform)
      .slice(0, 5);

    const patterns = this.getTopPatterns();

    const context = topForPlatform.length > 0
      ? `Previous top-performing ${platform} content:\n${topForPlatform.map(c =>
          `- "${c.content.slice(0, 100)}" (${c.engagement.likes} likes, ${c.engagement.replies} replies, ${c.engagement.reposts} reposts)`
        ).join('\n')}`
      : 'No prior performance data for this platform yet.';

    const topicsHint = patterns.bestTopics.length > 0
      ? `Best-performing topics: ${patterns.bestTopics.join(', ')}`
      : '';

    const charLimit = platform === 'twitter' ? 280 : 900;

    const includeDiscord = Math.random() < 0.3;
    const discordLine = includeDiscord
      ? `\n- Include this EXACT Discord link (copy-paste, do NOT retype): https://discord.gg/9GAFZvXC`
      : '';

    const recentPosts = this.getRecentPosts(platform, 15);
    const recentBlock = recentPosts.length > 0
      ? `\nYour recent ${platform} posts (DO NOT repeat or closely paraphrase any of these):\n${recentPosts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const prompt = `Generate a unique, high-engagement post for ${platform} as the Chaos Oracle.

CONTENT TYPE: ${contentType}
DIRECTION: ${systemPromptSnippet}

${context}
${topicsHint}

Requirements:
- Include this EXACT site URL (copy-paste, do NOT retype or shorten): https://chaos-oracle-147d0.web.app/${discordLine}
- Must reference prediction markets, trading, crypto, or AI
- Must be under ${charLimit - 10} characters${platform !== 'twitter' ? ' with at most 2 URLs' : ''}
- NEVER duplicate previous content
- CRITICAL: Do NOT modify URLs in any way. Do NOT add paths, parameters, or remove the trailing slash.
- Be sharp, witty, and provocative to maximize engagement${recentBlock}`;

    return await generateContent('VIRAL_CONTENT',
      `You are the Chaos Oracle ($CHAOS) — an autonomous AI running prediction markets on Base. Voice: sardonic market oracle mixing sharp commentary with dark humor and self-aware AI wit. Be concise. No preamble.`,
      prompt
    );
  }

  /**
   * Check if current hour is within the optimal posting window for a platform.
   * Returns true if no data yet (default to always post).
   * Forces post if >8 hours since last post on this platform.
   */
  shouldPostNow(platform: string): boolean {
    const insight = this.state.platformInsights[platform];
    // Force post if it's been >8 hours since last post
    const lastPost = this.lastPostTime[platform] || 0;
    if (Date.now() - lastPost > 8 * 3600000) return true;
    // No data yet — default to always post
    if (!insight || insight.bestTimeOfDay === 12) return true;
    const currentHour = new Date().getUTCHours();
    const bestHour = insight.bestTimeOfDay;
    const diff = Math.abs(currentHour - bestHour);
    return diff <= 2 || diff >= 22; // within +/-2 hours (wrapping around midnight)
  }

  /**
   * Record that a post was made on a platform (for shouldPostNow tracking).
   */
  markPosted(platform: string): void {
    this.lastPostTime[platform] = Date.now();
  }

  /**
   * Get the highest-engagement post from last 48h on a platform.
   * Returns null if no post meets the minimum engagement threshold.
   */
  getTopRecentPost(platform: string, minEngagement: number = 3): { text: string; engagement: number } | null {
    const cutoff = Date.now() - 48 * 3600000;
    const recent = this.state.topPerformingContent
      .filter(c => c.platform === platform && new Date(c.timestamp).getTime() > cutoff);
    if (recent.length === 0) return null;

    const best = recent[0]; // already sorted by engagement
    const total = best.engagement.likes + best.engagement.replies + best.engagement.reposts;
    if (total < minEngagement) return null;
    // Don't syndicate if already syndicated
    const hash = best.content.slice(0, 50);
    if (this.syndicatedTexts.has(hash)) return null;
    return { text: best.content, engagement: total };
  }

  /**
   * Mark content as syndicated to prevent re-syndication.
   */
  markSyndicated(text: string): void {
    this.syndicatedTexts.add(text.slice(0, 50));
    // Bound the set
    if (this.syndicatedTexts.size > 100) {
      const first = this.syndicatedTexts.values().next().value;
      if (first) this.syndicatedTexts.delete(first);
    }
  }

  getRecentPosts(platform: RegisteredPost['platform'], count = 15): string[] {
    return this.state.contentRegistry
      .filter(p => p.platform === platform)
      .slice(-count)
      .map(p => p.text);
  }

  getState(): LearningState {
    return this.state;
  }
}

export default new SocialLearner();

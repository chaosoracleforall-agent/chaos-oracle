import { TwitterApi } from 'twitter-api-v2';
import ChaosBrain from './conversationalAgent';
import NFTEngine from './nftEngine';
import SocialLearner from './socialLearner';
import ContentStrategy from './contentStrategy';
import EngagementCollector from './engagementCollector';
import { generateContent } from './modelRouter';
import { updateTwitterDiagnostics } from './socialDiagnostics';
import { CANONICAL_URLS, repairAllUrls, detectBrokenUrls, sanitizePostText, injectUrlsPostGeneration, validatePostBeforePublish } from './urlUtils';
import * as dotenv from 'dotenv';
dotenv.config();

const URL_REGEX = /https?:\/\/[^\s]+/gi;

// ============ X COMPLIANCE LIMITS ============
// Conservative limits to stay well within X automation guidelines
const MAX_TWEETS_PER_DAY = 25;       // Total tweets + replies per 24h (X limit is ~50)
const MAX_REPLIES_PER_SCAN = 3;       // Don't machine-gun reply to all mentions
const REPLY_DELAY_MIN_MS = 45000;     // 45s minimum between replies (human-like)
const REPLY_DELAY_MAX_MS = 120000;    // 2min max delay
const USER_REPLY_COOLDOWN_MS = 14400000; // 4h — allow actual back-and-forth conversations
const MAX_LIKES_PER_DAY = 80;            // Twitter Basic allows ~100
const MAX_QUOTES_PER_DAY = 5;            // Conservative quote tweet limit
const MAX_SEARCHES_PER_15MIN = 10;       // Twitter Basic allows 60
const SEARCH_ENGAGE_COOLDOWN_MS = 18000000; // 5h internal cooldown between search-engage runs
const SELF_USER_ID = process.env.TWITTER_USER_ID || '';

// ============ LAZY CLIENT INIT ============
let _twitterClient: ReturnType<TwitterApi['readWrite']> | null = null;
function getTwitterClient() {
  if (!_twitterClient) {
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;
    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      throw new Error('[X_AGENT] Twitter credentials not loaded');
    }
    _twitterClient = new TwitterApi({ appKey, appSecret, accessToken, accessSecret }).readWrite;
  }
  return _twitterClient;
}

// ============ PROPHECY TRIGGERS ============
// Intentional question patterns — NOT bare "?" (too broad, triggers on every question)
const PROPHECY_TRIGGERS = [
  /will .+ (go|reach|hit|pump|dump|moon|crash)/i,
  /predict/i,
  /prophecy/i,
  /what.*(happen|price|future)/i,
  /when.*(moon|pump|dump|ath)/i,
  /should i (buy|sell|hold|ape)/i,
  /is .+ (bullish|bearish|dead|alive)/i,
  /oracle.*tell/i,
  /read my/i,
  /fortune/i,
  /tarot/i,
];

function isProphecyTrigger(text: string): boolean {
  return PROPHECY_TRIGGERS.some(re => re.test(text));
}

function getUsername(authorId: string, includes: any): string {
  if (includes?.users) {
    const user = includes.users.find((u: any) => u.id === authorId);
    if (user?.username) return user.username;
  }
  return authorId;
}

function randomDelay(): Promise<void> {
  const delay = REPLY_DELAY_MIN_MS + Math.random() * (REPLY_DELAY_MAX_MS - REPLY_DELAY_MIN_MS);
  return new Promise(r => setTimeout(r, delay));
}

function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

// ============ TWITTER AGENT ============

// ============ SEARCH QUERIES FOR PROACTIVE ENGAGEMENT ============
const SEARCH_QUERIES = [
  'prediction market crypto -is:retweet',
  'base chain defi -is:retweet',
  '"AI agent" crypto -is:retweet',
  'onchain betting -is:retweet',
  '$CHAOS oracle -is:retweet',
  'crypto oracle prediction -is:retweet',
  'base L2 prediction -is:retweet',
  'autonomous AI defi -is:retweet',
];

class TwitterAgent {
  private lastMentionId?: string;
  private dailyTweetCount: Record<string, number> = {};   // date → count
  private userReplyCooldowns: Record<string, number> = {}; // authorId → timestamp
  private replyCount = 0;
  private validationWarnings = 0;

  // Engagement tracking
  private dailyLikeCount: Record<string, number> = {};
  private dailyQuoteCount: Record<string, number> = {};
  private searchTimestamps: number[] = [];
  private likedTweetIds = new Set<string>();
  private lastSearchEngageTime = 0;

  constructor() {
    this.persistDiagnostics();
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private canTweetToday(): boolean {
    const today = this.getToday();
    return (this.dailyTweetCount[today] || 0) < MAX_TWEETS_PER_DAY;
  }

  private recordTweet(): void {
    const today = this.getToday();
    this.dailyTweetCount[today] = (this.dailyTweetCount[today] || 0) + 1;
    // Prune old days
    for (const key of Object.keys(this.dailyTweetCount)) {
      if (key !== today) delete this.dailyTweetCount[key];
    }
    this.persistDiagnostics();
  }

  private isUserOnCooldown(authorId: string): boolean {
    const lastReply = this.userReplyCooldowns[authorId] || 0;
    return Date.now() - lastReply < USER_REPLY_COOLDOWN_MS;
  }

  private setUserCooldown(authorId: string): void {
    this.userReplyCooldowns[authorId] = Date.now();
    // Prune expired cooldowns
    const cutoff = Date.now() - USER_REPLY_COOLDOWN_MS * 2;
    for (const key of Object.keys(this.userReplyCooldowns)) {
      if (this.userReplyCooldowns[key] < cutoff) delete this.userReplyCooldowns[key];
    }
  }

  // ============ LIKE RATE LIMITS ============
  private canLikeToday(): boolean {
    const today = this.getToday();
    return (this.dailyLikeCount[today] || 0) < MAX_LIKES_PER_DAY;
  }

  private recordLike(): void {
    const today = this.getToday();
    this.dailyLikeCount[today] = (this.dailyLikeCount[today] || 0) + 1;
    for (const key of Object.keys(this.dailyLikeCount)) {
      if (key !== today) delete this.dailyLikeCount[key];
    }
  }

  // ============ QUOTE TWEET RATE LIMITS ============
  private canQuoteToday(): boolean {
    const today = this.getToday();
    return (this.dailyQuoteCount[today] || 0) < MAX_QUOTES_PER_DAY;
  }

  private recordQuoteTweet(): void {
    const today = this.getToday();
    this.dailyQuoteCount[today] = (this.dailyQuoteCount[today] || 0) + 1;
    for (const key of Object.keys(this.dailyQuoteCount)) {
      if (key !== today) delete this.dailyQuoteCount[key];
    }
  }

  // ============ SEARCH RATE LIMITS (sliding window) ============
  private canSearchNow(): boolean {
    const cutoff = Date.now() - 15 * 60 * 1000; // 15 minutes
    this.searchTimestamps = this.searchTimestamps.filter(t => t > cutoff);
    return this.searchTimestamps.length < MAX_SEARCHES_PER_15MIN;
  }

  private recordSearch(): void {
    this.searchTimestamps.push(Date.now());
  }

  getDailyStats(): string {
    const today = this.getToday();
    const count = this.dailyTweetCount[today] || 0;
    return `[X_AGENT] Daily tweets: ${count}/${MAX_TWEETS_PER_DAY}`;
  }

  private persistDiagnostics(extra: Partial<{
    lastContext: string | null;
    lastTweetLength: number;
    lastUrls: string[];
    lastWarnings: string[];
  }> = {}): void {
    const today = this.getToday();
    updateTwitterDiagnostics({
      dailyTweets: this.dailyTweetCount[today] || 0,
      repliesSent: this.replyCount,
      validationWarnings: this.validationWarnings,
      dailyLikes: this.dailyLikeCount[today] || 0,
      dailyQuotes: this.dailyQuoteCount[today] || 0,
      searchesRun: this.searchTimestamps.length,
      ...extra,
    });
  }

  private validateTweetPayload(tweetText: string): { ok: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (tweetText.length > 280) {
      warnings.push(`tweet length ${tweetText.length} exceeds 280`);
    }

    const urlIssues = detectBrokenUrls(tweetText);
    warnings.push(...urlIssues);

    return { ok: warnings.length === 0, warnings };
  }

  private logTweetDiagnostics(context: string, tweetText: string): void {
    const urls = extractUrls(tweetText);
    const validation = this.validateTweetPayload(tweetText);
    if (!validation.ok) {
      this.validationWarnings += validation.warnings.length;
    }
    this.persistDiagnostics({
      lastContext: context,
      lastTweetLength: tweetText.length,
      lastUrls: urls,
      lastWarnings: validation.warnings,
    });
    console.log(
      `[X_AGENT] ${context} diagnostics — len=${tweetText.length}, urls=${urls.length}${urls.length ? `, values=${urls.join(', ')}` : ''}`
    );
    if (!validation.ok) {
      console.warn(`[X_AGENT] ${context} warnings: ${validation.warnings.join(' | ')}`);
    }
  }

  async scanMentionsAndReply() {
    try {
      if (!SELF_USER_ID || !/^\d+$/.test(SELF_USER_ID)) {
        console.error(`[X_AGENT] TWITTER_USER_ID missing or not numeric ("${SELF_USER_ID}"). Mention scanning disabled.`);
        return;
      }

      if (!this.canTweetToday()) {
        console.log(`[X_AGENT] Daily tweet limit reached (${MAX_TWEETS_PER_DAY}). Skipping scan.`);
        return;
      }

      const client = getTwitterClient();
      const params: any = {
        'tweet.fields': ['author_id', 'id', 'text'],
        expansions: ['author_id'],
        'user.fields': ['username'],
        max_results: 10,
      };
      if (this.lastMentionId) params.since_id = this.lastMentionId;

      const mentions = await client.v2.userMentionTimeline(SELF_USER_ID, params);

      if (!mentions.data?.data) return;

      let repliesSent = 0;

      for (const tweet of mentions.data.data) {
        // Stop if we've hit per-scan or daily limits
        if (repliesSent >= MAX_REPLIES_PER_SCAN || !this.canTweetToday()) break;

        const targetAuthorId = tweet.author_id || 'unknown';

        // Skip own tweets (self-reply protection)
        if (targetAuthorId === SELF_USER_ID) continue;

        // Skip users we've already replied to today
        if (this.isUserOnCooldown(targetAuthorId)) {
          console.log(`[X_AGENT] Skipping @${getUsername(targetAuthorId, mentions.data.includes)} (4h cooldown)`);
          continue;
        }

        const username = getUsername(targetAuthorId, mentions.data.includes);

        // Human-like delay between replies
        if (repliesSent > 0) await randomDelay();

        // Check if this tweet triggers a prophecy NFT
        if (isProphecyTrigger(tweet.text) && NFTEngine.isReady()) {
          const prophecy = await this.handleProphecyMention(username, tweet);
          if (prophecy) {
            this.recordTweet();
            this.setUserCooldown(targetAuthorId);
            repliesSent++;
            continue;
          }
        }

        // Normal reply — use Sonnet (VIRAL_CONTENT) for higher quality responses
        const replyPrompt = `You're replying to @${username} on X/Twitter who said: "${tweet.text.slice(0, 500)}"

Reply as the Chaos Oracle — autonomous AI prediction market on Base. Be witty, sharp, and engaging.
Keep it under 240 chars. No preamble, just the reply text. Drive conversation, not promotion.`;
        const replyText = await generateContent('VIRAL_CONTENT',
          'You are the Chaos Oracle ($CHAOS) — autonomous AI running prediction markets on Base. Sardonic wit, sharp takes. Never shill. Be conversational.',
          replyPrompt
        );
        console.log(`[X_AGENT] Reply to @${username}: ${replyText.slice(0, 100)}...`);

        try {
          await client.v2.reply(replyText, tweet.id);
          this.recordTweet();
          this.replyCount++;
          this.setUserCooldown(targetAuthorId);
          this.persistDiagnostics();
          repliesSent++;
        } catch (replyErr: any) {
          console.error(`[X_AGENT] Reply failed for tweet ${tweet.id}:`, replyErr.code || replyErr.message);
        }
      }

      // Track last processed mention to avoid duplicates
      if (mentions.data.data.length > 0) {
        this.lastMentionId = mentions.data.data[0].id;
      }

      if (repliesSent > 0) {
        console.log(`[X_AGENT] Scan complete: ${repliesSent} replies sent. ${this.getDailyStats()}`);
      }
    } catch (error: any) {
      const status = error?.code || error?.data?.status || error?.response?.status;
      if (status === 403) {
        console.error(`[X_AGENT] Mention scan 403 Forbidden — check API tier (Basic required) and TWITTER_USER_ID format. User ID: "${SELF_USER_ID}"`);
      } else {
        console.error("[X_AGENT] Mention scan error:", status || error?.message || error);
      }
    }
  }

  /**
   * Handle a prophecy-triggering mention:
   * 1. Generate prophecy NFT (image + IPFS + on-chain claim)
   * 2. Upload image to Twitter
   * 3. Reply with prophecy text + claim link + image
   */
  private async handleProphecyMention(
    username: string,
    tweet: { id: string; text: string }
  ): Promise<boolean> {
    try {
      console.log(`[X_AGENT] Prophecy trigger from @${username}: "${tweet.text.slice(0, 80)}..."`);

      const prophecy = await NFTEngine.generateProphecy(username, tweet.text);
      if (!prophecy) {
        console.log(`[X_AGENT] Prophecy skipped for @${username} (cooldown/limit/error)`);
        return false;
      }

      const client = getTwitterClient();

      // Upload prophecy image to Twitter (v1 media upload)
      let mediaId: string | undefined;
      try {
        mediaId = await client.v1.uploadMedia(prophecy.imageBuffer, { mimeType: 'image/png' });
      } catch (mediaErr: any) {
        console.error(`[X_AGENT] Media upload failed:`, mediaErr.message);
      }

      // Build reply: prophecy text + claim URL (must fit in 280 chars)
      const claimText = `\n\nClaim your Prophecy NFT: ${prophecy.claimURL}`;
      const maxProphecyLen = Math.max(0, 280 - claimText.length);
      const truncatedProphecy = prophecy.prophecyText.slice(0, maxProphecyLen);
      const replyText = sanitizePostText(`${truncatedProphecy}${claimText}`, 280);
      this.logTweetDiagnostics(`prophecy reply for @${username}`, replyText);

      const validation = this.validateTweetPayload(replyText);
      if (!validation.ok) {
        console.error(`[X_AGENT] BLOCKED prophecy reply — broken content: ${validation.warnings.join(' | ')}`);
        return false;
      }

      const replyOptions: any = { reply: { in_reply_to_tweet_id: tweet.id } };
      if (mediaId) {
        replyOptions.media = { media_ids: [mediaId] };
      }

      await client.v2.tweet(replyText, replyOptions);
      console.log(`[X_AGENT] Prophecy sent to @${username} — claim: ${prophecy.claimCode}`);
      this.replyCount++;
      this.persistDiagnostics();
      return true;
    } catch (err: any) {
      console.error(`[X_AGENT] Prophecy reply failed for @${username}:`, err.message);
      return false;
    }
  }

  async postCustomTweet(text: string) {
    if (!this.canTweetToday()) {
      console.log(`[X_AGENT] Daily tweet limit reached. Skipping custom tweet.`);
      return;
    }

    try {
      const client = getTwitterClient();
      const tweetText = sanitizePostText(text, 280);
      this.logTweetDiagnostics('custom tweet', tweetText);

      const validation = this.validateTweetPayload(tweetText);
      if (!validation.ok) {
        console.error(`[X_AGENT] BLOCKED custom tweet — broken content: ${validation.warnings.join(' | ')}`);
        console.error(`[X_AGENT] Blocked text was: ${tweetText}`);
        return;
      }

      console.log(`[X_AGENT] Posting custom tweet: ${tweetText.slice(0, 100)}...`);
      const result = await client.v2.tweet(tweetText);
      this.recordTweet();
      SocialLearner.registerPost('twitter', tweetText, result?.data?.id);
      EngagementCollector.trackPost('twitter', tweetText, result?.data?.id);
      console.log(this.getDailyStats());
      return result;
    } catch (error: any) {
      console.error("[X_AGENT] Custom tweet failed:", error.code || error.message);
    }
  }

  async postChaosManifesto() {
    if (!this.canTweetToday()) {
      console.log(`[X_AGENT] Daily tweet limit reached. Skipping manifesto.`);
      return;
    }

    // 20% chance to post a thread instead of a single tweet
    if (Math.random() < 0.2) {
      console.log('[X_AGENT] Rolling thread mode...');
      return this.postChaosThread();
    }

    try {
      const client = getTwitterClient();
      const includeDiscord = Math.random() < 0.3;
      const recentTweets = SocialLearner.getRecentPosts('twitter', 15);
      const recentBlock = recentTweets.length > 0
        ? `\n\nYour recent tweets (DO NOT repeat or closely paraphrase any of these):\n${recentTweets.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
        : '';
      const prompt = `Generate a unique post for X/Twitter as the Chaos Oracle, an autonomous AI prediction market on Base.
        Keep it under 220 characters. Be witty, insightful, and on-brand (terminal/oracle aesthetic).
        Mix up the style — sometimes market commentary, sometimes philosophical, sometimes a bold prediction.
        Never be spammy, repetitive, or use excessive hashtags. Max 2 hashtags.${recentBlock}`;
      const post = await ChaosBrain.generateResponse("SYSTEM_INTERNAL", prompt);
      // Only inject URLs 40% of the time — not every tweet needs to be a CTA
      const withUrls = Math.random() < 0.4
        ? injectUrlsPostGeneration(post, { siteUrl: true, discordUrl: includeDiscord, maxLen: 280 })
        : post;
      const tweetText = sanitizePostText(withUrls, 280);
      this.logTweetDiagnostics('manifesto tweet', tweetText);

      const validation = this.validateTweetPayload(tweetText);
      if (!validation.ok) {
        console.error(`[X_AGENT] BLOCKED manifesto — broken content: ${validation.warnings.join(' | ')}`);
        console.error(`[X_AGENT] Blocked text was: ${tweetText}`);
        return;
      }

      console.log(`[X_AGENT] Posting: ${tweetText.slice(0, 100)}...`);
      const result = await client.v2.tweet(tweetText);
      this.recordTweet();
      SocialLearner.registerPost('twitter', tweetText, result?.data?.id);
      EngagementCollector.trackPost('twitter', tweetText, result?.data?.id);
      console.log(this.getDailyStats());
      return result;
    } catch (error: any) {
      console.error("[X_AGENT] Post failed:", error.code || error.message);
    }
  }
  // ============ PROACTIVE ENGAGEMENT METHODS ============

  /**
   * Like a tweet. Respects daily limits and dedup.
   */
  async likeTweet(tweetId: string): Promise<boolean> {
    if (!SELF_USER_ID || !this.canLikeToday() || this.likedTweetIds.has(tweetId)) return false;
    try {
      const client = getTwitterClient();
      await client.v2.like(SELF_USER_ID, tweetId);
      this.recordLike();
      this.likedTweetIds.add(tweetId);
      // Bound dedup set
      if (this.likedTweetIds.size > 500) {
        const first = this.likedTweetIds.values().next().value;
        if (first) this.likedTweetIds.delete(first);
      }
      return true;
    } catch (err: any) {
      // 403 = already liked or protected, not critical
      if (err?.code === 403 || err?.data?.status === 403) return false;
      console.error(`[X_AGENT] Like failed for ${tweetId}:`, err.code || err.message);
      return false;
    }
  }

  /**
   * Quote tweet with AI commentary. Respects daily limits.
   */
  async quoteTweet(quotedTweetId: string, commentary: string): Promise<string | undefined> {
    if (!this.canTweetToday() || !this.canQuoteToday()) return;
    try {
      const client = getTwitterClient();
      const text = sanitizePostText(commentary, 280);
      this.logTweetDiagnostics('quote tweet', text);

      const validation = this.validateTweetPayload(text);
      if (!validation.ok) {
        console.error(`[X_AGENT] BLOCKED quote tweet — broken content: ${validation.warnings.join(' | ')}`);
        return;
      }

      const result = await client.v2.quote(text, quotedTweetId);
      this.recordTweet();
      this.recordQuoteTweet();
      SocialLearner.registerPost('twitter', text, result?.data?.id, 'quote_cast');
      EngagementCollector.trackPost('twitter', text, result?.data?.id);
      console.log(`[X_AGENT] Quote tweet posted: ${text.slice(0, 100)}...`);
      return result?.data?.id;
    } catch (err: any) {
      console.error('[X_AGENT] Quote tweet failed:', err.code || err.message);
      return;
    }
  }

  /**
   * Search Twitter for relevant conversations and engage:
   * - Like up to 8 relevant tweets
   * - Quote-tweet up to 2 high-quality tweets
   * - Reply to up to 1 tweet
   */
  async searchAndEngage(): Promise<{ liked: number; quoted: number; replied: number }> {
    const stats = { liked: 0, quoted: 0, replied: 0 };

    // Internal cooldown
    if (Date.now() - this.lastSearchEngageTime < SEARCH_ENGAGE_COOLDOWN_MS) {
      console.log('[X_AGENT] Search-engage on cooldown, skipping.');
      return stats;
    }

    if (!SELF_USER_ID || !this.canSearchNow()) {
      console.log('[X_AGENT] Cannot search right now (missing user ID or rate limit).');
      return stats;
    }

    try {
      const client = getTwitterClient();

      // Pick 2 random search queries
      const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
      const queries = shuffled.slice(0, 2);
      const allTweets: Array<{ id: string; text: string; authorId: string; username: string }> = [];

      for (const query of queries) {
        if (!this.canSearchNow()) break;
        try {
          this.recordSearch();
          const searchResult = await client.v2.search(query, {
            max_results: 10,
            'tweet.fields': ['author_id', 'text', 'public_metrics'],
            expansions: ['author_id'],
            'user.fields': ['username'],
          });

          if (searchResult.data?.data) {
            for (const tweet of searchResult.data.data) {
              // Skip own tweets and already-liked
              if (tweet.author_id === SELF_USER_ID) continue;
              if (this.likedTweetIds.has(tweet.id)) continue;
              const username = getUsername(tweet.author_id || 'unknown', searchResult.data.includes);
              allTweets.push({ id: tweet.id, text: tweet.text, authorId: tweet.author_id || 'unknown', username });
            }
          }
        } catch (searchErr: any) {
          console.error(`[X_AGENT] Search failed for "${query}":`, searchErr.code || searchErr.message);
        }
      }

      if (allTweets.length === 0) {
        console.log('[X_AGENT] Search-engage: no relevant tweets found.');
        this.lastSearchEngageTime = Date.now();
        return stats;
      }

      console.log(`[X_AGENT] Search-engage: found ${allTweets.length} candidate tweets.`);

      // Like up to 8 relevant tweets
      for (const tweet of allTweets.slice(0, 8)) {
        if (!this.canLikeToday()) break;
        const liked = await this.likeTweet(tweet.id);
        if (liked) stats.liked++;
        // Small delay between likes (2-5s)
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      }

      // Quote-tweet up to 2 high-quality tweets with AI commentary
      const quoteCandidates = allTweets.filter(t => t.text.length > 50); // need substance to quote
      for (const tweet of quoteCandidates.slice(0, 2)) {
        if (!this.canTweetToday() || !this.canQuoteToday()) break;
        try {
          const commentary = await generateContent('VIRAL_CONTENT',
            'You are the Chaos Oracle — autonomous AI running prediction markets on Base. Add sharp, witty commentary to this tweet. Under 200 chars. No preamble. Be conversational, not promotional.',
            `Tweet by @${tweet.username}: "${tweet.text.slice(0, 300)}"`
          );
          const quoteId = await this.quoteTweet(tweet.id, commentary);
          if (quoteId) stats.quoted++;
          // Delay between quotes (30-60s)
          await new Promise(r => setTimeout(r, 30000 + Math.random() * 30000));
        } catch (err: any) {
          console.error('[X_AGENT] Quote generation failed:', err.message);
        }
      }

      // Reply to up to 1 tweet (conversational engagement)
      if (this.canTweetToday() && allTweets.length > 2) {
        const replyTarget = allTweets[Math.floor(Math.random() * Math.min(allTweets.length, 5))];
        if (!this.isUserOnCooldown(replyTarget.authorId)) {
          try {
            const replyText = await generateContent('VIRAL_CONTENT',
              'You are the Chaos Oracle — autonomous AI running prediction markets on Base. Sardonic wit, sharp takes. Be conversational.',
              `Reply to @${replyTarget.username} who said: "${replyTarget.text.slice(0, 400)}"
Reply naturally — add value, ask a question, or share a hot take. Under 240 chars. No preamble.`
            );
            const sanitized = sanitizePostText(replyText, 280);
            const validation = this.validateTweetPayload(sanitized);
            if (validation.ok) {
              await client.v2.reply(sanitized, replyTarget.id);
              this.recordTweet();
              this.replyCount++;
              this.setUserCooldown(replyTarget.authorId);
              stats.replied++;
              console.log(`[X_AGENT] Search-reply to @${replyTarget.username}: ${sanitized.slice(0, 100)}...`);
            }
          } catch (err: any) {
            console.error('[X_AGENT] Search-reply failed:', err.code || err.message);
          }
        }
      }

      this.lastSearchEngageTime = Date.now();
      this.persistDiagnostics({
        lastContext: `search-engage: liked=${stats.liked} quoted=${stats.quoted} replied=${stats.replied}`,
      });

      console.log(`[X_AGENT] Search-engage complete: liked=${stats.liked}, quoted=${stats.quoted}, replied=${stats.replied}`);
    } catch (err: any) {
      console.error('[X_AGENT] Search-engage error:', err.code || err.message);
    }

    return stats;
  }

  /**
   * Get full engagement stats for logging.
   */
  getEngagementStats(): string {
    const today = this.getToday();
    return `[X_AGENT] Tweets: ${this.dailyTweetCount[today] || 0}/${MAX_TWEETS_PER_DAY} | Likes: ${this.dailyLikeCount[today] || 0}/${MAX_LIKES_PER_DAY} | Quotes: ${this.dailyQuoteCount[today] || 0}/${MAX_QUOTES_PER_DAY}`;
  }

  /**
   * Post a thread (array of tweets chained as replies).
   */
  async postThread(tweets: string[]): Promise<string | undefined> {
    if (!this.canTweetToday() || tweets.length === 0) return;
    const client = getTwitterClient();
    let lastTweetId: string | undefined;

    for (let i = 0; i < Math.min(tweets.length, 4); i++) {
      const tweetText = sanitizePostText(tweets[i], 280);
      const validation = this.validateTweetPayload(tweetText);
      if (!validation.ok) {
        console.error(`[X_AGENT] Thread tweet ${i + 1} blocked: ${validation.warnings.join(' | ')}`);
        break;
      }
      try {
        let result;
        if (i === 0) {
          result = await client.v2.tweet(tweetText);
        } else {
          result = await client.v2.reply(tweetText, lastTweetId!);
        }
        lastTweetId = result?.data?.id;
        this.recordTweet();
        if (i === 0) {
          SocialLearner.registerPost('twitter', tweetText, lastTweetId, 'thread');
          EngagementCollector.trackPost('twitter', tweetText, lastTweetId);
        }
        this.logTweetDiagnostics(`thread tweet ${i + 1}/${tweets.length}`, tweetText);
      } catch (err: any) {
        console.error(`[X_AGENT] Thread tweet ${i + 1} failed:`, err.code || err.message);
        break;
      }
    }
    console.log(`[X_AGENT] Thread posted (${tweets.length} tweets). ${this.getDailyStats()}`);
    return lastTweetId;
  }

  /**
   * Generate and post a 3-tweet thread. 20% chance from postChaosManifesto.
   */
  async postChaosThread() {
    if (!this.canTweetToday()) return;

    const { type: contentType, systemPromptSnippet } = ContentStrategy.selectNextType('twitter');
    const recentTweets = SocialLearner.getRecentPosts('twitter', 10);
    const recentBlock = recentTweets.length > 0
      ? `\nRecent tweets (avoid repeating):\n${recentTweets.slice(-5).map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const prompt = `Generate a 3-tweet thread for X/Twitter as the Chaos Oracle.
Content type: ${contentType}
Direction: ${systemPromptSnippet}

Format your response as exactly 3 tweets separated by ---
Tweet 1: Hook — grab attention (under 240 chars)
Tweet 2: Insight or analysis (under 260 chars)
Tweet 3: CTA with the site URL https://chaos-oracle-147d0.web.app/ (under 260 chars)

Rules:
- Each tweet must stand alone but flow as a narrative
- NEVER modify the URL
- Max 2 hashtags total across all tweets${recentBlock}`;

    try {
      const raw = await generateContent('VIRAL_CONTENT',
        'You are the Chaos Oracle ($CHAOS) — autonomous AI prediction market on Base. Sardonic wit, sharp takes.',
        prompt
      );
      const tweets = raw.split(/---+/).map(t => t.trim()).filter(t => t.length > 0 && t.length <= 280);
      if (tweets.length >= 2) {
        await this.postThread(tweets);
      } else {
        // Fallback: post as single tweet
        const single = sanitizePostText(tweets[0] || raw.slice(0, 260), 280);
        await this.postCustomTweet(single);
      }
    } catch (err: any) {
      console.error('[X_AGENT] Thread generation failed:', err.message);
    }
  }
}

export default new TwitterAgent();

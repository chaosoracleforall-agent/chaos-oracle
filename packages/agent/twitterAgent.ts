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
const USER_REPLY_COOLDOWN_MS = 86400000; // 24h — don't reply to same user twice per day
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

class TwitterAgent {
  private lastMentionId?: string;
  private dailyTweetCount: Record<string, number> = {};   // date → count
  private userReplyCooldowns: Record<string, number> = {}; // authorId → timestamp
  private replyCount = 0;
  private validationWarnings = 0;

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
          console.log(`[X_AGENT] Skipping @${getUsername(targetAuthorId, mentions.data.includes)} (24h cooldown)`);
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

        // Normal reply
        const replyText = await ChaosBrain.generateResponse(targetAuthorId, tweet.text);
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
    } catch (error) {
      console.error("[X_AGENT] Mention scan error:", error);
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
      const withUrls = injectUrlsPostGeneration(post, { siteUrl: true, discordUrl: includeDiscord, maxLen: 280 });
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
          SocialLearner.registerPost('twitter', tweetText, lastTweetId);
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

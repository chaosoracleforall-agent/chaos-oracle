import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import SocialLearner from './socialLearner';
import * as dotenv from 'dotenv';
dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;

// Rolling buffer of outbound post IDs per platform
interface TrackedPost {
  platform: 'farcaster' | 'discord' | 'reddit' | 'twitter';
  postId: string;
  text: string;
  timestamp: number;
  collected: boolean; // whether we've already collected engagement for this
}

const STATE_FILE = path.join(__dirname, 'engagement_tracking.json');

class EngagementCollector {
  private trackedPosts: TrackedPost[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        this.trackedPosts = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      this.trackedPosts = [];
    }
  }

  private saveState() {
    // Keep last 200 tracked posts
    if (this.trackedPosts.length > 200) {
      this.trackedPosts = this.trackedPosts.slice(-200);
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.trackedPosts, null, 2));
  }

  /**
   * Register a post for future engagement tracking.
   * Called by agents after posting content.
   */
  trackPost(platform: TrackedPost['platform'], text: string, postId?: string) {
    this.trackedPosts.push({
      platform,
      postId: postId || `${platform}-${Date.now()}`,
      text,
      timestamp: Date.now(),
      collected: false,
    });
    this.saveState();
  }

  /**
   * Collect engagement metrics from all platforms.
   * Runs every 2 hours via the main loop.
   */
  async collectAll(): Promise<{ collected: number; errors: string[] }> {
    const errors: string[] = [];
    let collected = 0;

    // Only collect for posts that are 1-48 hours old and not yet collected
    const now = Date.now();
    const eligible = this.trackedPosts.filter(
      p => !p.collected && now - p.timestamp > 3600000 && now - p.timestamp < 172800000
    );

    for (const post of eligible) {
      try {
        let engagement = { likes: 0, replies: 0, reposts: 0 };

        switch (post.platform) {
          case 'farcaster':
            engagement = await this.collectFarcaster(post.postId);
            break;
          case 'reddit':
            // Reddit metrics are collected via snoowrap in the reddit agent
            // We track what we can from the post state
            engagement = await this.collectReddit(post.postId);
            break;
          case 'discord':
            // Discord metrics would need the discord client — skip for now
            // Engagement comes from reaction counts which discordAgent tracks
            continue;
          case 'twitter':
            // Twitter metrics require Basic tier ($200/mo)
            // Without it, we can only track indirect signals
            continue;
        }

        if (engagement.likes + engagement.replies + engagement.reposts > 0) {
          SocialLearner.recordInteraction({
            platform: post.platform,
            content: post.text,
            timestamp: new Date(post.timestamp).toISOString(),
            engagement,
            sentiment: 'neutral',
          });
          collected++;
        }

        post.collected = true;
      } catch (err: any) {
        errors.push(`${post.platform}/${post.postId}: ${err.message}`);
      }
    }

    this.saveState();

    if (collected > 0) {
      console.log(`[ENGAGEMENT] Collected metrics for ${collected} posts. Errors: ${errors.length}`);
    }

    return { collected, errors };
  }

  /**
   * Fetch Farcaster cast engagement via Neynar API.
   */
  private async collectFarcaster(castHash: string): Promise<{ likes: number; replies: number; reposts: number }> {
    if (!NEYNAR_API_KEY) return { likes: 0, replies: 0, reposts: 0 };

    try {
      const response = await axios.get('https://api.neynar.com/v2/farcaster/cast', {
        params: { identifier: castHash, type: 'hash' },
        headers: { 'x-api-key': NEYNAR_API_KEY },
      });

      const cast = response.data.cast;
      if (!cast) return { likes: 0, replies: 0, reposts: 0 };

      return {
        likes: cast.reactions?.likes_count || cast.reactions?.likes?.length || 0,
        replies: cast.replies?.count || 0,
        reposts: cast.reactions?.recasts_count || cast.reactions?.recasts?.length || 0,
      };
    } catch (err: any) {
      // 404 = cast not found (deleted or wrong hash)
      if (err.response?.status === 404) return { likes: 0, replies: 0, reposts: 0 };
      throw err;
    }
  }

  /**
   * Fetch Reddit post engagement via snoowrap (if available).
   * Falls back to zero if reddit client isn't accessible.
   */
  private async collectReddit(postId: string): Promise<{ likes: number; replies: number; reposts: number }> {
    // Reddit state is tracked in reddit_state.json
    // We'll read from the post history if available
    try {
      const statePath = path.join(__dirname, 'reddit_state.json');
      if (!fs.existsSync(statePath)) return { likes: 0, replies: 0, reposts: 0 };

      // Reddit engagement will be collected by the RedditAgent directly
      // For now, return zeros — Phase 1 enhancement will add snoowrap integration
      return { likes: 0, replies: 0, reposts: 0 };
    } catch {
      return { likes: 0, replies: 0, reposts: 0 };
    }
  }

  /**
   * Report engagement metrics directly (for platforms like Discord where
   * the collector can't access the client). Called by the platform agent.
   */
  reportEngagement(postId: string, engagement: { likes: number; replies: number; reposts: number }) {
    const post = this.trackedPosts.find(p => p.postId === postId && !p.collected);
    if (!post) return;

    if (engagement.likes + engagement.replies + engagement.reposts > 0) {
      SocialLearner.recordInteraction({
        platform: post.platform,
        content: post.text,
        timestamp: new Date(post.timestamp).toISOString(),
        engagement,
        sentiment: 'neutral',
      });
    }

    post.collected = true;
    this.saveState();
  }

  getTrackedCount(): number {
    return this.trackedPosts.length;
  }

  getUncollectedCount(): number {
    return this.trackedPosts.filter(p => !p.collected).length;
  }

  /**
   * Get uncollected Discord posts (for discordAgent to collect reactions).
   */
  getUncollectedDiscordPosts(): { postId: string }[] {
    const now = Date.now();
    return this.trackedPosts
      .filter(p => p.platform === 'discord' && !p.collected && now - p.timestamp > 3600000 && now - p.timestamp < 172800000)
      .map(p => ({ postId: p.postId }));
  }
}

export default new EngagementCollector();

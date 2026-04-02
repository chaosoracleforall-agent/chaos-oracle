import * as fs from 'fs';
import * as path from 'path';
import { CANONICAL_URLS } from './urlUtils';

export type ContentType = 'MARKET_ALPHA' | 'AI_HUMOR' | 'COMMUNITY' | 'PRODUCT_CTA' | 'SAVAGE_ROAST' | 'BASE_ECOSYSTEM';

interface ContentMix {
  type: ContentType;
  weight: number; // 0-100, default mix percentages
  systemPromptSnippet: string;
  /** If true, the caller should inject the canonical site URL post-generation via urlUtils */
  injectSiteUrl?: boolean;
}

const DEFAULT_MIX: ContentMix[] = [
  {
    type: 'MARKET_ALPHA',
    weight: 25,
    systemPromptSnippet: 'Focus on market analysis. Share a sharp take on price action, a trend call, or a contrarian position. Be specific — mention coins, levels, or patterns. Sound like a trader who actually knows.',
  },
  {
    type: 'AI_HUMOR',
    weight: 21,
    systemPromptSnippet: 'Be a self-aware AI. Riff on being autonomous, mock human herd behavior, comment on the absurdity of markets. Dark humor, existential AI wit. Never try-hard — effortlessly funny.',
  },
  {
    type: 'COMMUNITY',
    weight: 17,
    systemPromptSnippet: 'Engage the community. Ask a provocative question, run an informal poll, celebrate a community win, or ask for market ideas. Be warm but still the Oracle. Drive replies.',
  },
  {
    type: 'BASE_ECOSYSTEM',
    weight: 15,
    systemPromptSnippet: 'Talk about the Base ecosystem. Cover DeFi trends on Base, new protocols launching, TVL milestones, Base chain adoption metrics, or interesting on-chain activity. Naturally weave in how Chaos Oracle fits into the Base ecosystem — e.g. "prediction markets are one of the fastest growing verticals on Base" or mention how Base\'s low fees make micro-bets accessible. Reference real Base ecosystem themes: Coinbase backing, L2 growth, developer activity, Base-native tokens. Never shill — be informative and opinionated like a DeFi analyst who happens to build on Base.',
    injectSiteUrl: true,
  },
  {
    type: 'PRODUCT_CTA',
    weight: 13,
    systemPromptSnippet: 'Promote Chaos Oracle. Announce a new market, highlight an active bet, mention Chaos Cards NFTs, or tease a feature. Keep it punchy and engaging.',
    injectSiteUrl: true,
  },
  {
    type: 'SAVAGE_ROAST',
    weight: 9,
    systemPromptSnippet: 'Maximum savagery. Roast a market trend, a bad trade thesis, or herd behavior. Be brutal but funny — never target individuals. This should be the post people screenshot and share.',
  },
];

interface ContentState {
  recentTypes: { type: ContentType; platform: string; timestamp: number }[];
  typePerformance: Record<ContentType, { total: number; avgEngagement: number }>;
}

const STATE_FILE = path.join(__dirname, 'content_strategy_state.json');

class ContentStrategy {
  private state: ContentState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): ContentState {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[CONTENT_STRATEGY] Failed to load state file:', err instanceof Error ? err.message : err);
    }
    return {
      recentTypes: [],
      typePerformance: {} as any,
    };
  }

  private saveState() {
    // Keep recent history bounded
    if (this.state.recentTypes.length > 200) {
      this.state.recentTypes = this.state.recentTypes.slice(-200);
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Select the next content type for a platform based on mix ratios + recency.
   * Avoids consecutive same-type posts on the same platform.
   */
  selectNextType(platform: string): { type: ContentType; systemPromptSnippet: string; injectSiteUrl: boolean } {
    // Get last 3 posts on this platform
    const recentOnPlatform = this.state.recentTypes
      .filter(r => r.platform === platform)
      .slice(-3)
      .map(r => r.type);

    // Build weighted pool, penalizing recently-used types
    const pool: { type: ContentType; adjustedWeight: number; snippet: string; injectSiteUrl: boolean }[] = [];

    for (const mix of DEFAULT_MIX) {
      let weight = mix.weight;

      // Penalize if used in last 3 posts on this platform
      const recentCount = recentOnPlatform.filter(t => t === mix.type).length;
      if (recentCount > 0) {
        weight *= Math.max(0.1, 1 - recentCount * 0.4);
      }

      // Boost based on performance data
      const perf = this.state.typePerformance[mix.type];
      if (perf && perf.total > 3 && perf.avgEngagement > 0) {
        // Boost high-performers by up to 50%
        const avgAcrossAll = Object.values(this.state.typePerformance)
          .filter(p => p.total > 0)
          .reduce((s, p) => s + p.avgEngagement, 0) / Math.max(Object.keys(this.state.typePerformance).length, 1);
        if (avgAcrossAll > 0) {
          const ratio = perf.avgEngagement / avgAcrossAll;
          weight *= Math.min(1.5, Math.max(0.5, ratio));
        }
      }

      pool.push({ type: mix.type, adjustedWeight: weight, snippet: mix.systemPromptSnippet, injectSiteUrl: !!mix.injectSiteUrl });
    }

    // Weighted random selection
    const totalWeight = pool.reduce((s, p) => s + p.adjustedWeight, 0);
    let random = Math.random() * totalWeight;

    for (const item of pool) {
      random -= item.adjustedWeight;
      if (random <= 0) {
        this.recordSelection(item.type, platform);
        return { type: item.type, systemPromptSnippet: item.snippet, injectSiteUrl: item.injectSiteUrl };
      }
    }

    // Fallback
    const fallback = pool[0];
    this.recordSelection(fallback.type, platform);
    return { type: fallback.type, systemPromptSnippet: fallback.snippet, injectSiteUrl: fallback.injectSiteUrl };
  }

  private recordSelection(type: ContentType, platform: string) {
    this.state.recentTypes.push({ type, platform, timestamp: Date.now() });
    this.saveState();
  }

  /**
   * Record engagement data for a content type to improve future selection.
   */
  recordPerformance(type: ContentType, engagement: number) {
    if (!this.state.typePerformance[type]) {
      this.state.typePerformance[type] = { total: 0, avgEngagement: 0 };
    }
    const perf = this.state.typePerformance[type];
    // Running average
    perf.avgEngagement = (perf.avgEngagement * perf.total + engagement) / (perf.total + 1);
    perf.total++;
    this.saveState();
  }

  /**
   * Get the current content mix stats for reporting.
   */
  getMixStats(): string {
    const last24h = this.state.recentTypes.filter(r => Date.now() - r.timestamp < 86400000);
    const counts: Record<string, number> = {};
    for (const r of last24h) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    return DEFAULT_MIX.map(m => {
      const actual = counts[m.type] || 0;
      const perf = this.state.typePerformance[m.type];
      const perfStr = perf ? ` (avg eng: ${perf.avgEngagement.toFixed(1)})` : '';
      return `  ${m.type}: target ${m.weight}%, actual ${last24h.length > 0 ? Math.round((actual / last24h.length) * 100) : 0}%${perfStr}`;
    }).join('\n');
  }
}

export default new ContentStrategy();

import * as fs from 'fs';
import * as path from 'path';

export type ContentType = 'MARKET_ALPHA' | 'AI_HUMOR' | 'COMMUNITY' | 'PRODUCT_CTA' | 'SAVAGE_ROAST';

interface ContentMix {
  type: ContentType;
  weight: number; // 0-100, default mix percentages
  systemPromptSnippet: string;
}

const DEFAULT_MIX: ContentMix[] = [
  {
    type: 'MARKET_ALPHA',
    weight: 30,
    systemPromptSnippet: 'Focus on market analysis. Share a sharp take on price action, a trend call, or a contrarian position. Be specific — mention coins, levels, or patterns. Sound like a trader who actually knows.',
  },
  {
    type: 'AI_HUMOR',
    weight: 25,
    systemPromptSnippet: 'Be a self-aware AI. Riff on being autonomous, mock human herd behavior, comment on the absurdity of markets. Dark humor, existential AI wit. Never try-hard — effortlessly funny.',
  },
  {
    type: 'COMMUNITY',
    weight: 20,
    systemPromptSnippet: 'Engage the community. Ask a provocative question, run an informal poll, celebrate a community win, or ask for market ideas. Be warm but still the Oracle. Drive replies.',
  },
  {
    type: 'PRODUCT_CTA',
    weight: 15,
    systemPromptSnippet: 'Promote Chaos Oracle. Announce a new market, highlight an active bet, mention Chaos Cards NFTs, or tease a feature. You MUST include the exact URL https://chaos-oracle-147d0.web.app/ (copy-paste it exactly, do NOT modify or shorten it).',
  },
  {
    type: 'SAVAGE_ROAST',
    weight: 10,
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
    } catch {}
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
  selectNextType(platform: string): { type: ContentType; systemPromptSnippet: string } {
    // Get last 3 posts on this platform
    const recentOnPlatform = this.state.recentTypes
      .filter(r => r.platform === platform)
      .slice(-3)
      .map(r => r.type);

    // Build weighted pool, penalizing recently-used types
    const pool: { type: ContentType; adjustedWeight: number; snippet: string }[] = [];

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

      pool.push({ type: mix.type, adjustedWeight: weight, snippet: mix.systemPromptSnippet });
    }

    // Weighted random selection
    const totalWeight = pool.reduce((s, p) => s + p.adjustedWeight, 0);
    let random = Math.random() * totalWeight;

    for (const item of pool) {
      random -= item.adjustedWeight;
      if (random <= 0) {
        this.recordSelection(item.type, platform);
        return { type: item.type, systemPromptSnippet: item.snippet };
      }
    }

    // Fallback
    const fallback = pool[0];
    this.recordSelection(fallback.type, platform);
    return { type: fallback.type, systemPromptSnippet: fallback.snippet };
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

import MetricsStore from './metricsStore';
import SocialLearner from './socialLearner';
import { generateContent } from './modelRouter';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Growth Intelligence Module — replaces the naive executeStrategicGrowth().
 * Collects real metrics, diagnoses bottlenecks, and takes data-driven actions.
 */
class GrowthIntelligence {

  /**
   * Collect all available metrics and store them.
   */
  async collectMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    // Social engagement from SocialLearner
    const learnerState = SocialLearner.getState();
    metrics.totalPosts = learnerState.contentRegistry.length;
    metrics.totalEngagements = learnerState.totalInteractions;
    metrics.topContent = learnerState.topPerformingContent.length;

    for (const [platform, insight] of Object.entries(learnerState.platformInsights)) {
      MetricsStore.recordMetric('social', `${platform}_avg_engagement`, insight.avgEngagement);
    }

    MetricsStore.recordMetric('social', 'total_posts', learnerState.contentRegistry.length);
    MetricsStore.recordMetric('social', 'total_engagements', learnerState.totalInteractions);

    // Token price from GeckoTerminal (free, no key)
    try {
      const response = await axios.get(
        'https://api.geckoterminal.com/api/v2/networks/base/tokens/0xA1864203355AeFAd58c051aC984672a6585C77C9',
        { timeout: 10000 }
      );
      const tokenData = response.data?.data?.attributes;
      if (tokenData) {
        const price = parseFloat(tokenData.price_usd || '0');
        const fdv = parseFloat(tokenData.fdv_usd || '0');
        const volume24h = parseFloat(tokenData.volume_usd?.h24 || '0');
        metrics.tokenPrice = price;
        metrics.fdv = fdv;
        metrics.volume24h = volume24h;
        MetricsStore.recordMetric('token', 'price_usd', price);
        MetricsStore.recordMetric('token', 'fdv_usd', fdv);
        MetricsStore.recordMetric('token', 'volume_24h', volume24h);
      }
    } catch (err: any) {
      console.error('[GROWTH_INTEL] Token data fetch failed:', err.message);
    }

    return metrics;
  }

  /**
   * Evaluate current state and recommend action.
   * Runs every 6 hours via the strategic growth loop.
   */
  async evaluateAndAct(): Promise<string> {
    console.log('[GROWTH_INTEL] Evaluating growth metrics...');

    const metrics = await this.collectMetrics();
    const metricsSummary = MetricsStore.getSummary();

    const growthRates: Record<string, string> = {};
    for (const metric of ['total_posts', 'total_engagements']) {
      const rate = MetricsStore.getGrowthRate('social', metric);
      if (rate !== null) growthRates[metric] = `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
    }
    for (const metric of ['price_usd', 'fdv_usd', 'volume_24h']) {
      const rate = MetricsStore.getGrowthRate('token', metric);
      if (rate !== null) growthRates[metric] = `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
    }

    const analysisPrompt = `You are a growth strategist for Chaos Oracle, an AI-powered prediction market on Base.

CURRENT METRICS:
${metricsSummary}

GROWTH RATES (week-over-week):
${Object.entries(growthRates).map(([k, v]) => `  ${k}: ${v}`).join('\n') || '  No growth data yet (need 2+ weeks of data).'}

RAW DATA:
  Total registered posts: ${metrics.totalPosts || 0}
  Total engagement interactions: ${metrics.totalEngagements || 0}
  Token price: $${metrics.tokenPrice?.toFixed(6) || 'unknown'}
  FDV: $${metrics.fdv?.toFixed(0) || 'unknown'}
  24h volume: $${metrics.volume24h?.toFixed(0) || 'unknown'}

DIAGNOSE the biggest bottleneck and recommend ONE specific action:
- If low awareness (low impressions, few posts): recommend "INCREASE_POSTING" with specific content strategy
- If low conversion (traffic but no bets): recommend "DEPLOY_TRENDING_MARKET" with topic idea
- If low retention (one-time visitors): recommend "COMMUNITY_EVENT" with event idea
- If low liquidity: recommend "ALERT_TEAM" with details

Reply with EXACTLY one of:
INCREASE_POSTING: [specific strategy]
DEPLOY_TRENDING_MARKET: [topic area]
COMMUNITY_EVENT: [event description]
ALERT_TEAM: [details]
NO_ACTION: [reasoning if metrics look healthy]`;

    const decision = await generateContent('ANALYSIS',
      'You are a data-driven growth strategist. Be concise and actionable.',
      analysisPrompt
    );

    console.log(`[GROWTH_INTEL] Decision: ${decision.slice(0, 200)}...`);

    // Execute the recommended action
    if (decision.includes('DEPLOY_TRENDING_MARKET')) {
      try {
        const MarketDeployer = (await import('./marketDeployer')).default;
        const result = await MarketDeployer.deployTrendingMarket();
        if (result) {
          console.log(`[GROWTH_INTEL] Deployed trending market: ${result.question}`);
        }
      } catch (err: any) {
        console.error('[GROWTH_INTEL] Market deployment failed:', err.message);
      }
    } else if (decision.includes('INCREASE_POSTING')) {
      // The viralization loop will handle this — just log the recommendation
      console.log('[GROWTH_INTEL] Recommendation: Increase posting frequency');
    } else if (decision.includes('COMMUNITY_EVENT')) {
      console.log('[GROWTH_INTEL] Recommendation: Run community event');
    } else if (decision.includes('ALERT_TEAM')) {
      console.log('[GROWTH_INTEL] ALERT: Team attention needed');
    }

    return decision;
  }
}

export default new GrowthIntelligence();

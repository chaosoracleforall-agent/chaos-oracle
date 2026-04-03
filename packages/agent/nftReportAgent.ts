/**
 * NFT Campaign Report Agent
 *
 * Generates and sends NFT campaign performance reports every 4 hours.
 * Reports include: mints, claims, tier breakdown, wallet balance,
 * error rates, and campaign health.
 */

import NFTEngine from './nftEngine';
import EmailAgent from './emailAgent';
import * as dotenv from 'dotenv';
dotenv.config();

const REPORT_EMAIL = process.env.EMAIL || 'chaosoracleforall@gmail.com';

class NFTReportAgent {
  private lastReportTime = 0;

  async generateAndSendReport(): Promise<void> {
    console.log('[NFT_REPORT] Generating campaign report...');

    try {
      const report = await this.buildReport();
      console.log(`[NFT_REPORT] Report built (${report.length} chars)`);

      await EmailAgent.sendPredatoryEmail(
        REPORT_EMAIL,
        `[CHAOS NFT] Campaign Report — ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
        report
      );

      this.lastReportTime = Date.now();
      console.log('[NFT_REPORT] Report sent to', REPORT_EMAIL);
    } catch (err: any) {
      console.error('[NFT_REPORT] Failed to send report:', err.message);
    }
  }

  private async buildReport(): Promise<string> {
    const now = new Date();
    const state = NFTEngine.getState();

    // On-chain stats
    let onChainStats = '';
    let walletBalance = 'N/A';
    let campaignStatus = 'UNKNOWN';

    if (NFTEngine.isReady()) {
      try {
        onChainStats = await NFTEngine.getCampaignStats();
        campaignStatus = onChainStats.includes('ACTIVE') ? 'ACTIVE' : 'PAUSED';
      } catch {
        onChainStats = '  (failed to read on-chain stats)';
      }

      try {
        const health = await NFTEngine.healthCheck();
        if (!health.healthy) {
          onChainStats += '\n  ISSUES: ' + health.issues.join(' | ');
        }
        // Extract balance from health check issues if low
        const balIssue = health.issues.find(i => i.includes('balance'));
        if (balIssue) walletBalance = balIssue;
      } catch (err) {
        console.warn('[NFT_REPORT] Failed to get NFT health check:', err instanceof Error ? err.message : err);
      }
    } else {
      campaignStatus = 'NOT CONFIGURED';
      onChainStats = '  NFT Engine not ready (missing env vars)';
    }

    // Mint log analysis (defensive defaults in case state was reset to {})
    const last4h = Date.now() - 4 * 3600000;
    const last24h = Date.now() - 24 * 3600000;

    const mintLog = state.mintLog || [];
    const errors = state.errors || [];
    const pendingClaimsMap = state.pendingClaims || {};
    const dailyMintsMap = state.dailyMints || {};

    const mintsLast4h = mintLog.filter(m => m.timestamp > last4h);
    const mintsLast24h = mintLog.filter(m => m.timestamp > last24h);

    // Tier breakdown (last 24h)
    const tierCount24h: Record<string, number> = {};
    for (const m of mintsLast24h) {
      tierCount24h[m.tier] = (tierCount24h[m.tier] || 0) + 1;
    }

    // Unique recipients (last 24h)
    const uniqueRecipients24h = new Set(mintsLast24h.map(m => m.recipient)).size;

    // Errors
    const errorsLast4h = errors.filter(e => e.timestamp > last4h);
    const errorsLast24h = errors.filter(e => e.timestamp > last24h);

    // Pending claims
    const pendingClaims = Object.entries(pendingClaimsMap);
    const expiredClaims = pendingClaims.filter(([_, c]) => Date.now() - c.createdAt > 24 * 3600000);

    // Today's daily mint count
    const today = now.toDateString();
    const dailyCount = dailyMintsMap[today] || 0;

    // Recent mint details (last 5)
    const recentMints = mintLog.slice(-5).reverse();

    // Build report
    const sections = [
      `═══════════════════════════════════════════`,
      `  CHAOS CARDS — NFT CAMPAIGN REPORT`,
      `  ${now.toUTCString()}`,
      `═══════════════════════════════════════════`,
      ``,
      `▸ CAMPAIGN STATUS: ${campaignStatus}`,
      `▸ CONTRACT: ${process.env.CHAOS_CARDS_CONTRACT || 'Not deployed'}`,
      `▸ WALLET: ${process.env.AGENT_PUBLIC_ADDRESS || 'N/A'}`,
      ``,
      `───────── ON-CHAIN STATS ─────────`,
      onChainStats,
      ``,
      `───────── MINTING ACTIVITY ─────────`,
      `  Total minted (all time): ${state.totalMinted || 0}`,
      `  Minted today: ${dailyCount}`,
      `  Minted (last 4h): ${mintsLast4h.length}`,
      `  Minted (last 24h): ${mintsLast24h.length}`,
      `  Unique recipients (24h): ${uniqueRecipients24h}`,
      ``,
      `───────── TIER BREAKDOWN (24h) ─────────`,
      `  Prophecy:        ${tierCount24h['Prophecy'] || 0}`,
      `  RektCertificate: ${tierCount24h['RektCertificate'] || 0}`,
      `  ChaosDisciple:   ${tierCount24h['ChaosDisciple'] || 0}`,
      `  ChaosTarot:      ${tierCount24h['ChaosTarot'] || 0}`,
      `  OracleSpeaks:    ${tierCount24h['OracleSpeaks'] || 0}`,
      ``,
      `───────── CLAIMS ─────────`,
      `  Pending claims: ${pendingClaims.length}`,
      `  Expired (>24h): ${expiredClaims.length}`,
      ``,
      `───────── ERRORS ─────────`,
      `  Errors (last 4h): ${errorsLast4h.length}`,
      `  Errors (last 24h): ${errorsLast24h.length}`,
    ];

    if (errorsLast4h.length > 0) {
      sections.push(`  Recent errors:`);
      for (const e of errorsLast4h.slice(-5)) {
        const time = new Date(e.timestamp).toLocaleTimeString();
        sections.push(`    [${time}] ${e.message.slice(0, 120)}`);
      }
    }

    sections.push(``);
    sections.push(`───────── RECENT MINTS ─────────`);
    if (recentMints.length === 0) {
      sections.push(`  No mints recorded yet.`);
    } else {
      for (const m of recentMints) {
        const time = new Date(m.timestamp).toLocaleTimeString();
        const addr = m.recipient.slice(0, 6) + '...' + m.recipient.slice(-4);
        sections.push(`  [${time}] #${m.tokenId} ${m.tier} → ${addr} (${m.txHash.slice(0, 10)}...)`);
      }
    }

    sections.push(``);
    sections.push(`───────── BUDGET ─────────`);
    sections.push(`  Replicate: ~$0.003/image (Flux Schnell)`);
    sections.push(`  IPFS: Pinata free tier (500 pins/month)`);
    sections.push(`  Gas: ~$0.001/mint (Base)`);
    sections.push(`  Est. cost (24h): ~$${((mintsLast24h.length * 0.004) || 0).toFixed(2)}`);
    sections.push(``);
    sections.push(`═══════════════════════════════════════════`);
    sections.push(`  Report generated by Chaos Oracle Agent`);
    sections.push(`  BaseScan: https://basescan.org/address/${process.env.CHAOS_CARDS_CONTRACT || ''}`);
    sections.push(`═══════════════════════════════════════════`);

    return sections.join('\n');
  }
}

export default new NFTReportAgent();

import * as fs from 'fs';
import * as path from 'path';

interface Referral {
  referrer: string; // wallet address prefix
  referee: string;  // wallet address (if known)
  timestamp: number;
  nftTier?: string;
}

interface ReferralState {
  referrals: Referral[];
  airdropsSent: Record<string, number>; // referrer → count of bonus airdrops
}

const STATE_FILE = path.join(__dirname, 'referral_state.json');
const REFERRAL_THRESHOLD = 3; // Referrals needed for bonus airdrop

class ReferralEngine {
  private state: ReferralState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): ReferralState {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {}
    return { referrals: [], airdropsSent: {} };
  }

  private saveState() {
    if (this.state.referrals.length > 1000) {
      this.state.referrals = this.state.referrals.slice(-1000);
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Record a referral when someone claims an NFT via a referral link.
   */
  recordReferral(referrerPrefix: string, refereeAddress?: string, nftTier?: string) {
    this.state.referrals.push({
      referrer: referrerPrefix,
      referee: refereeAddress || 'unknown',
      timestamp: Date.now(),
      nftTier,
    });
    this.saveState();
    console.log(`[REFERRAL] Recorded: ${referrerPrefix} → ${refereeAddress?.slice(0, 10) || 'unknown'}`);
  }

  /**
   * Get referral count for a specific referrer.
   */
  getReferralCount(referrerPrefix: string): number {
    return this.state.referrals.filter(r => r.referrer === referrerPrefix).length;
  }

  /**
   * Check which referrers have earned bonus airdrops but haven't received them.
   */
  getPendingAirdrops(): { referrer: string; referralCount: number }[] {
    const counts: Record<string, number> = {};
    for (const r of this.state.referrals) {
      counts[r.referrer] = (counts[r.referrer] || 0) + 1;
    }

    const pending: { referrer: string; referralCount: number }[] = [];
    for (const [referrer, count] of Object.entries(counts)) {
      const airdropsEarned = Math.floor(count / REFERRAL_THRESHOLD);
      const airdropsSent = this.state.airdropsSent[referrer] || 0;
      if (airdropsEarned > airdropsSent) {
        pending.push({ referrer, referralCount: count });
      }
    }

    return pending;
  }

  /**
   * Mark an airdrop as sent for a referrer.
   */
  recordAirdropSent(referrerPrefix: string) {
    this.state.airdropsSent[referrerPrefix] = (this.state.airdropsSent[referrerPrefix] || 0) + 1;
    this.saveState();
  }

  /**
   * Get referral stats for reporting.
   */
  getStats(): string {
    const uniqueReferrers = new Set(this.state.referrals.map(r => r.referrer)).size;
    const total = this.state.referrals.length;
    const airdrops = Object.values(this.state.airdropsSent).reduce((s, v) => s + v, 0);

    return `[REFERRAL] Total: ${total}, Unique referrers: ${uniqueReferrers}, Airdrops sent: ${airdrops}`;
  }
}

export default new ReferralEngine();

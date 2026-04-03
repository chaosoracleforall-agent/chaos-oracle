import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import {
  createPublicClient,
  decodeEventLog,
  fallback,
  formatEther,
  http,
  parseAbi,
  parseAbiItem,
  toEventSelector,
} from 'viem';
import { base } from 'viem/chains';
import NFTEngine from './nftEngine';

dotenv.config();

type CampaignType = 'FIRST_BET_BLITZ' | 'REFERRAL_RACE' | 'STREAK_SURGE' | 'LEADERBOARD_LADDER';
type RewardStatus = 'pending' | 'issued' | 'failed';
type RewardTier = 'Prophecy' | 'ChaosDisciple' | 'ChaosTarot' | 'OracleSpeaks';
type NotificationType = 'discord_dm';
type EventType = 'bet' | 'resolve';

interface CampaignRecord {
  id: string;
  type: CampaignType;
  startsAt: number;
  endsAt: number;
  announcementSent: boolean;
  leaderboardPostedAt: number;
}

interface MarketPosition {
  marketId: number;
  question: string;
  yesWei: string;
  noWei: string;
  firstSeenAt: number;
  lastSeenAt: number;
  resolved: boolean;
  result?: boolean;
  settledAt?: number;
  payoutEvaluated: boolean;
}

interface WalletGrowthProfile {
  wallet: string;
  userId?: string;
  firstBetAt?: number;
  totalBets: number;
  totalVolumeWei: string;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  points: number;
  positions: Record<string, MarketPosition>;
}

interface GrowthUser {
  userId: string;
  platform: 'discord';
  handle: string;
  wallet?: string;
  referralCode?: string;
  referredByCode?: string;
  referredByUserId?: string;
  joinedAt: number;
  successfulReferrals: number;
  totalReferrals: number;
  firstBetRewardIssued: boolean;
  firstWinRewardIssued: boolean;
  rewardMilestones: string[];
  points: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  totalBets: number;
  pendingClaimCodes: string[];
  lastUpdated: number;
}

interface ReferralCodeRecord {
  code: string;
  ownerUserId: string;
  createdAt: number;
  convertedWallets: string[];
}

interface RewardRecord {
  key: string;
  userId: string;
  wallet: string;
  title: string;
  description: string;
  tier: RewardTier;
  status: RewardStatus;
  attempts: number;
  claimCode?: string;
  claimURL?: string;
  metadataURI?: string;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
  traits: Record<string, string>;
}

interface GrowthNotification {
  id: string;
  type: NotificationType;
  userId: string;
  message: string;
  createdAt: number;
  attempts: number;
}

interface GrowthCheckpointState {
  lastProcessedBlock?: number;
  lastCampaignWeekKey?: string;
  lastLeaderboardDigest?: string;
  eventCursors?: Record<EventType, {
    lastProcessedBlock?: number;
    lastHealthyBlock?: number;
    lastError?: string;
    lastProvider?: string;
    updatedAt?: number;
  }>;
}

interface ReplayQueueEntry {
  id: string;
  eventType: EventType;
  fromBlock: number;
  toBlock: number;
  attempts: number;
  createdAt: number;
  nextRetryAt: number;
  lastError?: string;
  lastProvider?: string;
}

interface GrowthState {
  version: 1;
  campaigns: {
    current?: CampaignRecord;
    history: CampaignRecord[];
  };
  users: Record<string, GrowthUser>;
  wallets: Record<string, WalletGrowthProfile>;
  referralCodes: Record<string, ReferralCodeRecord>;
  rewards: Record<string, RewardRecord>;
  notifications: GrowthNotification[];
  marketQuestions: Record<string, string>;
  checkpoints: GrowthCheckpointState;
  processedLogIds: string[];
  replayQueue: ReplayQueueEntry[];
}

interface GrowthCycleResult {
  syncedBetEvents: number;
  syncedResolveEvents: number;
  processedRewards: number;
  notifications: GrowthNotification[];
  campaignAnnouncement?: string;
  leaderboardAnnouncement?: string;
  streakShoutouts: string[];
}

interface RewardSnapshot {
  pending: number;
  issued: number;
  failed: number;
  pendingClaimCodes: number;
  firstBetRewardIssued: boolean;
  firstWinRewardIssued: boolean;
}

interface FirstBetDetectionSnapshot {
  walletRegistered: boolean;
  firstBetSeen: boolean;
  firstBetAt?: number;
  totalBets: number;
  totalPoints: number;
  referredByCode?: string;
}

const STATE_FILE = path.join(__dirname, 'growth_engine_state.json');
const CONTRACT_ADDRESS = () => (process.env.CONTRACT_ADDRESS || '').trim() as `0x${string}`;
const LOOKBACK_BLOCKS = BigInt(parseInt(process.env.GROWTH_LOOKBACK_BLOCKS || '150000', 10));
const LEADERBOARD_POST_INTERVAL_MS = parseInt(process.env.GROWTH_LEADERBOARD_INTERVAL_MS || `${12 * 60 * 60 * 1000}`, 10);
const LOG_CHUNK_SIZE = 2000n;
const LOG_CHUNK_RETRIES = 3;
const REPLAY_RETRY_BASE_MS = 60_000;
const MAX_REPLAY_ATTEMPTS = 8;
const MAX_PRIMARY_SCAN_BLOCKS = 12_000n;
const RECENT_TIP_LOOKBACK_BLOCKS = 4_000n;
const BASESCAN_V2_LOGS_URL = 'https://api.etherscan.io/v2/api';

const MARKET_ABI = parseAbi([
  'function markets(uint256) view returns (string question, uint256 totalYes, uint256 totalNo, bool resolved, bool result, uint256 ethPool, uint256 finalFee)',
]);
const BET_PLACED_EVENT = parseAbiItem('event BetPlaced(uint256 indexed marketId, address indexed user, bool betYes, uint256 amount)');
const MARKET_RESOLVED_EVENT = parseAbiItem('event MarketResolved(uint256 indexed marketId, bool result)');
const BET_PLACED_TOPIC = toEventSelector(BET_PLACED_EVENT);
const MARKET_RESOLVED_TOPIC = toEventSelector(MARKET_RESOLVED_EVENT);

const CAMPAIGN_ROTATION: CampaignType[] = [
  'FIRST_BET_BLITZ',
  'REFERRAL_RACE',
  'STREAK_SURGE',
  'LEADERBOARD_LADDER',
];

function createDefaultState(): GrowthState {
  return {
    version: 1,
    campaigns: {
      history: [],
    },
    users: {},
    wallets: {},
    referralCodes: {},
    rewards: {},
    notifications: [],
    marketQuestions: {},
    checkpoints: {
      eventCursors: {
        bet: {},
        resolve: {},
      },
    },
    processedLogIds: [],
    replayQueue: [],
  };
}

function loadState(): GrowthState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return {
        ...createDefaultState(),
        ...parsed,
        campaigns: {
          ...createDefaultState().campaigns,
          ...(parsed.campaigns || {}),
          history: parsed?.campaigns?.history || [],
        },
        checkpoints: {
          ...createDefaultState().checkpoints,
          ...(parsed.checkpoints || {}),
          eventCursors: {
            ...createDefaultState().checkpoints.eventCursors,
            ...(parsed?.checkpoints?.eventCursors || {}),
          },
        },
        replayQueue: parsed?.replayQueue || [],
      };
    }
  } catch (err: any) {
    console.error('[GROWTH_ENGINE] Failed to load state:', err.message);
  }
  return createDefaultState();
}

function saveState(state: GrowthState): void {
  // Ensure arrays/objects exist before bounding (guards against reset state files)
  state.campaigns = state.campaigns || { history: [] };
  state.campaigns.history = state.campaigns.history || [];
  state.notifications = state.notifications || [];
  state.processedLogIds = state.processedLogIds || [];
  state.replayQueue = state.replayQueue || [];
  if (state.campaigns.history.length > 20) {
    state.campaigns.history = state.campaigns.history.slice(-20);
  }
  if (state.notifications.length > 200) {
    state.notifications = state.notifications.slice(-200);
  }
  if (state.processedLogIds.length > 5000) {
    state.processedLogIds = state.processedLogIds.slice(-5000);
  }
  if (state.replayQueue.length > 500) {
    state.replayQueue = state.replayQueue.slice(-500);
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function normalizeWallet(wallet: string): string {
  return wallet.toLowerCase();
}

function isValidWallet(wallet: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet.trim());
}

function addWei(a: string, b: bigint): string {
  return (BigInt(a || '0') + b).toString();
}

function getWeekKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - yearStart.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + yearStart.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function campaignIndexForWeek(weekKey: string): number {
  const match = weekKey.match(/W(\d+)/);
  const weekNumber = match ? parseInt(match[1], 10) : 1;
  return (weekNumber - 1) % CAMPAIGN_ROTATION.length;
}

function createReferralCode(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CHAOS-REF-${rand}`;
}

function now(): number {
  return Date.now();
}

function rewardTierForStreak(streak: number): RewardTier {
  if (streak >= 30) return 'OracleSpeaks';
  if (streak >= 7) return 'ChaosTarot';
  if (streak >= 3) return 'ChaosDisciple';
  return 'Prophecy';
}

/** Daily streak bonus multiplier applied to win points */
function streakBonusMultiplier(streak: number): number {
  if (streak >= 30) return 5;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

/** Streak milestones that trigger NFT mints */
const STREAK_NFT_MILESTONES = [3, 5, 7, 10, 15, 20, 30, 50, 100];

function currentCampaignDescription(type: CampaignType): string {
  switch (type) {
    case 'FIRST_BET_BLITZ':
      return 'Register your wallet, place your first bet, and unlock a first-bet NFT claim.';
    case 'REFERRAL_RACE':
      return 'Bring in new bettors with your referral code. Converted referrals earn you bonus NFT claims.';
    case 'STREAK_SURGE':
      return 'Win consecutive markets to build streaks and unlock escalating streak rewards.';
    case 'LEADERBOARD_LADDER':
      return 'Climb the weekly leaderboard through bets, wins, and referrals for champion rewards.';
  }
}

class GrowthEngine {
  private state: GrowthState = loadState();
  private pendingShoutouts: string[] = [];
  private providerUrls = Array.from(new Set([
    (process.env.BASE_RPC_URL || '').trim(),
    ...(process.env.BASE_RPC_FALLBACKS || '').split(',').map((url) => url.trim()).filter(Boolean),
    'https://base.llamarpc.com',
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
  ].filter(Boolean)));
  private client = createPublicClient({
    chain: base,
    transport: fallback([
      http(process.env.BASE_RPC_URL || 'https://base.llamarpc.com'),
      http('https://mainnet.base.org'),
    ], { retryCount: 2 }),
  });
  private logClients = this.providerUrls.map((url) => ({
    url,
    client: createPublicClient({ chain: base, transport: http(url) }),
  }));

  private getEventCursor(eventType: EventType) {
    if (!this.state.checkpoints.eventCursors) {
      this.state.checkpoints.eventCursors = { bet: {}, resolve: {} };
    }
    return this.state.checkpoints.eventCursors[eventType];
  }

  private setEventCursor(eventType: EventType, patch: Partial<NonNullable<GrowthCheckpointState['eventCursors']>[EventType]>) {
    const cursor = this.getEventCursor(eventType);
    Object.assign(cursor, patch, { updatedAt: now() });
  }

  private ensureCampaign(): { campaign: CampaignRecord; announcement?: string } {
    const weekKey = getWeekKey();
    const existing = this.state.campaigns.current;
    if (existing && this.state.checkpoints.lastCampaignWeekKey === weekKey) {
      return {
        campaign: existing,
        announcement: existing.announcementSent ? undefined : this.buildCampaignAnnouncement(existing),
      };
    }

    const campaignType = CAMPAIGN_ROTATION[campaignIndexForWeek(weekKey)];
    const startsAt = Date.now();
    const endsAt = startsAt + 7 * 24 * 60 * 60 * 1000;

    if (existing) {
      this.queueCampaignWinners(existing);
      this.state.campaigns.history.push(existing);
    }

    const campaign: CampaignRecord = {
      id: `${weekKey}-${campaignType}`,
      type: campaignType,
      startsAt,
      endsAt,
      announcementSent: false,
      leaderboardPostedAt: 0,
    };
    this.state.campaigns.current = campaign;
    this.state.checkpoints.lastCampaignWeekKey = weekKey;
    saveState(this.state);

    return {
      campaign,
      announcement: this.buildCampaignAnnouncement(campaign),
    };
  }

  private getOrCreateUser(userId: string, handle: string): GrowthUser {
    const existing = this.state.users[userId];
    if (existing) {
      existing.handle = handle;
      existing.lastUpdated = now();
      return existing;
    }

    const created: GrowthUser = {
      userId,
      platform: 'discord',
      handle,
      joinedAt: now(),
      successfulReferrals: 0,
      totalReferrals: 0,
      firstBetRewardIssued: false,
      firstWinRewardIssued: false,
      rewardMilestones: [],
      points: 0,
      wins: 0,
      losses: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalBets: 0,
      pendingClaimCodes: [],
      lastUpdated: now(),
    };
    this.state.users[userId] = created;
    return created;
  }

  private getOrCreateWallet(wallet: string): WalletGrowthProfile {
    const normalized = normalizeWallet(wallet);
    const existing = this.state.wallets[normalized];
    if (existing) return existing;
    const created: WalletGrowthProfile = {
      wallet: normalized,
      totalBets: 0,
      totalVolumeWei: '0',
      wins: 0,
      losses: 0,
      currentStreak: 0,
      bestStreak: 0,
      points: 0,
      positions: {},
    };
    this.state.wallets[normalized] = created;
    return created;
  }

  private pointsForBet(isFirstBet: boolean): number {
    const campaignType = this.state.campaigns.current?.type;
    let points = isFirstBet ? 30 : 10;
    if (campaignType === 'FIRST_BET_BLITZ' && isFirstBet) points += 20;
    return points;
  }

  private pointsForWin(currentStreak: number): number {
    const campaignType = this.state.campaigns.current?.type;
    let points = 25 + Math.max(0, currentStreak - 1) * 10;
    if (campaignType === 'STREAK_SURGE') points += 15;
    // Apply daily streak bonus multiplier: 3-day=1.5x, 7-day=2x, 30-day=5x
    points = Math.round(points * streakBonusMultiplier(currentStreak));
    return points;
  }

  private pointsForReferral(): number {
    return this.state.campaigns.current?.type === 'REFERRAL_RACE' ? 90 : 50;
  }

  private markProcessed(logId: string): void {
    this.state.processedLogIds.push(logId);
  }

  private alreadyProcessed(logId: string): boolean {
    return this.state.processedLogIds.includes(logId);
  }

  private async getMarketQuestion(marketId: bigint): Promise<string> {
    const key = marketId.toString();
    if (this.state.marketQuestions[key]) return this.state.marketQuestions[key];

    try {
      const market = await this.client.readContract({
        address: CONTRACT_ADDRESS(),
        abi: MARKET_ABI,
        functionName: 'markets',
        args: [marketId],
      }) as readonly [string, bigint, bigint, boolean, boolean, bigint, bigint];
      this.state.marketQuestions[key] = market[0];
      return market[0];
    } catch {
      return `Market #${marketId}`;
    }
  }

  private queueNotification(userId: string, message: string): void {
    this.state.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'discord_dm',
      userId,
      message,
      createdAt: now(),
      attempts: 0,
    });
  }

  private queueReward(
    userId: string,
    wallet: string,
    key: string,
    title: string,
    description: string,
    tier: RewardTier,
    traits: Record<string, string>,
  ): void {
    if (this.state.rewards[key]) return;
    this.state.rewards[key] = {
      key,
      userId,
      wallet,
      title,
      description,
      tier,
      status: 'pending',
      attempts: 0,
      createdAt: now(),
      updatedAt: now(),
      traits,
    };
  }

  private async processPendingRewards(): Promise<number> {
    let processed = 0;
    for (const reward of Object.values(this.state.rewards)) {
      if (reward.status === 'issued') continue;
      if (reward.attempts >= 5) continue;
      if (!NFTEngine.isReady()) continue;

      reward.attempts += 1;
      reward.updatedAt = now();

      try {
        const claim = await NFTEngine.createGrowthRewardClaim({
          title: reward.title,
          description: reward.description,
          tier: reward.tier,
          recipientWallet: reward.wallet as `0x${string}`,
          rewardKey: reward.key,
          traits: reward.traits,
        });

        if (!claim) {
          reward.status = 'failed';
          reward.lastError = 'claim creation returned null';
          continue;
        }

        reward.status = 'issued';
        reward.claimCode = claim.claimCode;
        reward.claimURL = claim.claimURL;
        reward.metadataURI = claim.metadataURI;
        reward.lastError = undefined;
        reward.updatedAt = now();

        const user = this.state.users[reward.userId];
        if (user) {
          user.pendingClaimCodes.push(claim.claimCode);
          user.rewardMilestones.push(reward.key);
          user.lastUpdated = now();
        }

        this.queueNotification(
          reward.userId,
          [
            `CHAOS GROWTH REWARD UNLOCKED`,
            `${reward.title}`,
            reward.description,
            `Claim code: ${claim.claimCode}`,
            `Claim URL: ${claim.claimURL}`,
          ].join('\n')
        );
        processed++;
      } catch (err: any) {
        reward.status = 'failed';
        reward.lastError = err.message;
        reward.updatedAt = now();
      }
    }
    return processed;
  }

  private awardFirstBet(userId: string, wallet: string): void {
    const user = this.state.users[userId];
    if (!user || user.firstBetRewardIssued) return;
    user.firstBetRewardIssued = true;
    user.lastUpdated = now();

    this.queueReward(
      userId,
      wallet,
      `first-bet:${wallet}`,
      'First Bet Sigil',
      'You placed your first Chaos Oracle bet. The machine has noticed.',
      'ChaosDisciple',
      {
        Reward: 'First Bet',
        Campaign: this.state.campaigns.current?.type || 'UNKNOWN',
      }
    );
  }

  private awardFirstWin(userId: string, wallet: string, question: string): void {
    const user = this.state.users[userId];
    if (!user || user.firstWinRewardIssued) return;
    user.firstWinRewardIssued = true;
    user.lastUpdated = now();

    this.queueReward(
      userId,
      wallet,
      `first-win:${wallet}`,
      'First Correct Prophecy',
      `You won your first resolved market: "${question.slice(0, 120)}"`,
      'Prophecy',
      {
        Reward: 'First Correct Bet',
        Market: question.slice(0, 80),
      }
    );
  }

  private awardStreakMilestone(userId: string, wallet: string, streak: number): void {
    const key = `streak-${streak}:${wallet}`;
    if (this.state.rewards[key]) return;

    const tier = rewardTierForStreak(streak);
    const multiplier = streakBonusMultiplier(streak);
    const streakLabel = streak >= 30 ? 'LEGENDARY' : streak >= 7 ? 'EPIC' : streak >= 3 ? 'RISING' : 'INITIATE';

    this.queueReward(
      userId,
      wallet,
      key,
      `${streakLabel} Streak x${streak}`,
      `You hit a ${streak}-market win streak (${multiplier}x bonus active). The oracle rewards persistence.`,
      tier,
      {
        Reward: 'Win Streak',
        Streak: String(streak),
        BonusMultiplier: `${multiplier}x`,
        StreakTier: streakLabel,
      }
    );

    // Social shoutout for notable streaks (5+)
    if (streak >= 5) {
      const user = this.state.users[userId];
      const handle = user?.handle || wallet.slice(0, 8) + '...';
      this.pendingShoutouts.push(
        `${handle} just hit a ${streak}-win streak on Chaos Oracle! ${streakLabel} tier unlocked.`
      );
    }

    // Notify user about streak bonus activation at tier boundaries
    if ([3, 7, 30].includes(streak)) {
      this.queueNotification(
        userId,
        [
          `STREAK BONUS ACTIVATED: ${multiplier}x`,
          `Your ${streak}-win streak now earns ${multiplier}x points per win.`,
          streak < 30 ? `Next bonus tier: ${streak < 7 ? '7-streak (2x)' : '30-streak (5x)'}` : 'Maximum bonus reached. You are the Oracle.',
        ].join('\n')
      );
    }
  }

  private awardReferralConversion(referrerUserId: string, referrerWallet: string | undefined, referredWallet: string): void {
    if (!referrerWallet) return;
    const key = `referral-conversion:${referrerUserId}:${referredWallet}`;
    if (this.state.rewards[key]) return;
    this.queueReward(
      referrerUserId,
      referrerWallet,
      key,
      'Referral Conversion',
      'One of your referred users placed their first bet and converted into a live bettor.',
      'Prophecy',
      {
        Reward: 'Referral Conversion',
        ReferredWallet: referredWallet.slice(0, 10),
      }
    );
  }

  private awardReferralMilestone(referrerUserId: string, referrerWallet: string | undefined, milestone: number): void {
    if (!referrerWallet) return;
    const key = `referral-milestone:${milestone}:${referrerUserId}`;
    if (this.state.rewards[key]) return;
    this.queueReward(
      referrerUserId,
      referrerWallet,
      key,
      `Referral Milestone x${milestone}`,
      `You converted ${milestone} referred bettors into live market participants.`,
      milestone >= 3 ? 'ChaosDisciple' : 'Prophecy',
      {
        Reward: 'Referral Milestone',
        Referrals: String(milestone),
      }
    );
  }

  private registerReferralConversion(user: GrowthUser, wallet: string): void {
    if (!user.referredByCode || !user.referredByUserId) return;
    const codeRecord = this.state.referralCodes[user.referredByCode];
    if (!codeRecord) return;

    const normalizedWallet = normalizeWallet(wallet);
    if (codeRecord.convertedWallets.includes(normalizedWallet)) return;
    codeRecord.convertedWallets.push(normalizedWallet);

    const referrer = this.state.users[user.referredByUserId];
    if (!referrer) return;
    referrer.successfulReferrals += 1;
    referrer.points += this.pointsForReferral();
    referrer.lastUpdated = now();
    user.lastUpdated = now();

    const referrerWallet = referrer.wallet;
    this.awardReferralConversion(referrer.userId, referrerWallet, normalizedWallet);
    if ([3, 5].includes(referrer.successfulReferrals)) {
      this.awardReferralMilestone(referrer.userId, referrerWallet, referrer.successfulReferrals);
    }
  }

  private updateUserFromWallet(wallet: WalletGrowthProfile): void {
    if (!wallet.userId) return;
    const user = this.state.users[wallet.userId];
    if (!user) return;

    user.wallet = wallet.wallet;
    user.totalBets = wallet.totalBets;
    user.wins = wallet.wins;
    user.losses = wallet.losses;
    user.currentStreak = wallet.currentStreak;
    user.bestStreak = wallet.bestStreak;
    user.points = wallet.points;
    user.lastUpdated = now();
  }

  private async handleBetPlaced(log: any): Promise<void> {
    const marketId = Number(log.args.marketId);
    const wallet = normalizeWallet(log.args.user);
    const amount = log.args.amount as bigint;
    const betYes = log.args.betYes as boolean;
    const logId = `${log.transactionHash}:${log.logIndex}`;

    if (this.alreadyProcessed(logId)) return;

    const walletProfile = this.getOrCreateWallet(wallet);
    const isFirstBet = !walletProfile.firstBetAt;
    if (isFirstBet) {
      walletProfile.firstBetAt = now();
    }

    walletProfile.totalBets += 1;
    walletProfile.totalVolumeWei = addWei(walletProfile.totalVolumeWei, amount);
    walletProfile.points += this.pointsForBet(isFirstBet);

    const question = await this.getMarketQuestion(BigInt(marketId));
    const position = walletProfile.positions[String(marketId)] || {
      marketId,
      question,
      yesWei: '0',
      noWei: '0',
      firstSeenAt: now(),
      lastSeenAt: now(),
      resolved: false,
      payoutEvaluated: false,
    };

    if (betYes) {
      position.yesWei = addWei(position.yesWei, amount);
    } else {
      position.noWei = addWei(position.noWei, amount);
    }
    position.question = question;
    position.lastSeenAt = now();
    walletProfile.positions[String(marketId)] = position;

    if (walletProfile.userId) {
      const user = this.state.users[walletProfile.userId];
      if (user) {
        user.totalBets += 1;
        user.points = walletProfile.points;
        user.lastUpdated = now();
        if (isFirstBet) {
          this.awardFirstBet(user.userId, wallet);
          this.registerReferralConversion(user, wallet);
        }
      }
    }

    this.updateUserFromWallet(walletProfile);
    this.markProcessed(logId);
  }

  private async handleMarketResolved(log: any): Promise<void> {
    const marketId = String(Number(log.args.marketId));
    const result = log.args.result as boolean;
    const logId = `${log.transactionHash}:${log.logIndex}`;
    if (this.alreadyProcessed(logId)) return;

    for (const walletProfile of Object.values(this.state.wallets)) {
      const position = walletProfile.positions[marketId];
      if (!position || position.payoutEvaluated) continue;

      position.resolved = true;
      position.result = result;
      position.settledAt = now();

      const yesWei = BigInt(position.yesWei);
      const noWei = BigInt(position.noWei);
      const isHedged = yesWei > 0n && noWei > 0n;
      let won = false;
      let lost = false;

      if (!isHedged) {
        won = (result && yesWei > 0n) || (!result && noWei > 0n);
        lost = !won && (yesWei > 0n || noWei > 0n);
      }

      if (won) {
        walletProfile.wins += 1;
        walletProfile.currentStreak += 1;
        walletProfile.bestStreak = Math.max(walletProfile.bestStreak, walletProfile.currentStreak);
        walletProfile.points += this.pointsForWin(walletProfile.currentStreak);
      } else if (lost) {
        walletProfile.losses += 1;
        walletProfile.currentStreak = 0;
      }

      if (walletProfile.userId) {
        const user = this.state.users[walletProfile.userId];
        if (user) {
          if (won) {
            if (!user.firstWinRewardIssued) {
              this.awardFirstWin(user.userId, walletProfile.wallet, position.question);
            }
            // Check all streak NFT milestones (3, 5, 7, 10, 15, 20, 30, 50, 100)
            if (STREAK_NFT_MILESTONES.includes(walletProfile.currentStreak)) {
              this.awardStreakMilestone(user.userId, walletProfile.wallet, walletProfile.currentStreak);
            }
          }
        }
      }

      position.payoutEvaluated = true;
      this.updateUserFromWallet(walletProfile);
    }

    this.markProcessed(logId);
  }

  private leaderboardRows(): Array<{ userId: string; handle: string; wallet: string; points: number; wins: number; totalBets: number; successfulReferrals: number; bestStreak: number }> {
    return Object.values(this.state.users)
      .filter((user) => !!user.wallet)
      .map((user) => ({
        userId: user.userId,
        handle: user.handle,
        wallet: user.wallet!,
        points: user.points,
        wins: user.wins,
        totalBets: user.totalBets,
        successfulReferrals: user.successfulReferrals,
        bestStreak: user.bestStreak,
      }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || b.successfulReferrals - a.successfulReferrals)
      .slice(0, 10);
  }

  private buildCampaignAnnouncement(campaign: CampaignRecord): string {
    return [
      `CHAOS GROWTH CAMPAIGN: ${campaign.type}`,
      currentCampaignDescription(campaign.type),
      `Register wallet: !register 0xYourWallet`,
      `Get referral code: !ref`,
      `Join a referral code: !join CHAOS-REF-XXXXXX`,
      `See your stats: !growth`,
      `Leaderboard: !leaderboard`,
    ].join('\n');
  }

  private buildLeaderboardAnnouncement(): string {
    const rows = this.leaderboardRows().slice(0, 5);
    if (rows.length === 0) {
      return 'CHAOS LEADERBOARD is live, but no registered bettors have scored yet. Register a wallet and place your first bet.';
    }
    const lines = rows.map((row, index) =>
      `${index + 1}. ${row.handle} — ${row.points} pts | wins ${row.wins} | refs ${row.successfulReferrals} | streak ${row.bestStreak}`
    );
    return [
      `WEEKLY CHAOS LEADERBOARD`,
      ...lines,
      `Current campaign: ${this.state.campaigns.current?.type || 'UNKNOWN'}`,
    ].join('\n');
  }

  private queueReplayRange(eventType: EventType, fromBlock: bigint, toBlock: bigint, error: string, provider?: string): void {
    const from = Number(fromBlock);
    const to = Number(toBlock);
    const existing = this.state.replayQueue.find((entry) =>
      entry.eventType === eventType && entry.fromBlock === from && entry.toBlock === to
    );

    if (existing) {
      existing.attempts += 1;
      existing.lastError = error;
      existing.lastProvider = provider;
      existing.nextRetryAt = now() + REPLAY_RETRY_BASE_MS * Math.max(1, existing.attempts);
      return;
    }

    this.state.replayQueue.push({
      id: `${eventType}:${from}:${to}`,
      eventType,
      fromBlock: from,
      toBlock: to,
      attempts: 1,
      createdAt: now(),
      nextRetryAt: now() + REPLAY_RETRY_BASE_MS,
      lastError: error,
      lastProvider: provider,
    });
  }

  private async fetchChunkWithProviders(event: any, fromBlock: bigint, toBlock: bigint): Promise<{ logs: any[]; provider: string }> {
    let lastError: any;

    for (const provider of this.logClients) {
      for (let attempt = 1; attempt <= LOG_CHUNK_RETRIES; attempt++) {
        try {
          const logs = await provider.client.getLogs({
            address: CONTRACT_ADDRESS(),
            event,
            fromBlock,
            toBlock,
          });
          return { logs, provider: provider.url };
        } catch (err: any) {
          lastError = { err, provider: provider.url };
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    try {
      const logs = await this.fetchLogsFromBaseScan(event, fromBlock, toBlock);
      return { logs, provider: 'basescan-v2-api' };
    } catch (err: any) {
      throw Object.assign(lastError?.err || err || new Error('all providers failed'), {
        providerUrl: lastError?.provider || 'basescan-v2-api',
      });
    }
  }

  private async fetchLogsFromBaseScan(event: any, fromBlock: bigint, toBlock: bigint): Promise<any[]> {
    const apiKey = process.env.BASESCAN_API_KEY || '';
    if (!apiKey) {
      throw new Error('BASESCAN_API_KEY not configured');
    }

    const topic0 = event === BET_PLACED_EVENT ? BET_PLACED_TOPIC : MARKET_RESOLVED_TOPIC;
    const response = await axios.get(BASESCAN_V2_LOGS_URL, {
      params: {
        chainid: '8453',
        module: 'logs',
        action: 'getLogs',
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        address: CONTRACT_ADDRESS(),
        topic0,
        apikey: apiKey,
      },
      timeout: 20000,
    });

    const payload = response.data;
    if (!payload) return [];
    if (payload.status === '0' && payload.message && payload.message !== 'No records found') {
      throw new Error(`BaseScan logs error: ${payload.message} ${payload.result || ''}`.trim());
    }
    const items = Array.isArray(payload.result) ? payload.result : [];

    return items.map((item: any) => {
      const decoded = decodeEventLog({
        abi: [event],
        topics: item.topics,
        data: item.data,
      });
      return {
        ...item,
        args: decoded.args,
        eventName: decoded.eventName,
        blockNumber: BigInt(item.blockNumber),
        logIndex: BigInt(item.logIndex),
        transactionHash: item.transactionHash,
        address: item.address,
      };
    });
  }

  private async getLogsChunked(eventType: EventType, event: any, fromBlock: bigint, toBlock: bigint): Promise<{ logs: any[]; failedRange?: { fromBlock: bigint; toBlock: bigint; error: string; provider?: string } }> {
    const logs: any[] = [];
    let cursor = fromBlock;

    while (cursor <= toBlock) {
      const chunkEnd = cursor + LOG_CHUNK_SIZE < toBlock ? cursor + LOG_CHUNK_SIZE : toBlock;
      try {
        const { logs: chunkLogs, provider } = await this.fetchChunkWithProviders(event, cursor, chunkEnd);
        logs.push(...chunkLogs);
        this.setEventCursor(eventType, {
          lastHealthyBlock: Number(chunkEnd),
          lastProvider: provider,
          lastError: undefined,
        });
      } catch (err: any) {
        const errorMessage = err.shortMessage || err.message || 'unknown log sync error';
        return {
          logs,
          failedRange: {
            fromBlock: cursor,
            toBlock: chunkEnd,
            error: errorMessage,
            provider: err.providerUrl,
          },
        };
      }
      cursor = chunkEnd + 1n;
    }

    return { logs };
  }

  private async processReplayQueue(): Promise<{ bet: number; resolve: number }> {
    let bet = 0;
    let resolve = 0;
    const readyEntries = this.state.replayQueue
      .filter((entry) => entry.nextRetryAt <= now() && entry.attempts <= MAX_REPLAY_ATTEMPTS)
      .sort((a, b) => a.fromBlock - b.fromBlock);

    for (const entry of readyEntries) {
      const event = entry.eventType === 'bet' ? BET_PLACED_EVENT : MARKET_RESOLVED_EVENT;
      const result = await this.getLogsChunked(entry.eventType, event, BigInt(entry.fromBlock), BigInt(entry.toBlock));
      const replayLogs = result.logs.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) return Number(a.logIndex - b.logIndex);
        return Number(a.blockNumber - b.blockNumber);
      });

      for (const log of replayLogs) {
        if (entry.eventType === 'bet') {
          await this.handleBetPlaced(log);
          bet++;
        } else {
          await this.handleMarketResolved(log);
          resolve++;
        }
      }

      if (result.failedRange) {
        entry.attempts += 1;
        entry.lastError = result.failedRange.error;
        entry.lastProvider = result.failedRange.provider;
        entry.nextRetryAt = now() + REPLAY_RETRY_BASE_MS * Math.max(1, entry.attempts);
      } else {
        this.state.replayQueue = this.state.replayQueue.filter((queued) => queued.id !== entry.id);
      }
    }

    return { bet, resolve };
  }

  private syncStartBlock(eventType: EventType, latestBlock: bigint): bigint {
    const cursor = this.getEventCursor(eventType);
    const migratedBlock = this.state.checkpoints.lastProcessedBlock;
    const fromState = cursor.lastProcessedBlock ?? migratedBlock;
    if (fromState !== undefined) {
      return BigInt(fromState + 1);
    }
    return latestBlock > LOOKBACK_BLOCKS ? latestBlock - LOOKBACK_BLOCKS : 0n;
  }

  private splitSyncRange(fromBlock: bigint, latestBlock: bigint): {
    scanFrom: bigint;
    scanTo: bigint;
    deferredRange?: { fromBlock: bigint; toBlock: bigint };
  } {
    if (fromBlock > latestBlock) {
      return { scanFrom: fromBlock, scanTo: latestBlock };
    }

    const lag = latestBlock - fromBlock;
    if (lag <= MAX_PRIMARY_SCAN_BLOCKS) {
      return { scanFrom: fromBlock, scanTo: latestBlock };
    }

    const recentFrom = latestBlock > RECENT_TIP_LOOKBACK_BLOCKS
      ? latestBlock - RECENT_TIP_LOOKBACK_BLOCKS
      : 0n;

    if (recentFrom <= fromBlock) {
      return {
        scanFrom: fromBlock,
        scanTo: fromBlock + MAX_PRIMARY_SCAN_BLOCKS,
      };
    }

    return {
      scanFrom: recentFrom,
      scanTo: latestBlock,
      deferredRange: { fromBlock, toBlock: recentFrom - 1n },
    };
  }

  private async syncEventType(eventType: EventType, event: any, latestBlock: bigint): Promise<number> {
    const fromBlock = this.syncStartBlock(eventType, latestBlock);
    if (fromBlock > latestBlock) return 0;
    const rangePlan = this.splitSyncRange(fromBlock, latestBlock);

    if (rangePlan.deferredRange) {
      this.queueReplayRange(
        eventType,
        rangePlan.deferredRange.fromBlock,
        rangePlan.deferredRange.toBlock,
        'deferred backlog range for later replay',
      );
    }

    const result = await this.getLogsChunked(eventType, event, rangePlan.scanFrom, rangePlan.scanTo);
    const sortedLogs = result.logs.sort((a, b) => {
      if (a.blockNumber === b.blockNumber) return Number(a.logIndex - b.logIndex);
      return Number(a.blockNumber - b.blockNumber);
    });

    let processed = 0;
    for (const log of sortedLogs) {
      if (eventType === 'bet') {
        await this.handleBetPlaced(log);
      } else {
        await this.handleMarketResolved(log);
      }
      processed++;
    }

    if (result.failedRange) {
      this.queueReplayRange(
        eventType,
        result.failedRange.fromBlock,
        result.failedRange.toBlock,
        result.failedRange.error,
        result.failedRange.provider
      );
      this.setEventCursor(eventType, {
        lastProcessedBlock: Number(result.failedRange.fromBlock - 1n),
        lastError: result.failedRange.error,
        lastProvider: result.failedRange.provider,
      });
    } else {
      this.setEventCursor(eventType, {
        lastProcessedBlock: Number(rangePlan.scanTo),
        lastHealthyBlock: Number(rangePlan.scanTo),
        lastError: undefined,
      });
    }

    return processed;
  }

  private shouldPostLeaderboard(): boolean {
    const campaign = this.state.campaigns.current;
    if (!campaign) return false;
    return now() - campaign.leaderboardPostedAt > LEADERBOARD_POST_INTERVAL_MS;
  }

  private queueCampaignWinners(campaign: CampaignRecord): void {
    const winners = this.leaderboardRows().slice(0, 3);
    winners.forEach((winner, index) => {
      const tier: RewardTier = index === 0 ? 'OracleSpeaks' : index === 1 ? 'ChaosTarot' : 'Prophecy';
      this.queueReward(
        winner.userId,
        winner.wallet,
        `campaign-winner:${campaign.id}:${winner.userId}:${index + 1}`,
        `${campaign.type} Winner #${index + 1}`,
        `You finished #${index + 1} in the ${campaign.type} campaign leaderboard.`,
        tier,
        {
          Reward: 'Campaign Winner',
          Campaign: campaign.type,
          Rank: String(index + 1),
        }
      );
    });
  }

  async registerWallet(userId: string, handle: string, wallet: string): Promise<string> {
    if (!isValidWallet(wallet)) {
      return 'Invalid wallet format. Use `!register 0x...` with a Base EVM address.';
    }

    const normalized = normalizeWallet(wallet);
    const user = this.getOrCreateUser(userId, handle);
    const walletProfile = this.getOrCreateWallet(normalized);

    if (walletProfile.userId && walletProfile.userId !== userId) {
      return 'That wallet is already registered to another user.';
    }

    user.wallet = normalized;
    user.lastUpdated = now();
    walletProfile.userId = userId;
    this.updateUserFromWallet(walletProfile);
    if (walletProfile.firstBetAt && !user.firstBetRewardIssued) {
      this.awardFirstBet(userId, normalized);
      this.registerReferralConversion(user, normalized);
    }
    saveState(this.state);

    return `Wallet registered for ${handle}: ${normalized}`;
  }

  async getReferralCode(userId: string, handle: string): Promise<string> {
    const user = this.getOrCreateUser(userId, handle);
    if (!user.referralCode) {
      let code = createReferralCode();
      while (this.state.referralCodes[code]) {
        code = createReferralCode();
      }
      user.referralCode = code;
      this.state.referralCodes[code] = {
        code,
        ownerUserId: userId,
        createdAt: now(),
        convertedWallets: [],
      };
      user.lastUpdated = now();
      saveState(this.state);
    }

    return [
      `Your referral code: ${user.referralCode}`,
      `Share this with new bettors.`,
      `New users should run: !join ${user.referralCode}`,
      `Then register a wallet and place their first bet.`,
    ].join('\n');
  }

  async joinReferral(userId: string, handle: string, code: string): Promise<string> {
    const normalizedCode = code.trim().toUpperCase();
    const codeRecord = this.state.referralCodes[normalizedCode];
    if (!codeRecord) {
      return 'Referral code not found.';
    }
    if (codeRecord.ownerUserId === userId) {
      return 'You cannot use your own referral code.';
    }

    const user = this.getOrCreateUser(userId, handle);
    if (user.referredByCode) {
      return `Referral already locked to ${user.referredByCode}.`;
    }
    if (user.totalBets > 0 || (user.wallet && this.state.wallets[user.wallet]?.firstBetAt)) {
      return 'Referral must be joined before your first bet.';
    }

    user.referredByCode = normalizedCode;
    user.referredByUserId = codeRecord.ownerUserId;
    user.lastUpdated = now();
    const referrer = this.state.users[codeRecord.ownerUserId];
    if (referrer) {
      referrer.totalReferrals += 1;
      referrer.lastUpdated = now();
    }
    saveState(this.state);

    const refHandle = referrer?.handle || 'another bettor';
    return `Referral code ${normalizedCode} accepted. You’re now linked to ${refHandle}. Register your wallet and place your first bet to activate the reward flow.`;
  }

  resetTestParticipants(participants: Array<{ userId: string; wallet: string }>): string {
    const removedUsers: string[] = [];
    const removedWallets: string[] = [];
    const removedCodes: string[] = [];
    const affectedUserIds = new Set(participants.map((p) => p.userId));
    const affectedWallets = new Set(participants.map((p) => normalizeWallet(p.wallet)));

    for (const participant of participants) {
      const user = this.state.users[participant.userId];
      if (user?.referralCode && this.state.referralCodes[user.referralCode]) {
        delete this.state.referralCodes[user.referralCode];
        removedCodes.push(user.referralCode);
      }
    }

    for (const [code, record] of Object.entries(this.state.referralCodes)) {
      if (affectedUserIds.has(record.ownerUserId)) {
        delete this.state.referralCodes[code];
        removedCodes.push(code);
        continue;
      }
      record.convertedWallets = record.convertedWallets.filter((wallet) => !affectedWallets.has(normalizeWallet(wallet)));
    }

    for (const [key, reward] of Object.entries(this.state.rewards)) {
      if (affectedUserIds.has(reward.userId) || affectedWallets.has(normalizeWallet(reward.wallet))) {
        delete this.state.rewards[key];
      }
    }

    this.state.notifications = this.state.notifications.filter((notification) => !affectedUserIds.has(notification.userId));

    for (const participant of participants) {
      if (this.state.users[participant.userId]) {
        delete this.state.users[participant.userId];
        removedUsers.push(participant.userId);
      }
      const normalizedWallet = normalizeWallet(participant.wallet);
      if (this.state.wallets[normalizedWallet]) {
        delete this.state.wallets[normalizedWallet];
        removedWallets.push(normalizedWallet);
      }
    }

    saveState(this.state);

    return [
      'CHAOS TEST RESET',
      `Users removed: ${removedUsers.length > 0 ? removedUsers.join(', ') : 'none'}`,
      `Wallets removed: ${removedWallets.length > 0 ? removedWallets.join(', ') : 'none'}`,
      `Referral codes removed: ${removedCodes.length > 0 ? removedCodes.join(', ') : 'none'}`,
    ].join('\n');
  }

  getUserStatus(userId: string, handle: string): string {
    const user = this.getOrCreateUser(userId, handle);
    const walletProfile = user.wallet ? this.state.wallets[user.wallet] : undefined;
    const campaign = this.ensureCampaign().campaign;

    return [
      `CHAOS GROWTH STATUS`,
      `Handle: ${user.handle}`,
      `Wallet: ${user.wallet || 'not registered'}`,
      `Campaign: ${campaign.type}`,
      `Referral code: ${user.referralCode || 'run !ref'}`,
      `Referred by: ${user.referredByCode || 'none'}`,
      `Points: ${user.points}`,
      `Bets: ${user.totalBets}`,
      `Wins/Losses: ${user.wins}/${user.losses}`,
      `Streak: ${user.currentStreak} (best ${user.bestStreak})`,
      `Successful referrals: ${user.successfulReferrals}`,
      `Pending growth claims: ${user.pendingClaimCodes.length}`,
      walletProfile?.firstBetAt ? `First bet: ${new Date(walletProfile.firstBetAt).toISOString()}` : 'First bet: not yet',
    ].join('\n');
  }

  getLeaderboardText(): string {
    return this.buildLeaderboardAnnouncement();
  }

  getCampaignText(): string {
    return this.buildCampaignAnnouncement(this.ensureCampaign().campaign);
  }

  getCampaignDetailsText(): string {
    const campaign = this.ensureCampaign().campaign;
    const rows = this.leaderboardRows().slice(0, 3);
    return [
      `CHAOS CAMPAIGN`,
      `Type: ${campaign.type}`,
      `Starts: ${new Date(campaign.startsAt).toISOString()}`,
      `Ends: ${new Date(campaign.endsAt).toISOString()}`,
      `Description: ${currentCampaignDescription(campaign.type)}`,
      `Top performers: ${rows.length > 0 ? rows.map((row) => `${row.handle}(${row.points})`).join(', ') : 'none yet'}`,
      `How to join: !register 0xYourWallet | !ref | !join CODE`,
    ].join('\n');
  }

  getRewardsText(userId: string, handle: string): string {
    const user = this.getOrCreateUser(userId, handle);
    const userRewards = Object.values(this.state.rewards)
      .filter((reward) => reward.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const pending = userRewards.filter((reward) => reward.status === 'pending');
    const issued = userRewards.filter((reward) => reward.status === 'issued');
    const failed = userRewards.filter((reward) => reward.status === 'failed');

    const lastIssued = issued.slice(0, 5).map((reward) =>
      `${reward.title}: ${reward.claimCode || 'claim pending'}`
    );
    const lastPending = pending.slice(0, 5).map((reward) =>
      `${reward.title}: attempt ${reward.attempts}`
    );
    const lastFailed = failed.slice(0, 3).map((reward) =>
      `${reward.title}: ${reward.lastError || 'unknown error'}`
    );

    return [
      `CHAOS REWARDS`,
      `Handle: ${user.handle}`,
      `Pending rewards: ${pending.length}`,
      `Issued rewards: ${issued.length}`,
      `Failed rewards: ${failed.length}`,
      `Pending claim codes on profile: ${user.pendingClaimCodes.length}`,
      `Recent issued: ${lastIssued.length > 0 ? lastIssued.join(' | ') : 'none'}`,
      `Recent pending: ${lastPending.length > 0 ? lastPending.join(' | ') : 'none'}`,
      `Recent failed: ${lastFailed.length > 0 ? lastFailed.join(' | ') : 'none'}`,
    ].join('\n');
  }

  getRewardSnapshot(userId: string): RewardSnapshot {
    const user = this.state.users[userId];
    const userRewards = Object.values(this.state.rewards).filter((reward) => reward.userId === userId);
    return {
      pending: userRewards.filter((reward) => reward.status === 'pending').length,
      issued: userRewards.filter((reward) => reward.status === 'issued').length,
      failed: userRewards.filter((reward) => reward.status === 'failed').length,
      pendingClaimCodes: user?.pendingClaimCodes.length || 0,
      firstBetRewardIssued: !!user?.firstBetRewardIssued,
      firstWinRewardIssued: !!user?.firstWinRewardIssued,
    };
  }

  getFirstBetDetectionSnapshot(userId: string, handle: string): FirstBetDetectionSnapshot {
    const user = this.getOrCreateUser(userId, handle);
    const walletProfile = user.wallet ? this.state.wallets[user.wallet] : undefined;
    return {
      walletRegistered: !!user.wallet,
      firstBetSeen: !!walletProfile?.firstBetAt,
      firstBetAt: walletProfile?.firstBetAt,
      totalBets: user.totalBets,
      totalPoints: user.points,
      referredByCode: user.referredByCode,
    };
  }

  getAdminStatusText(): string {
    const betCursor = this.getEventCursor('bet');
    const resolveCursor = this.getEventCursor('resolve');
    const failedRanges = this.state.replayQueue.filter((entry) => entry.attempts > 0).length;
    const pendingRewards = Object.values(this.state.rewards).filter((reward) => reward.status === 'pending').length;
    const issuedRewards = Object.values(this.state.rewards).filter((reward) => reward.status === 'issued').length;
    const failedRewards = Object.values(this.state.rewards).filter((reward) => reward.status === 'failed').length;
    const nextReplay = this.state.replayQueue
      .slice()
      .sort((a, b) => a.nextRetryAt - b.nextRetryAt)[0];

    const providers = this.providerUrls.join(', ');

    return [
      `CHAOS GROWTH ADMIN`,
      `Providers: ${providers}`,
      `Bet cursor: processed=${betCursor.lastProcessedBlock ?? 'none'} healthy=${betCursor.lastHealthyBlock ?? 'none'} provider=${betCursor.lastProvider || 'unknown'}`,
      `Bet last error: ${betCursor.lastError || 'none'}`,
      `Resolve cursor: processed=${resolveCursor.lastProcessedBlock ?? 'none'} healthy=${resolveCursor.lastHealthyBlock ?? 'none'} provider=${resolveCursor.lastProvider || 'unknown'}`,
      `Resolve last error: ${resolveCursor.lastError || 'none'}`,
      `Replay queue depth: ${this.state.replayQueue.length}`,
      `Failed range count: ${failedRanges}`,
      `Next replay: ${nextReplay ? `${nextReplay.eventType} ${nextReplay.fromBlock}-${nextReplay.toBlock} @ ${new Date(nextReplay.nextRetryAt).toISOString()}` : 'none'}`,
      `Reward queue: pending=${pendingRewards} issued=${issuedRewards} failed=${failedRewards}`,
      `Notifications queued: ${this.state.notifications.length}`,
      `Processed log ids cached: ${this.state.processedLogIds.length}`,
      `Current campaign: ${this.state.campaigns.current?.type || 'none'}`,
    ].join('\n');
  }

  getReplayQueueText(): string {
    if (this.state.replayQueue.length === 0) {
      return 'CHAOS REPLAY QUEUE\nNo queued failed ranges.';
    }
    const lines = this.state.replayQueue
      .slice()
      .sort((a, b) => a.nextRetryAt - b.nextRetryAt)
      .slice(0, 10)
      .map((entry) =>
        `${entry.eventType} ${entry.fromBlock}-${entry.toBlock} attempts=${entry.attempts} next=${new Date(entry.nextRetryAt).toISOString()} provider=${entry.lastProvider || 'unknown'}`
      );
    return ['CHAOS REPLAY QUEUE', ...lines].join('\n');
  }

  async forceReplayNow(): Promise<string> {
    if (this.state.replayQueue.length === 0) {
      return 'CHAOS REPLAY\nNo queued failed ranges to replay.';
    }

    for (const entry of this.state.replayQueue) {
      entry.nextRetryAt = 0;
    }
    saveState(this.state);

    const before = this.state.replayQueue.length;
    const result = await this.processReplayQueue();
    saveState(this.state);

    return [
      'CHAOS REPLAY',
      `Queued before: ${before}`,
      `Processed bet logs: ${result.bet}`,
      `Processed resolve logs: ${result.resolve}`,
      `Queue remaining: ${this.state.replayQueue.length}`,
    ].join('\n');
  }

  async resetEventCursor(eventType: EventType): Promise<string> {
    const latestBlock = await this.client.getBlockNumber();
    const cursor = this.getEventCursor(eventType);
    const previousProcessed = cursor.lastProcessedBlock;
    const resetTo = latestBlock > LOOKBACK_BLOCKS ? latestBlock - LOOKBACK_BLOCKS : 0n;

    this.setEventCursor(eventType, {
      lastProcessedBlock: Number(resetTo),
      lastHealthyBlock: cursor.lastHealthyBlock,
      lastError: undefined,
    });
    saveState(this.state);

    return [
      'CHAOS CURSOR RESET',
      `Event: ${eventType}`,
      `Previous processed: ${previousProcessed ?? 'none'}`,
      `New processed: ${Number(resetTo)}`,
      `Latest block: ${latestBlock.toString()}`,
      `Next sync will resume from block ${Number(resetTo) + 1}`,
    ].join('\n');
  }

  async runAutomationCycle(): Promise<GrowthCycleResult> {
    const campaignInfo = this.ensureCampaign();
    const latestBlock = await this.client.getBlockNumber();
    let syncedBetEvents = 0;
    let syncedResolveEvents = 0;

    if (CONTRACT_ADDRESS()) {
      const replayResults = await this.processReplayQueue();
      syncedBetEvents += replayResults.bet;
      syncedResolveEvents += replayResults.resolve;

      try {
        syncedBetEvents += await this.syncEventType('bet', BET_PLACED_EVENT, latestBlock);
      } catch (err: any) {
        console.error('[GROWTH_ENGINE] Bet sync failed:', err.shortMessage || err.message);
      }

      try {
        syncedResolveEvents += await this.syncEventType('resolve', MARKET_RESOLVED_EVENT, latestBlock);
      } catch (err: any) {
        console.error('[GROWTH_ENGINE] Resolve sync failed:', err.shortMessage || err.message);
      }
    }

    const processedRewards = await this.processPendingRewards();

    let leaderboardAnnouncement: string | undefined;
    if (this.shouldPostLeaderboard()) {
      leaderboardAnnouncement = this.buildLeaderboardAnnouncement();
      if (this.state.campaigns.current) {
        this.state.campaigns.current.leaderboardPostedAt = now();
      }
    }

    if (campaignInfo.announcement && this.state.campaigns.current) {
      this.state.campaigns.current.announcementSent = true;
    }

    const notifications = [...this.state.notifications];
    // Drain pending shoutouts (max 3 per cycle)
    const streakShoutouts = this.pendingShoutouts.splice(0, 3);
    saveState(this.state);

    return {
      syncedBetEvents,
      syncedResolveEvents,
      processedRewards,
      notifications,
      campaignAnnouncement: campaignInfo.announcement,
      leaderboardAnnouncement,
      streakShoutouts,
    };
  }

  getPendingNotifications(): GrowthNotification[] {
    return [...this.state.notifications];
  }

  markNotificationDelivered(notificationId: string): void {
    this.state.notifications = this.state.notifications.filter((notification) => notification.id !== notificationId);
    saveState(this.state);
  }

  markNotificationAttempted(notificationId: string): void {
    const notification = this.state.notifications.find((item) => item.id === notificationId);
    if (!notification) return;
    notification.attempts += 1;
    saveState(this.state);
  }
}

export default new GrowthEngine();

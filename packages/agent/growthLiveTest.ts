import * as dotenv from 'dotenv';
import { createPublicClient, createWalletClient, fallback, formatEther, http, parseEther, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import GrowthEngine from './growthEngine';

dotenv.config();

type BetSide = 'yes' | 'no';

interface Args {
  resetTestUsers: boolean;
  setup: boolean;
  syncGrowth: boolean;
  executeBet: boolean;
  waitForFirstBetDetection: boolean;
  waitForReward: boolean;
  confirmLive: boolean;
  waitTimeoutMs: number;
  waitIntervalMs: number;
  marketId: number;
  betSide: BetSide;
  betAmount: string;
  referrerUser: string;
  referrerHandle: string;
  referrerWallet: string;
  referredUser: string;
  referredHandle: string;
  referredWallet: string;
  referredPrivateKey?: `0x${string}`;
}

const PLACE_BET_ABI = [{
  name: 'placeBet',
  type: 'function',
  inputs: [
    { name: '_marketId', type: 'uint256' },
    { name: '_betYes', type: 'bool' },
  ],
  outputs: [],
  stateMutability: 'payable',
}] as const;

function parseArgs(argv: string[]): Args {
  const getValue = (name: string, fallback?: string) => {
    const hit = argv.find((arg) => arg.startsWith(`--${name}=`));
    return hit ? hit.split('=').slice(1).join('=') : fallback;
  };
  const hasFlag = (name: string) => argv.includes(`--${name}`);

  return {
    resetTestUsers: hasFlag('reset-test-users'),
    setup: hasFlag('setup'),
    syncGrowth: hasFlag('sync-growth'),
    executeBet: hasFlag('execute-bet'),
    waitForFirstBetDetection: hasFlag('wait-for-first-bet-detection'),
    waitForReward: hasFlag('wait-for-reward'),
    confirmLive: hasFlag('confirm-live'),
    waitTimeoutMs: Number(getValue('wait-timeout-ms', '180000')),
    waitIntervalMs: Number(getValue('wait-interval-ms', '15000')),
    marketId: Number(getValue('market-id', '0')),
    betSide: ((getValue('bet-side', 'yes') || 'yes').toLowerCase() === 'no' ? 'no' : 'yes'),
    betAmount: getValue('bet-amount', '0.001')!,
    referrerUser: getValue('referrer-user', 'discord_live_referrer')!,
    referrerHandle: getValue('referrer-handle', 'live-referrer')!,
    referrerWallet: getValue('referrer-wallet', '0x1111111111111111111111111111111111111111')!,
    referredUser: getValue('referred-user', 'discord_live_referred')!,
    referredHandle: getValue('referred-handle', 'live-referred')!,
    referredWallet: getValue('referred-wallet', '0x2222222222222222222222222222222222222222')!,
    referredPrivateKey: getValue('referred-private-key') as `0x${string}` | undefined,
  };
}

function isValidWallet(wallet: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

function divider(title: string): void {
  console.log(`\n=== ${title} ===`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contract = process.env.CONTRACT_ADDRESS;
  const cardsContract = process.env.CHAOS_CARDS_CONTRACT;
  const pinata = process.env.PINATA_JWT;
  const rpcUrls = Array.from(new Set([
    (process.env.BASE_RPC_URL || '').trim(),
    'https://base.llamarpc.com',
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
  ].filter(Boolean)));

  const publicClient = createPublicClient({
    chain: base,
    transport: fallback(rpcUrls.map((url) => http(url)), { retryCount: 2 }),
  });

  divider('READINESS');
  console.log(`Contract: ${contract || 'missing'}`);
  console.log(`NFT contract: ${cardsContract || 'missing'}`);
  console.log(`Pinata configured: ${pinata ? 'yes' : 'no'}`);
  console.log(`RPC providers: ${rpcUrls.join(', ')}`);
  console.log(`Referrer wallet valid: ${isValidWallet(args.referrerWallet)}`);
  console.log(`Referred wallet valid: ${isValidWallet(args.referredWallet)}`);

  const referredBalance = isValidWallet(args.referredWallet)
    ? await publicClient.getBalance({ address: args.referredWallet as `0x${string}` })
    : 0n;
  console.log(`Referred wallet balance: ${formatEther(referredBalance)} ETH`);

  if (args.resetTestUsers) {
    divider('TEST USER RESET');
    console.log(GrowthEngine.resetTestParticipants([
      { userId: args.referrerUser, wallet: args.referrerWallet },
      { userId: args.referredUser, wallet: args.referredWallet },
    ]));
  }

  if (args.setup) {
    divider('STATE SETUP');
    console.log(await GrowthEngine.registerWallet(args.referrerUser, args.referrerHandle, args.referrerWallet));
    const refText = await GrowthEngine.getReferralCode(args.referrerUser, args.referrerHandle);
    console.log(refText);
    const codeMatch = refText.match(/CHAOS-REF-[A-Z0-9]+/);
    const referralCode = codeMatch?.[0];
    if (!referralCode) {
      throw new Error('Failed to extract referral code during setup');
    }
    console.log(await GrowthEngine.joinReferral(args.referredUser, args.referredHandle, referralCode));
    console.log(await GrowthEngine.registerWallet(args.referredUser, args.referredHandle, args.referredWallet));
  }

  divider('CAMPAIGN STATE');
  console.log(GrowthEngine.getCampaignDetailsText());
  console.log('\n' + GrowthEngine.getLeaderboardText());
  console.log('\n' + GrowthEngine.getUserStatus(args.referrerUser, args.referrerHandle));
  console.log('\n' + GrowthEngine.getUserStatus(args.referredUser, args.referredHandle));
  console.log('\n' + GrowthEngine.getRewardsText(args.referredUser, args.referredHandle));
  console.log('\n' + GrowthEngine.getAdminStatusText());

  if (args.executeBet) {
    divider('LIVE BET EXECUTION');
    if (!args.confirmLive) {
      throw new Error('Refusing live bet without --confirm-live');
    }
    if (!contract) {
      throw new Error('CONTRACT_ADDRESS is required for live bet execution');
    }
    if (!args.referredPrivateKey) {
      throw new Error('Provide --referred-private-key=0x... to execute a real bet');
    }

    const account = privateKeyToAccount(args.referredPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: fallback(rpcUrls.map((url) => http(url)), { retryCount: 2 }),
    }).extend(publicActions);

    console.log(`Using wallet ${account.address}`);
    const liveBalance = await walletClient.getBalance({ address: account.address });
    console.log(`Wallet balance: ${formatEther(liveBalance)} ETH`);

    const txHash = await walletClient.writeContract({
      address: contract as `0x${string}`,
      abi: PLACE_BET_ABI,
      functionName: 'placeBet',
      args: [BigInt(args.marketId), args.betSide === 'yes'],
      value: parseEther(args.betAmount),
      gas: 250000n,
    });
    console.log(`Bet tx sent: ${txHash}`);
    await walletClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
    console.log('Bet confirmed on-chain.');
  }

  if (args.syncGrowth) {
    divider('GROWTH SYNC');
    const result = await GrowthEngine.runAutomationCycle();
    console.log(JSON.stringify({
      syncedBetEvents: result.syncedBetEvents,
      syncedResolveEvents: result.syncedResolveEvents,
      processedRewards: result.processedRewards,
      queuedNotifications: result.notifications.length,
      campaignAnnouncement: !!result.campaignAnnouncement,
      leaderboardAnnouncement: !!result.leaderboardAnnouncement,
    }, null, 2));
    console.log('\n' + GrowthEngine.getUserStatus(args.referredUser, args.referredHandle));
    console.log('\n' + GrowthEngine.getRewardsText(args.referredUser, args.referredHandle));
    console.log('\n' + GrowthEngine.getAdminStatusText());
  }

  if (args.waitForFirstBetDetection) {
    divider('WAIT FOR FIRST BET DETECTION');
    const startedAt = Date.now();
    let iteration = 0;

    while (Date.now() - startedAt < args.waitTimeoutMs) {
      iteration += 1;
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(250, args.waitTimeoutMs - elapsed);
      const cycleBudgetMs = Math.min(args.waitIntervalMs, remainingMs);
      let result;
      try {
        result = await withTimeout(GrowthEngine.runAutomationCycle(), cycleBudgetMs, 'growth sync cycle');
      } catch (err: any) {
        console.log(JSON.stringify({
          iteration,
          elapsedMs: elapsed,
          warning: err.message,
        }, null, 2));
        await sleep(Math.min(args.waitIntervalMs, Math.max(0, args.waitTimeoutMs - (Date.now() - startedAt))));
        continue;
      }

      const snapshot = GrowthEngine.getFirstBetDetectionSnapshot(args.referredUser, args.referredHandle);
      console.log(JSON.stringify({
        iteration,
        elapsedMs: elapsed,
        syncedBetEvents: result.syncedBetEvents,
        syncedResolveEvents: result.syncedResolveEvents,
        firstBetSnapshot: snapshot,
      }, null, 2));

      if (snapshot.firstBetSeen || snapshot.totalBets > 0) {
        console.log('First bet detection signal observed.');
        console.log('\n' + GrowthEngine.getUserStatus(args.referredUser, args.referredHandle));
        break;
      }

      await sleep(args.waitIntervalMs);
    }

    if (Date.now() - startedAt >= args.waitTimeoutMs) {
      console.log(`Timed out after ${args.waitTimeoutMs}ms waiting for first-bet detection.`);
      console.log('\n' + GrowthEngine.getUserStatus(args.referredUser, args.referredHandle));
    }
  }

  if (args.waitForReward) {
    divider('WAIT FOR REWARD');
    const startedAt = Date.now();
    let iteration = 0;

    while (Date.now() - startedAt < args.waitTimeoutMs) {
      iteration += 1;
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(250, args.waitTimeoutMs - elapsed);
      const cycleBudgetMs = Math.min(args.waitIntervalMs, remainingMs);
      let result;
      try {
        result = await withTimeout(GrowthEngine.runAutomationCycle(), cycleBudgetMs, 'growth sync cycle');
      } catch (err: any) {
        console.log(JSON.stringify({
          iteration,
          elapsedMs: elapsed,
          warning: err.message,
        }, null, 2));
        await sleep(Math.min(args.waitIntervalMs, Math.max(0, args.waitTimeoutMs - (Date.now() - startedAt))));
        continue;
      }
      const snapshot = GrowthEngine.getRewardSnapshot(args.referredUser);
      console.log(JSON.stringify({
        iteration,
        elapsedMs: elapsed,
        syncedBetEvents: result.syncedBetEvents,
        syncedResolveEvents: result.syncedResolveEvents,
        processedRewards: result.processedRewards,
        rewardSnapshot: snapshot,
      }, null, 2));

      if (snapshot.issued > 0 || snapshot.pendingClaimCodes > 0 || snapshot.firstBetRewardIssued) {
        console.log('Reward signal detected.');
        console.log('\n' + GrowthEngine.getRewardsText(args.referredUser, args.referredHandle));
        break;
      }

      await sleep(args.waitIntervalMs);
    }

    if (Date.now() - startedAt >= args.waitTimeoutMs) {
      console.log(`Timed out after ${args.waitTimeoutMs}ms waiting for reward state.`);
      console.log('\n' + GrowthEngine.getRewardsText(args.referredUser, args.referredHandle));
    }
  }

  divider('NEXT STEPS');
  console.log([
    '1. If referred wallet has funded ETH and you passed --execute-bet, watch for first-bet reward state after --sync-growth.',
    '2. Use --wait-for-first-bet-detection to confirm the chain event was ingested, even if rewards are blocked.',
    '3. Use --wait-for-reward to poll growth state until the first-bet reward appears or times out.',
    '4. If reward issuance stays pending, load CHAOS_CARDS_CONTRACT and PINATA_JWT.',
    '5. Use !growth, !rewards, !leaderboard, and !growthadmin in Discord to inspect the same state live.',
  ].join('\n'));
}

main().catch((err) => {
  console.error('[GROWTH_LIVE_TEST] FAILED:', err.message);
  process.exit(1);
});

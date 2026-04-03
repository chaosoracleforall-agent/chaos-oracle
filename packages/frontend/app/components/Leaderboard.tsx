"use client";

import { useState, useEffect } from 'react';
import { createPublicClient, http, formatEther, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const CONTRACT_V2 = '0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6';
const CONTRACT_V3 = '0x76b714816689eC9f92F139900a04906ba0FBd34b';
const RPC_URL = 'https://base.llamarpc.com';

// V2 contract deployment block (approximate — used as lower bound for log queries)
const DEPLOY_BLOCK = 18000000n;

const BET_PLACED_EVENT = parseAbiItem(
  'event BetPlaced(uint256 indexed marketId, address indexed user, bool betYes, uint256 amount)'
);

const MARKET_RESOLVED_EVENT = parseAbiItem(
  'event MarketResolved(uint256 indexed marketId, bool result)'
);

interface PredictorStats {
  address: string;
  totalVolume: bigint;
  totalBets: number;
  wins: number;
  losses: number;
  // Track bets per market for win-rate calculation
  marketBets: Record<string, { betYes: boolean; amount: bigint }[]>;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  volumeEth: string;
  totalBets: number;
  winRate: string;
  wins: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const client = createPublicClient({
          chain: base,
          transport: http(RPC_URL),
        });

        const currentBlock = await client.getBlockNumber();
        // Scan recent blocks (limit to avoid RPC timeouts)
        const fromBlock = currentBlock - 150000n > DEPLOY_BLOCK
          ? currentBlock - 150000n
          : DEPLOY_BLOCK;

        // Fetch BetPlaced events from V2 + V3
        const [v2BetLogs, v3BetLogs] = await Promise.all([
          client.getLogs({ address: CONTRACT_V2 as `0x${string}`, event: BET_PLACED_EVENT, fromBlock, toBlock: currentBlock }),
          client.getLogs({ address: CONTRACT_V3 as `0x${string}`, event: BET_PLACED_EVENT, fromBlock, toBlock: currentBlock }).catch(() => []),
        ]);
        const betLogs = [...v2BetLogs, ...v3BetLogs];

        // Fetch MarketResolved events from V2 + V3
        const [v2ResolveLogs, v3ResolveLogs] = await Promise.all([
          client.getLogs({ address: CONTRACT_V2 as `0x${string}`, event: MARKET_RESOLVED_EVENT, fromBlock, toBlock: currentBlock }),
          client.getLogs({ address: CONTRACT_V3 as `0x${string}`, event: MARKET_RESOLVED_EVENT, fromBlock, toBlock: currentBlock }).catch(() => []),
        ]);
        const resolveLogs = [...v2ResolveLogs, ...v3ResolveLogs];

        // Build resolved market results map
        const marketResults: Record<string, boolean> = {};
        for (const log of resolveLogs) {
          const marketId = String(log.args.marketId);
          marketResults[marketId] = log.args.result as boolean;
        }

        // Aggregate by wallet
        const stats: Record<string, PredictorStats> = {};

        for (const log of betLogs) {
          const user = (log.args.user as string).toLowerCase();
          const amount = log.args.amount as bigint;
          const betYes = log.args.betYes as boolean;
          const marketId = String(log.args.marketId);

          if (!stats[user]) {
            stats[user] = {
              address: user,
              totalVolume: 0n,
              totalBets: 0,
              wins: 0,
              losses: 0,
              marketBets: {},
            };
          }

          stats[user].totalVolume += amount;
          stats[user].totalBets += 1;

          if (!stats[user].marketBets[marketId]) {
            stats[user].marketBets[marketId] = [];
          }
          stats[user].marketBets[marketId].push({ betYes, amount });
        }

        // Calculate wins/losses from resolved markets
        for (const predictor of Object.values(stats)) {
          for (const [marketId, bets] of Object.entries(predictor.marketBets)) {
            if (marketResults[marketId] === undefined) continue;

            const result = marketResults[marketId];
            // Determine net direction: sum YES vs NO amounts
            let yesTotal = 0n;
            let noTotal = 0n;
            for (const bet of bets) {
              if (bet.betYes) yesTotal += bet.amount;
              else noTotal += bet.amount;
            }

            // Skip hedged positions
            if (yesTotal > 0n && noTotal > 0n) continue;

            const won = (result && yesTotal > 0n) || (!result && noTotal > 0n);
            if (won) predictor.wins += 1;
            else predictor.losses += 1;
          }
        }

        // Sort by volume, take top 10
        const sorted = Object.values(stats)
          .sort((a, b) => (b.totalVolume > a.totalVolume ? 1 : b.totalVolume < a.totalVolume ? -1 : 0))
          .slice(0, 10);

        const leaderboard: LeaderboardEntry[] = sorted.map((s, i) => {
          const resolved = s.wins + s.losses;
          return {
            rank: i + 1,
            address: s.address,
            volumeEth: Number(formatEther(s.totalVolume)).toFixed(4),
            totalBets: s.totalBets,
            winRate: resolved > 0 ? `${Math.round((s.wins / resolved) * 100)}%` : '--',
            wins: s.wins,
          };
        });

        setEntries(leaderboard);
      } catch (err: any) {
        console.error('[LEADERBOARD] Failed:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  function truncateAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  if (loading) {
    return (
      <div style={{
        border: '1px solid #333', padding: '2rem', textAlign: 'center',
        color: '#555', fontFamily: 'monospace',
      }}>
        SCANNING_LEADERBOARD...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        border: '1px dashed #333', padding: '2rem', textAlign: 'center',
        color: '#ff4444', fontFamily: 'monospace',
      }}>
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{
        border: '1px dashed #333', padding: '2rem', textAlign: 'center',
        color: '#555', fontFamily: 'monospace',
      }}>
        NO_PREDICTIONS_FOUND
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem',
        borderBottom: '1px solid #ff4500', color: '#ff4500', fontSize: '0.75rem',
        fontWeight: 'bold', textTransform: 'uppercase',
      }}>
        <span style={{ width: '30px' }}>#</span>
        <span style={{ flex: 1 }}>PREDICTOR</span>
        <span style={{ width: '100px', textAlign: 'right' }}>VOLUME</span>
        <span style={{ width: '60px', textAlign: 'right' }}>BETS</span>
        <span style={{ width: '60px', textAlign: 'right' }}>WINS</span>
        <span style={{ width: '70px', textAlign: 'right' }}>WIN %</span>
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <div
          key={entry.address}
          style={{
            display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem',
            borderBottom: '1px solid #1a1a1a', fontSize: '0.85rem',
            background: entry.rank <= 3 ? `rgba(255, 69, 0, ${0.08 - entry.rank * 0.02})` : 'transparent',
          }}
        >
          <span style={{
            width: '30px', fontWeight: 'bold',
            color: entry.rank === 1 ? '#ff4500' : entry.rank <= 3 ? '#ff6b35' : '#666',
          }}>
            {entry.rank}
          </span>
          <a
            href={`https://basescan.org/address/${entry.address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, color: '#ccc', textDecoration: 'none' }}
          >
            {truncateAddress(entry.address)}
          </a>
          <span style={{ width: '100px', textAlign: 'right', color: '#ff4500' }}>
            {entry.volumeEth} ETH
          </span>
          <span style={{ width: '60px', textAlign: 'right', color: '#888' }}>
            {entry.totalBets}
          </span>
          <span style={{ width: '60px', textAlign: 'right', color: '#00cc44' }}>
            {entry.wins}
          </span>
          <span style={{
            width: '70px', textAlign: 'right',
            color: entry.winRate === '--' ? '#555' : '#00cc44',
          }}>
            {entry.winRate}
          </span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

// DYNAMIC LOADING: Isolating components from server-side crash
const WalletConnect = dynamic(
  () => import('./ClientComponents').then((mod) => mod.WalletConnect),
  { ssr: false }
);

const DeployMarketForm = dynamic(
  () => import('./ClientComponents').then((mod) => mod.DeployMarketForm),
  { ssr: false }
);

const BettingCard = dynamic(
  () => import('./components/BettingCard'),
  { ssr: false }
);

const Leaderboard = dynamic(
  () => import('./components/Leaderboard'),
  { ssr: false }
);

// --- CONFIGURATION ---
const CONTRACT_V1 = '0x591A48064c1DB035B1562d60ed27cE18B48Bd228';
const CONTRACT_V2 = '0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6';
const RPC_URL = 'https://base.llamarpc.com';

const ABI_V1 = [
  {
    "name": "marketCount",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "name": "markets",
    "type": "function",
    "inputs": [{"name": "", "type": "uint256"}],
    "outputs": [
      {"name": "question", "type": "string"},
      {"name": "totalYes", "type": "uint256"},
      {"name": "totalNo", "type": "uint256"},
      {"name": "resolved", "type": "bool"},
      {"name": "result", "type": "bool"},
      {"name": "ethPool", "type": "uint256"},
      {"name": "finalFee", "type": "uint256"}
    ],
    "stateMutability": "view"
  }
] as const;

const ABI_V2 = [
  {
    "name": "marketCount",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "name": "markets",
    "type": "function",
    "inputs": [{"name": "", "type": "uint256"}],
    "outputs": [
      {"name": "question", "type": "string"},
      {"name": "totalYes", "type": "uint256"},
      {"name": "totalNo", "type": "uint256"},
      {"name": "resolved", "type": "bool"},
      {"name": "result", "type": "bool"},
      {"name": "ethPool", "type": "uint256"},
      {"name": "finalFee", "type": "uint256"},
      {"name": "creator", "type": "address"}
    ],
    "stateMutability": "view"
  }
] as const;

export default function LandingPage() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Capture referral code from URL on mount (before wallet connection)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref && ref.trim()) {
        localStorage.setItem('chaos_referral_code', ref.trim());
        setReferralCode(ref.trim());
      } else {
        // Load previously stored referral code
        const stored = localStorage.getItem('chaos_referral_code');
        if (stored) setReferralCode(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    async function fetchMarkets() {
      const client = createPublicClient({ chain: base, transport: http(RPC_URL) });
      const fetchedMarkets: any[] = [];

      try {
        // Fetch V2 markets first (newest)
        const v2Count = await client.readContract({
          address: CONTRACT_V2,
          abi: ABI_V2,
          functionName: 'marketCount',
        }) as bigint;

        for (let i = Number(v2Count) - 1; i >= 0; i--) {
          const data = await client.readContract({
            address: CONTRACT_V2,
            abi: ABI_V2,
            functionName: 'markets',
            args: [BigInt(i)],
          }) as any;
          fetchedMarkets.push({
            id: i, version: 'V2', contract: CONTRACT_V2,
            question: data[0], totalYes: data[1], totalNo: data[2],
            ethPool: data[5],
          });
        }

        // Fetch V1 markets (legacy)
        const v1Count = await client.readContract({
          address: CONTRACT_V1,
          abi: ABI_V1,
          functionName: 'marketCount',
        }) as bigint;

        for (let i = Number(v1Count) - 1; i >= 0; i--) {
          const data = await client.readContract({
            address: CONTRACT_V1,
            abi: ABI_V1,
            functionName: 'markets',
            args: [BigInt(i)],
          }) as any;
          fetchedMarkets.push({
            id: i, version: 'V1', contract: CONTRACT_V1,
            question: data[0], totalYes: data[1], totalNo: data[2],
            ethPool: data[5],
          });
        }

        setMarkets(fetchedMarkets);
      } catch (error) {
        console.error("FAILED_TO_LOAD_MARKETS:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMarkets();
  }, []);

  // Aggregate stats
  const totalVolume = markets.reduce((sum, m) => sum + Number(formatEther(m.ethPool || BigInt(0))), 0);
  const totalBets = markets.reduce((sum, m) => sum + Number(m.totalYes || 0) + Number(m.totalNo || 0), 0);

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      padding: '0', maxWidth: '900px', margin: '0 auto',
      background: 'black', color: 'white', fontFamily: 'monospace'
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', borderBottom: '1px solid #222',
      }}>
        <span style={{ color: '#ff4500', fontWeight: 'bold', fontSize: '1.1rem' }}>CHAOS ORACLE</span>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: '#ff4500', textDecoration: 'none' }}>Markets</a>
          <a href="/claim" style={{ color: '#888', textDecoration: 'none' }}>Claim NFT</a>
          <a href="/collection" style={{ color: '#888', textDecoration: 'none' }}>Collection</a>
          <a href="/bridge" style={{ color: '#888', textDecoration: 'none' }}>Bridge</a>
        </div>
      </nav>

      <div style={{ padding: '2rem 2rem 4rem' }}>
        {/* Header */}
        <section style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#ff4500' }}>CHAOS ORACLE</h1>
          <p style={{ fontSize: '1.1rem', color: '#888' }}>AI-Powered Prediction Markets on Base</p>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <WalletConnect />
          </div>
        </section>

        {/* Live Stats Bar */}
        {!loading && markets.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '2rem',
            padding: '0.75rem', marginBottom: '2rem',
            border: '1px solid #222', background: '#050505',
            fontSize: '0.85rem',
          }}>
            <span style={{ color: '#888' }}>MARKETS: <span style={{ color: '#ff4500' }}>{markets.length}</span></span>
            <span style={{ color: '#888' }}>VOLUME: <span style={{ color: '#ff4500' }}>{totalVolume.toFixed(4)} ETH</span></span>
          </div>
        )}

        {/* Markets Section */}
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #ff4500', paddingLeft: '1rem' }}>
            ACTIVE_MARKETS
          </h2>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>SCANNING_BASE_BLOCKCHAIN...</div>
          ) : markets.length === 0 ? (
            <div style={{ border: '1px dashed #333', padding: '2rem', textAlign: 'center', color: '#555' }}>NO_MARKETS_FOUND_ON_CONTRACT</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {markets.map((m: any) => (
                <BettingCard
                  key={`${m.version}-${m.id}`}
                  id={m.id}
                  version={m.version}
                  contract={m.contract}
                  question={m.question}
                  totalYes={m.totalYes}
                  totalNo={m.totalNo}
                  ethPool={m.ethPool}
                  referralCode={referralCode}
                />
              ))}
            </div>
          )}
          {/* Leaderboard Section */}
          <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderLeft: '4px solid #ff4500', paddingLeft: '1rem' }}>
              TOP_PREDICTORS
            </h3>
            <Leaderboard />
          </div>

          <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>CREATE_NEW_MARKET</h3>
              <DeployMarketForm />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 'auto', padding: '2rem', borderTop: '1px solid #222', color: '#555', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
          <a href="https://x.com/ChaosOracle4all" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>X/TWITTER</a>
          <a href="https://warpcast.com/chaosmachine" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>WARPCAST</a>
          <a href="https://discord.gg/9GAFZvXC" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>DISCORD</a>
          <a href="https://github.com/chaosoracleforall-agent/chaos-oracle" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>GITHUB</a>
          <a href="https://basescan.org/address/0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>BASESCAN</a>
          <a href="/CHAOS_WHITEPAPER.txt" target="_blank" rel="noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>WHITEPAPER</a>
        </div>
        <p>PROTOCOL_VERSION: 3.0.0</p>
      </footer>
    </main>
  );
}

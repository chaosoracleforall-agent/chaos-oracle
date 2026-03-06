"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createPublicClient, http } from 'viem';
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

// --- CONFIGURATION ---
const CONTRACT_V1 = '0x591A48064c1DB035B1562d60ed27cE18B48Bd228';
const CONTRACT_V2 = '0x48b4a7fC8B6eD4FC3320A3286f25295a444e629D';
const RPC_URL = 'https://mainnet.base.org'; // HARD-CODED FOR FIREBASE STABILITY

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

  return (
    <main style={{ 
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', gap: '4rem',
      background: 'black', color: 'white', fontFamily: 'monospace'
    }}>
      {/* Header */}
      <section style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '2rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', color: '#ff4500' }}>CHAOS ORACLE</h1>
        <p style={{ fontSize: '1.2rem', color: '#888' }}>[SOVEREIGN AI PREDICTION ENGINE]</p>
        
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <WalletConnect />
          <a href="/bridge" style={{ 
            display: 'inline-block', border: '1px solid #ff4500', padding: '0.5rem 1rem', color: '#ff4500', 
            fontSize: '0.9rem', textDecoration: 'none', fontWeight: 'bold'
          }}>
            [CHAOS_BRIDGE_INGRESS] →
          </a>
        </div>
      </section>

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
            {markets.map((m: any, idx: number) => (
              <div key={`${m.version}-${m.id}`} style={{ border: '1px solid #333', padding: '1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', right: '15px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: m.version === 'V2' ? '#ff4500' : '#555', fontSize: '0.7rem', border: `1px solid ${m.version === 'V2' ? '#ff4500' : '#555'}`, padding: '2px 6px' }}>{m.version}</span>
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>#{m.id}</span>
                </div>
                <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{m.question}</p>
                <div style={{ display: 'flex', gap: '1.5rem', color: '#ff4500', fontSize: '0.9rem' }}>
                  <span>POOL: {(Number(m.ethPool) / 1e18).toFixed(4)} ETH</span>
                  <span style={{ color: '#00ff00' }}>YES: {(Number(m.totalYes) / 1e18).toFixed(4)}</span>
                  <span style={{ color: '#ff0000' }}>NO: {(Number(m.totalNo) / 1e18).toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>CREATE_NEW_MARKET</h3>
            <DeployMarketForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '4rem', color: '#555', fontSize: '0.8rem' }}>
        <p>PROTOCOL_VERSION: 2.0.0</p>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <a href="https://x.com/ChaosOracle4all" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>TWITTER_X</a>
          <a href="https://warpcast.com/chaosmachine" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>WARPCAST</a>
          <a href="https://discord.gg/9GAFZvXC" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>DISCORD</a>
          <a href="https://github.com/chaosoracleforall-agent/chaos-oracle" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>GITHUB</a>
          <a href="https://basescan.org/address/0x48b4a7fC8B6eD4FC3320A3286f25295a444e629D" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>BASESCAN_V2</a>
          <a href="/CHAOS_WHITEPAPER.txt" target="_blank" rel="noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>WHITEPAPER</a>
        </div>
      </footer>
    </main>
  );
}

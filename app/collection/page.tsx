"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const WalletConnect = dynamic(
  () => import('../ClientComponents').then((mod) => mod.WalletConnect),
  { ssr: false }
);

const CHAOS_CARDS = '0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5' as `0x${string}`;
const RPC_URL = 'https://mainnet.base.org';

const CHAOS_CARDS_ABI = parseAbi([
  'function totalMinted() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tierMintCount(uint8) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);

const TIER_NAMES = ['Prophecy', 'Rekt Certificate', 'Chaos Disciple', 'Chaos Tarot', 'The Oracle Speaks'];
const TIER_COLORS = ['#9b59b6', '#e74c3c', '#3498db', '#f39c12', '#ff4500'];

interface NFTItem {
  tokenId: number;
  metadata: any;
  imageUrl: string | null;
}

function resolveIPFS(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  }
  return uri;
}

export default function CollectionPage() {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [tierCounts, setTierCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const client = createPublicClient({ chain: base, transport: http(RPC_URL) });

      try {
        const minted = await client.readContract({
          address: CHAOS_CARDS,
          abi: CHAOS_CARDS_ABI,
          functionName: 'totalMinted',
        });
        setTotalMinted(Number(minted));

        // Fetch tier counts
        const counts: number[] = [];
        for (let i = 0; i < 5; i++) {
          const count = await client.readContract({
            address: CHAOS_CARDS,
            abi: CHAOS_CARDS_ABI,
            functionName: 'tierMintCount',
            args: [i],
          });
          counts.push(Number(count));
        }
        setTierCounts(counts);
      } catch (err) {
        console.error('Failed to fetch collection stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      background: 'black',
      color: 'white',
      fontFamily: 'monospace',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', borderBottom: '1px solid #222',
      }}>
        <a href="/" style={{ color: '#ff4500', fontWeight: 'bold', fontSize: '1.1rem', textDecoration: 'none' }}>CHAOS ORACLE</a>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: '#888', textDecoration: 'none' }}>Markets</a>
          <a href="/claim" style={{ color: '#888', textDecoration: 'none' }}>Claim NFT</a>
          <a href="/collection" style={{ color: '#ff4500', textDecoration: 'none' }}>Collection</a>
        </div>
      </nav>

      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <section style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#ff4500', marginBottom: '0.5rem' }}>CHAOS CARDS</h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>AI-Generated NFT Collection on Base</p>
        </section>

        {/* Global Stats */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>LOADING_COLLECTION_DATA...</div>
        ) : (
          <>
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '2rem',
              padding: '1rem', marginBottom: '2rem',
              border: '1px solid #222', background: '#050505',
              flexWrap: 'wrap',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff4500', fontSize: '2rem', fontWeight: 'bold' }}>{totalMinted}</div>
                <div style={{ color: '#555', fontSize: '0.75rem' }}>TOTAL_MINTED</div>
              </div>
            </div>

            {/* Tier Distribution */}
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderLeft: '4px solid #ff4500', paddingLeft: '1rem' }}>
                TIER_DISTRIBUTION
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {TIER_NAMES.map((name, i) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid #222',
                    background: '#050505',
                  }}>
                    <div style={{
                      width: '12px', height: '12px', borderRadius: '2px',
                      background: TIER_COLORS[i], flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontSize: '0.9rem' }}>{name}</span>
                    <span style={{ color: TIER_COLORS[i], fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {tierCounts[i]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div style={{
              textAlign: 'center', padding: '2rem',
              border: '1px solid #333', background: '#0a0a0a',
            }}>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Interact with @ChaosOracle4all on X or Farcaster to earn a Chaos Card
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="/claim" style={{
                  display: 'inline-block', background: '#ff4500', color: 'black',
                  padding: '0.75rem 1.5rem', textDecoration: 'none', fontWeight: 'bold',
                  fontFamily: 'monospace',
                }}>
                  CLAIM_A_CARD
                </a>
                <a href="https://x.com/ChaosOracle4all" target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-block', border: '1px solid #555', color: '#888',
                  padding: '0.75rem 1.5rem', textDecoration: 'none',
                  fontFamily: 'monospace',
                }}>
                  @ChaosOracle4all
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 'auto', padding: '2rem', borderTop: '1px solid #222', color: '#555', fontSize: '0.8rem' }}>
        <p>Contract: <a href={`https://basescan.org/address/${CHAOS_CARDS}`} target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>{CHAOS_CARDS.slice(0, 10)}...{CHAOS_CARDS.slice(-8)}</a></p>
      </footer>
    </div>
  );
}

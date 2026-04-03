"use client";

import { useEffect } from 'react';

const BRIDGES = [
  { name: 'Base Bridge (Official)', url: 'https://bridge.base.org', description: 'Official Coinbase Base bridge. Supports ETH and ERC-20 tokens from Ethereum mainnet.' },
  { name: 'Relay', url: 'https://relay.link/bridge/base', description: 'Fast cross-chain bridge. Low fees, multiple chain support.' },
  { name: 'Orbiter Finance', url: 'https://www.orbiter.finance/?dest=base', description: 'Cross-rollup bridge optimized for L2-to-L2 transfers.' },
];

export default function BridgePage() {
  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <nav style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
          <a href="/" style={{ color: '#ff4500' }}>Markets</a>
          <a href="/claim" style={{ color: '#888' }}>Claim NFT</a>
          <a href="/collection" style={{ color: '#888' }}>Collection</a>
          <a href="/bridge" style={{ color: '#fff', textDecoration: 'underline' }}>Bridge</a>
        </nav>

        <h1 style={{ color: '#ff4500', marginBottom: '0.5rem' }}>[BRIDGE_TO_BASE]</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>
          Bridge ETH to Base to participate in Chaos Oracle prediction markets.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {BRIDGES.map((bridge) => (
            <a
              key={bridge.name}
              href={bridge.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: '1px solid #333',
                padding: '1.5rem',
                display: 'block',
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ff4500')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333')}
            >
              <div style={{ color: '#ff4500', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {bridge.name} &rarr;
              </div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>
                {bridge.description}
              </div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <a href="/" style={{ color: '#ff4500' }}>&larr; Back to Markets</a>
        </div>
      </div>
    </main>
  );
}

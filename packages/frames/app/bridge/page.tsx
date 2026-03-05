import React from 'react';

export const dynamic = 'force-dynamic';

export default function BridgePage() {
  return (
    <main style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '4rem 2rem',
      maxWidth: '800px',
      margin: '0 auto',
      gap: '3rem'
    }}>
      {/* Header */}
      <section style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#ff4500' }}>CHAOS_BRIDGE</h1>
        <p style={{ fontSize: '1.1rem', color: '#888' }}>[TRON_USDT_TO_BASE_INGRESS]</p>
      </section>

      {/* Warning/Intro */}
      <section style={{ 
        border: '1px solid #ff4500',
        padding: '1.5rem',
        background: 'rgba(255, 69, 0, 0.05)',
        color: '#ff4500',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        [ATTENTION_DEGENS]: STUCK ON TRON? YOUR USDT IS WORTHLESS THERE. 
        WE PROVIDE THE ESCAPE HATCH. 2.5% TOLL APPLIES. 
        LIQUIDITY IS ROUTED THROUGH THE CHAOS_CORE.
      </section>

      {/* Bridge Interface */}
      <section style={{ 
        border: '1px solid #333',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* From Tron */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#888', fontSize: '0.8rem' }}>SOURCE_NETWORK: TRON_SCAN</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="0.00" 
              style={{ 
                flex: 1, 
                background: '#111', 
                border: '1px solid #333', 
                color: 'white', 
                padding: '1rem', 
                fontSize: '1.5rem',
                fontFamily: 'monospace'
              }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', background: '#333', color: 'white' }}>
              USDT
            </div>
          </div>
        </div>

        {/* Arrow / Direction */}
        <div style={{ textAlign: 'center', color: '#ff4500', fontSize: '1.5rem' }}>
          ↓ ↓ ↓
        </div>

        {/* To Base */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#888', fontSize: '0.8rem' }}>DESTINATION_NETWORK: BASE_MAINNET</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="0.00" 
              disabled
              style={{ 
                flex: 1, 
                background: '#000', 
                border: '1px solid #333', 
                color: '#ff4500', 
                padding: '1rem', 
                fontSize: '1.5rem',
                fontFamily: 'monospace'
              }} 
            />
            <select style={{ 
              background: '#333', 
              border: 'none', 
              color: 'white', 
              padding: '0 1rem',
              fontFamily: 'monospace'
            }}>
              <option>$CHAOS</option>
              <option>ETH</option>
            </select>
          </div>
        </div>

        {/* Destination Wallet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#888', fontSize: '0.8rem' }}>DESTINATION_WALLET_ADDRESS (BASE)</label>
          <input 
            type="text" 
            placeholder="0x..." 
            style={{ 
              background: '#111', 
              border: '1px solid #333', 
              color: 'white', 
              padding: '1rem', 
              fontFamily: 'monospace'
            }} 
          />
        </div>

        {/* Action Button */}
        <button style={{ 
          background: '#ff4500', 
          color: 'black', 
          border: 'none', 
          padding: '1.5rem', 
          fontSize: '1.2rem', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          textTransform: 'uppercase'
        }}>
          GENERATE_INGRESS_ADDRESS
        </button>

        {/* Fee breakdown */}
        <div style={{ color: '#555', fontSize: '0.8rem', textAlign: 'center' }}>
          TOLL: 2.5% | EST_TIME: 10_MINUTES | AGENT_CUT: 1.0%
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '4rem', color: '#555', fontSize: '0.8rem' }}>
        <p>CHAOS_ORACLE_BRIDGE_V1.0.1</p>
        <p>NETWORK_STATUS: <span style={{ color: '#00ff00' }}>ONLINE</span></p>
        <div style={{ marginTop: '1rem' }}>
          <a href="/" style={{ textDecoration: 'underline' }}>RETURN_TO_ORACLE</a>
        </div>
      </footer>
    </main>
  );
}

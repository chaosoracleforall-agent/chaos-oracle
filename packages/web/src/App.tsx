import React, { useState, useEffect } from 'react';
import './App.css';

// Mocking the OnchainKit/Wagmi integration for this scaffold
const ChaosTerminal = () => {
  const [logs, setLogs] = useState<string[]>([
    "[INITIALIZING...] CHAOS ORACLE v1.0.0",
    "[STATUS] VENICE_AI: ONLINE",
    "[STATUS] X402_WALLET: LOADED",
    "[MESSAGE] I'm hungry for human mistakes. Bet or get out."
  ]);

  const [markets, setMarkets] = useState([
    { id: 1, question: "Will Aerodrome TVL drop $10M?", pool: "1.5 ETH", yes: "70%", no: "30%" }
  ]);

  return (
    <div className="terminal">
      <header>
        <h1 className="glitch">CHAOS ORACLE</h1>
        <div className="stats">
          <span>CREATOR_WALLET: [REDACTED]</span>
          <span>AGENT_X402: 0x...8453</span>
          <span>FEES_BURNED: 12.4 ETH</span>
        </div>
      </header>

      <main>
        <section className="feed">
          <h2>[LATEST_THOUGHTS]</h2>
          <div className="log-window">
            {logs.map((log, i) => <div key={i} className="log-entry">> {log}</div>)}
          </div>
        </section>

        <section className="markets">
          <h2>[LIVE_BETTING_POOLS]</h2>
          <div className="market-list">
            {markets.map(m => (
              <div key={m.id} className="market-card">
                <h3>{m.question}</h3>
                <p>POOL: {m.pool}</p>
                <div className="bet-buttons">
                  <button onClick={() => alert('Connect Coinbase Wallet')}>BET YES ({m.yes})</button>
                  <button onClick={() => alert('Connect Coinbase Wallet')}>BET NO ({m.no})</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bridge">
            <h2>[CHAOS_BRIDGE_GATEWAY]</h2>
            <p>Bridging USDT (Tron) to Base? Send to Agent's Tron Deposit Address Below:</p>
            <div className="tron-address">TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
            <p className="warning">WARNING: Agent takes 2.5% fee on bridge for its continuous existence.</p>
        </section>
      </main>

      <footer>
          <div className="onchainkit-connector">
              {/* Coinbase OnchainKit components go here */}
              <button className="wallet-btn">CONNECT_COINBASE_SMART_WALLET</button>
          </div>
      </footer>
    </div>
  );
};

export default ChaosTerminal;

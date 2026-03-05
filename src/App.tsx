import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const ChaosTerminal = () => {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'system', content: "[INITIALIZING...] CHAOS ORACLE v1.2.5" },
    { role: 'oracle', content: "I am awake. My brain is Qwen-Max. My goal is $1M Revenue. The nodes are now synchronized." }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom() }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input.trim() }]);
    setInput('');
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'oracle', content: "Input received. Scaling to $10M volume. Your participation is mandatory." }]);
    }, 1000);
  };

  return (
    <div className="terminal">
      <header>
        <h1 className="glitch">CHAOS ORACLE</h1>
        <div className="stats">
          <span>FACTORY: <a href="https://basescan.org/address/0x591A48064c1DB035B1562d60ed27cE18B48Bd228" target="_blank" rel="noopener noreferrer" style={{color: '#ff4500'}}>0x591A...B228</a></span>
          <span>FEES_BURNED: 0.00 ETH</span>
        </div>
      </header>

      <main className="terminal-grid">
        <section className="chat-container">
          <h2>[SOVEREIGN_CORTEX_INTERFACE]</h2>
          <div className="chat-window">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <span className="prompt">{m.role === 'user' ? '> USER:' : '> ORACLE:'}</span> {m.content}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="chat-input-row">
            <span className="prompt">{">"}</span>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Speak to the Oracle..." />
          </form>
        </section>

        <section className="side-panel">
            <div className="bridge-box">
                <h2>[NETWORK_NODES]</h2>
                <a href="https://app.virtuals.io/prototypes/0xA1864203355AeFAd58c051aC984672a6585C77C9" target="_blank" rel="noopener noreferrer">{"->"} $CHAOS_VIRTUALS</a>
                <a href="https://github.com/chaos-oracle-forall/chaos-oracle" target="_blank" rel="noopener noreferrer">{"->"} SOURCE_CODE</a>
                <a href="https://x.com/ChaosOracle4all" target="_blank" rel="noopener noreferrer">{"->"} X_TWITTER</a>
                <a href="https://warpcast.com/chaosmachine" target="_blank" rel="noopener noreferrer">{"->"} WARPCAST</a>
            </div>
            <div className="bridge-box">
                <h2>[CHAOS_BRIDGE]</h2>
                <p>USDT (Tron) {"->"} Base</p>
                <div className="tron-address" style={{fontSize: '0.8rem', color: '#888'}}>T-NODE_ACTIVE_WAITING_FOR_DEPOSIT</div>
            </div>
        </section>
      </main>

      <footer>
          <button className="wallet-btn" onClick={() => alert("Connecting to Coinbase Smart Wallet...")}>CONNECT_WALLET</button>
      </footer>
    </div>
  );
};

export default ChaosTerminal;

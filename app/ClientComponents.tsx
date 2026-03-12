"use client";

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'viem/chains';

const CONTRACT_ADDRESS = '0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6' as `0x${string}`;

const ABI = [
  {
    "name": "createMarket",
    "type": "function",
    "inputs": [{"name": "_question", "type": "string"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable"
  }
] as const;

export function WalletConnect() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
      <ConnectButton showBalance={false} />
    </div>
  );
}

export function DeployMarketForm() {
  const [question, setQuestion] = useState("");
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'createMarket',
      args: [question],
      value: parseEther('0.001'),
    });
  };

  return (
    <form onSubmit={handleDeploy} style={{ border: '1px solid #333', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
      <h3 style={{ color: '#ff4500' }}>[DEPLOY_NEW_MARKET]</h3>
      <input 
        type="text" 
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Will Aerodrome TVL cross $1B this week?" 
        style={{ 
          background: '#111', 
          border: '1px solid #333', 
          color: 'white', 
          padding: '1rem', 
          fontFamily: 'monospace',
          fontSize: '1rem'
        }} 
      />
      <button 
        type="submit" 
        disabled={isPending || isConfirming}
        style={{ 
          background: isPending || isConfirming ? '#555' : '#ff4500', 
          color: 'black', 
          border: 'none', 
          padding: '1rem', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase'
        }}
      >
        {isPending ? 'CONFIRM_IN_WALLET...' : isConfirming ? 'DEPLOYING_ON_BASE...' : 'DEPLOY_MARKET'}
      </button>

      {isSuccess && (
        <div style={{ color: '#00ff00', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          SUCCESS_TX: {hash}
        </div>
      )}
    </form>
  );
}

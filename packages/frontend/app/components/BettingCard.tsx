"use client";

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';

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

const PRESETS = ['0.01', '0.05', '0.1'];

interface BettingCardProps {
  id: number;
  version: string;
  contract: string;
  question: string;
  totalYes: bigint;
  totalNo: bigint;
  ethPool: bigint;
  referralCode?: string | null;
}

export default function BettingCard({ id, version, contract, question, totalYes, totalNo, ethPool, referralCode }: BettingCardProps) {
  const [amount, setAmount] = useState('0.01');
  const [expanded, setExpanded] = useState(false);
  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const yesNum = Number(totalYes);
  const noNum = Number(totalNo);
  const total = yesNum + noNum;
  const yesPct = total > 0 ? Math.round((yesNum / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const poolEth = Number(formatEther(ethPool));

  const placeBet = (betYes: boolean) => {
    reset();
    // Track referral attribution for off-chain growth engine
    if (referralCode) {
      try {
        const existing = JSON.parse(localStorage.getItem('chaos_referral_bets') || '[]');
        existing.push({
          marketId: id,
          betYes,
          amount,
          referralCode,
          timestamp: Date.now(),
        });
        localStorage.setItem('chaos_referral_bets', JSON.stringify(existing.slice(-100)));
      } catch {}
    }
    writeContract({
      address: contract as `0x${string}`,
      abi: PLACE_BET_ABI,
      functionName: 'placeBet',
      args: [BigInt(id), betYes],
      value: parseEther(amount),
    });
  };

  // Calculate potential payout (simplified: your share of the opposite pool)
  const amountWei = parseEther(amount || '0');
  const potentialYesPayout = total > 0
    ? (Number(amountWei) / (yesNum + Number(amountWei))) * (noNum + Number(amountWei))
    : Number(amountWei);
  const potentialNoPayout = total > 0
    ? (Number(amountWei) / (noNum + Number(amountWei))) * (yesNum + Number(amountWei))
    : Number(amountWei);

  return (
    <div style={{
      border: '1px solid #333',
      padding: '1.5rem',
      position: 'relative',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: '10px', right: '15px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{
          color: version === 'V2' ? '#ff4500' : '#555',
          fontSize: '0.7rem',
          border: `1px solid ${version === 'V2' ? '#ff4500' : '#555'}`,
          padding: '2px 6px',
        }}>{version}</span>
        <span style={{ color: '#888', fontSize: '0.8rem' }}>#{id}</span>
      </div>

      <p style={{ fontSize: '1.2rem', marginBottom: '1rem', paddingRight: '4rem' }}>{question}</p>

      {/* Probability Bar */}
      <div style={{ display: 'flex', height: '8px', marginBottom: '0.75rem', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${yesPct}%`, background: '#00cc44', transition: 'width 0.3s' }} />
        <div style={{ width: `${noPct}%`, background: '#cc0000', transition: 'width 0.3s' }} />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        <span style={{ color: '#00cc44' }}>YES {yesPct}%</span>
        <span style={{ color: '#ff4500' }}>POOL: {poolEth.toFixed(4)} ETH</span>
        <span style={{ color: '#cc0000' }}>NO {noPct}%</span>
      </div>

      {/* Expand/Collapse Bet UI */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid #ff4500',
            color: '#ff4500',
            padding: '0.6rem',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          PLACE_BET
        </button>
      ) : (
        <div style={{ borderTop: '1px solid #222', paddingTop: '1rem', marginTop: '0.5rem' }}>
          {/* Amount Input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                flex: 1,
                background: '#111',
                border: '1px solid #333',
                color: 'white',
                padding: '0.6rem',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }}
            />
            <span style={{ color: '#888', fontSize: '0.85rem' }}>ETH</span>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                style={{
                  flex: 1,
                  background: amount === p ? '#222' : 'transparent',
                  border: '1px solid #333',
                  color: amount === p ? '#ff4500' : '#666',
                  padding: '0.4rem',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* YES / NO Buttons */}
          {!isConnected ? (
            <p style={{ color: '#ff4500', fontSize: '0.85rem', textAlign: 'center' }}>
              Connect wallet above to bet
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => placeBet(true)}
                disabled={isPending || isConfirming}
                style={{
                  flex: 1,
                  background: isPending || isConfirming ? '#333' : '#00cc44',
                  color: 'black',
                  border: 'none',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                YES
              </button>
              <button
                onClick={() => placeBet(false)}
                disabled={isPending || isConfirming}
                style={{
                  flex: 1,
                  background: isPending || isConfirming ? '#333' : '#cc0000',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                }}
              >
                NO
              </button>
            </div>
          )}

          {/* Transaction Status */}
          {isPending && (
            <p style={{ color: '#ff4500', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
              CONFIRM_IN_WALLET...
            </p>
          )}
          {isConfirming && (
            <p style={{ color: '#ff4500', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
              CONFIRMING_ON_BASE...
            </p>
          )}
          {isSuccess && (
            <p style={{ color: '#00ff00', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
              BET_PLACED — <a
                href={`https://basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00ff00' }}
              >VIEW_TX</a>
            </p>
          )}
          {error && (
            <p style={{ color: '#ff4444', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem', wordBreak: 'break-word' }}>
              {(error as any).shortMessage || error.message}
            </p>
          )}

          {/* Collapse */}
          <button
            onClick={() => { setExpanded(false); reset(); }}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              background: 'transparent',
              border: 'none',
              color: '#555',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            [COLLAPSE]
          </button>
        </div>
      )}
    </div>
  );
}

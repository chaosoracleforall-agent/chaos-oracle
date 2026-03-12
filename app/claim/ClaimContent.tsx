"use client";

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { keccak256, toBytes } from 'viem';

const CHAOS_CARDS = '0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5' as `0x${string}`;

const CHAOS_CARDS_ABI = [
  {
    name: 'claim',
    type: 'function',
    inputs: [{ name: 'claimCode', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'campaignActive',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'totalMinted',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'claimExists',
    type: 'function',
    inputs: [{ name: 'claimHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export default function ClaimContent() {
  const [claimCode, setClaimCode] = useState('');
  const [claimStatus, setClaimStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const { isConnected, address } = useAccount();
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: campaignActive } = useReadContract({
    address: CHAOS_CARDS,
    abi: CHAOS_CARDS_ABI,
    functionName: 'campaignActive',
  });

  const { data: totalMinted } = useReadContract({
    address: CHAOS_CARDS,
    abi: CHAOS_CARDS_ABI,
    functionName: 'totalMinted',
  });

  // Check if claim code exists on-chain (uses the actual contract function)
  const trimmedCode = claimCode.trim();
  const { data: codeExists } = useReadContract({
    address: CHAOS_CARDS,
    abi: CHAOS_CARDS_ABI,
    functionName: 'claimExists',
    args: trimmedCode.length > 5 ? [keccak256(toBytes(trimmedCode))] : undefined,
    query: { enabled: trimmedCode.length > 5 },
  });

  // Parse claim code from URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setClaimCode(code);
    }
  }, []);

  const handleCheck = () => {
    if (!trimmedCode) return;
    if (codeExists) {
      setClaimStatus('valid');
    } else {
      setClaimStatus('invalid');
    }
  };

  const handleClaim = () => {
    if (!trimmedCode) return;
    reset();
    writeContract({
      address: CHAOS_CARDS,
      abi: CHAOS_CARDS_ABI,
      functionName: 'claim',
      args: [trimmedCode],
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(180deg, #000 0%, #0a0008 50%, #000 100%)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#ff4500',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}>
          CHAOS CARDS
        </h1>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          AI-Generated NFT Collection on Base
        </p>
        {totalMinted !== undefined && (
          <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {Number(totalMinted)} cards minted
          </p>
        )}
      </div>

      {/* Wallet */}
      <div style={{ marginBottom: '2rem' }}>
        <ConnectButton showBalance={false} />
      </div>

      {/* Campaign Status */}
      {campaignActive === false && (
        <div style={{
          background: '#220000',
          border: '1px solid #ff0000',
          padding: '1rem',
          marginBottom: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}>
          <span style={{ color: '#ff4444' }}>CAMPAIGN PAUSED — Claims temporarily disabled</span>
        </div>
      )}

      {/* Claim Box */}
      <div style={{
        border: '1px solid #333',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        background: '#0a0a0a',
      }}>
        <h2 style={{ color: '#ff4500', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          [REDEEM_CLAIM_CODE]
        </h2>

        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Enter the claim code you received from the Chaos Oracle agent.
        </p>

        <input
          type="text"
          value={claimCode}
          onChange={(e) => {
            setClaimCode(e.target.value);
            setClaimStatus('idle');
          }}
          placeholder="CHAOS-xxxxxxxxxxxx"
          maxLength={50}
          style={{
            background: '#111',
            border: '1px solid #333',
            color: 'white',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            width: '100%',
            boxSizing: 'border-box',
            textAlign: 'center',
            letterSpacing: '0.1em',
          }}
        />

        {/* Check button */}
        {claimStatus === 'idle' && trimmedCode.length > 5 && (
          <button
            onClick={handleCheck}
            style={{
              width: '100%',
              marginTop: '1rem',
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            VERIFY_CODE
          </button>
        )}

        {/* Valid claim — show claim button */}
        {claimStatus === 'valid' && (
          <div style={{
            marginTop: '1.5rem',
            border: '1px solid #ff4500',
            padding: '1.5rem',
            textAlign: 'center',
            background: '#050505',
          }}>
            <p style={{ color: '#ff4500', fontSize: '0.8rem', letterSpacing: '0.2em' }}>
              CHAOS CARD
            </p>
            <p style={{ color: '#ccc', fontSize: '1.1rem', margin: '0.5rem 0' }}>
              Claim Code Verified
            </p>
            <p style={{ color: '#555', fontSize: '0.75rem' }}>
              This NFT will be minted to your connected wallet.
            </p>

            {!isConnected ? (
              <p style={{ color: '#ff4500', fontSize: '0.85rem', marginTop: '1rem' }}>
                Connect your wallet above to claim.
              </p>
            ) : (
              <button
                onClick={handleClaim}
                disabled={isPending || isConfirming || isSuccess || campaignActive === false}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  background: isSuccess ? '#333' : '#ff4500',
                  color: isSuccess ? '#888' : 'black',
                  border: 'none',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  cursor: (isPending || isConfirming || isSuccess) ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'CONFIRM_IN_WALLET...' :
                  isConfirming ? 'MINTING_ON_BASE...' :
                  isSuccess ? 'CLAIMED' :
                  'CLAIM_CHAOS_CARD'}
              </button>
            )}

            {isSuccess && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: '#00ff00', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  NFT_MINTED — TX: <a
                    href={`https://basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#00ff00' }}
                  >{hash?.slice(0, 20)}...</a>
                </div>

                {/* Share-to-earn */}
                <div style={{
                  borderTop: '1px solid #333',
                  paddingTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <p style={{ color: '#ff4500', fontSize: '0.8rem', letterSpacing: '0.1em' }}>SHARE_YOUR_CHAOS_CARD</p>
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent('Just claimed my Chaos Card NFT from @ChaosOracle4all \uD83D\uDD2E Predict the future on Base \u2192 https://chaos-oracle-147d0.web.app/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      background: '#1DA1F2',
                      color: 'white',
                      textAlign: 'center',
                      padding: '0.6rem',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    SHARE_ON_X
                  </a>
                  <a
                    href={`https://warpcast.com/~/compose?text=${encodeURIComponent('Just claimed my Chaos Card NFT from @chaosmachine \uD83D\uDD2E Predict the future on Base \u2192')}&embeds[]=${encodeURIComponent('https://chaos-oracle-147d0.web.app/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      background: '#7c3aed',
                      color: 'white',
                      textAlign: 'center',
                      padding: '0.6rem',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    SHARE_ON_WARPCAST
                  </a>
                  {address && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p style={{ color: '#555', fontSize: '0.7rem' }}>YOUR_REFERRAL_LINK:</p>
                      <input
                        readOnly
                        value={`https://chaos-oracle-147d0.web.app/claim?ref=${address.slice(0, 8)}`}
                        onClick={(e) => {
                          (e.target as HTMLInputElement).select();
                          navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                        }}
                        style={{
                          width: '100%',
                          background: '#111',
                          border: '1px solid #333',
                          color: '#888',
                          padding: '0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: '1rem', color: '#ff4444', fontSize: '0.8rem', wordBreak: 'break-word' }}>
                {(error as any).shortMessage || error.message}
              </div>
            )}
          </div>
        )}

        {/* Invalid claim */}
        {claimStatus === 'invalid' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #ff0000',
            background: '#1a0000',
            textAlign: 'center',
          }}>
            <p style={{ color: '#ff4444', fontSize: '0.9rem' }}>
              INVALID_CODE — This claim code does not exist or has already been redeemed.
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{
        marginTop: '2rem',
        maxWidth: '500px',
        width: '100%',
        padding: '1.5rem',
        border: '1px solid #222',
        background: '#050505',
      }}>
        <h3 style={{ color: '#ff4500', fontSize: '0.9rem', marginBottom: '1rem' }}>
          [HOW_IT_WORKS]
        </h3>
        <div style={{ color: '#888', fontSize: '0.8rem', lineHeight: '1.6' }}>
          <p>1. Interact with @ChaosOracle4all on X/Twitter</p>
          <p>2. The Oracle may reward you with a unique AI-generated NFT</p>
          <p>3. You&apos;ll receive a claim code (CHAOS-xxxx)</p>
          <p>4. Connect your wallet and enter the code above</p>
          <p>5. Your Chaos Card is minted directly to your wallet on Base</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <a href="/" style={{ color: '#555', fontSize: '0.8rem', textDecoration: 'none' }}>
          ← Back to Prediction Markets
        </a>
        <p style={{ color: '#333', fontSize: '0.7rem', marginTop: '1rem' }}>
          Contract: {CHAOS_CARDS.slice(0, 10)}...{CHAOS_CARDS.slice(-8)} · Base Mainnet
        </p>
      </div>
    </div>
  );
}

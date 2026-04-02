/**
 * Aerodrome CHAOS/WETH Pool Creator
 *
 * Prerequisites:
 * 1. Agent wallet must hold $CHAOS tokens (buy via Virtuals first)
 * 2. Agent wallet must hold ETH for liquidity + gas
 * 3. Approve the Aerodrome router to spend $CHAOS tokens
 *
 * Aerodrome Router (Base): 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43
 * WETH (Base): 0x4200000000000000000000000000000000000006
 */

import { createWalletClient, http, publicActions, parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY! as `0x${string}`);
const client = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') }).extend(publicActions);

const CHAOS_TOKEN = '0xA1864203355AeFAd58c051aC984672a6585C77C9' as `0x${string}`;
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`;
const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as `0x${string}`;

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const;

const ROUTER_ABI = [
  {
    name: 'addLiquidityETH',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'stable', type: 'bool' },
      { name: 'amountTokenDesired', type: 'uint256' },
      { name: 'amountTokenMin', type: 'uint256' },
      { name: 'amountETHMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountToken', type: 'uint256' },
      { name: 'amountETH', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
] as const;

async function createPool() {
  // Check balances
  const ethBalance = await client.getBalance({ address: account.address });
  const chaosBalance = await client.readContract({
    address: CHAOS_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address],
  });

  console.log(`[POOL_CREATOR] Agent Wallet: ${account.address}`);
  console.log(`[POOL_CREATOR] ETH Balance: ${formatEther(ethBalance)}`);
  console.log(`[POOL_CREATOR] CHAOS Balance: ${formatUnits(chaosBalance, 18)}`);

  if (chaosBalance === BigInt(0)) {
    console.error('[POOL_CREATOR] ERROR: No $CHAOS tokens in wallet. Buy some via Virtuals.io first.');
    console.log('[POOL_CREATOR] Steps:');
    console.log('  1. Go to https://app.virtuals.io/prototypes/0xA1864203355AeFAd58c051aC984672a6585C77C9');
    console.log('  2. Buy $CHAOS with ETH from agent wallet');
    console.log('  3. Run this script again');
    return;
  }

  // Use 50% of CHAOS balance and proportional ETH
  const chaosAmount = chaosBalance / BigInt(2);
  const ethAmount = parseEther('0.15'); // Adjust based on desired pool depth

  console.log(`[POOL_CREATOR] Creating Aerodrome CHAOS/WETH volatile pool...`);
  console.log(`  CHAOS: ${formatUnits(chaosAmount, 18)}`);
  console.log(`  ETH:   ${formatEther(ethAmount)}`);

  // Step 1: Approve router to spend CHAOS
  console.log('[POOL_CREATOR] Approving Aerodrome router...');
  const approveHash = await client.writeContract({
    address: CHAOS_TOKEN,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [AERODROME_ROUTER, chaosAmount],
  });
  console.log(`  Approve TX: ${approveHash}`);
  // Wait for approval to be confirmed on-chain
  console.log('  Waiting for approval confirmation...');
  await client.waitForTransactionReceipt({ hash: approveHash });
  console.log('  Approval confirmed.');

  // Step 2: Add liquidity
  console.log('[POOL_CREATOR] Adding liquidity...');
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 min deadline
  const hash = await client.writeContract({
    address: AERODROME_ROUTER,
    abi: ROUTER_ABI,
    functionName: 'addLiquidityETH',
    args: [
      CHAOS_TOKEN,
      false, // volatile pair (not stable)
      chaosAmount,
      (chaosAmount * BigInt(95)) / BigInt(100), // 5% slippage on tokens
      (ethAmount * BigInt(95)) / BigInt(100),   // 5% slippage on ETH
      account.address,
      deadline,
    ],
    value: ethAmount,
    gas: 3000000n, // Pool creation + liquidity requires ~2-3M gas
  });

  console.log(`[POOL_CREATOR] Liquidity added! TX: ${hash}`);
  console.log('[POOL_CREATOR] The CHAOS/WETH Aerodrome pool is now live.');
  console.log('[POOL_CREATOR] DexScreener and GeckoTerminal should detect it within minutes.');
}

createPool().catch(e => console.error('[POOL_CREATOR] Failed:', e.shortMessage || e.message));

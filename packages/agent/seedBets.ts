import { createWalletClient, http, fallback, publicActions, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

let _account: ReturnType<typeof privateKeyToAccount> | null = null;
let _client: any = null;
function getClient() {
  if (!_client) {
    const key = process.env.AGENT_PRIVATE_KEY as `0x${string}`;
    if (!key || key === 'GCP_SECRET_MANAGER') throw new Error('AGENT_PRIVATE_KEY not loaded');
    _account = privateKeyToAccount(key);
    const rpc = process.env.BASE_RPC_URL || 'https://base.llamarpc.com';
    _client = createWalletClient({
      account: _account!, chain: base,
      transport: fallback([http(rpc), http('https://mainnet.base.org')], { retryCount: 2 }),
    }).extend(publicActions);
  }
  return _client;
}
const getCONTRACT = () => process.env.CONTRACT_ADDRESS! as `0x${string}`;

const PLACE_BET_ABI = [{
  name: "placeBet",
  type: "function",
  inputs: [{ name: "_marketId", type: "uint256" }, { name: "_betYes", type: "bool" }],
  outputs: [],
  stateMutability: "payable"
}] as const;

// Seed bets: 0.01 ETH on each side of each market to create initial pools
// Total: ~0.015 ETH (leaves gas buffer from 0.0189 balance)
const SEED_BETS = [
  { marketId: 0, betYes: true,  amount: '0.002' },  // BTC > $80K
  { marketId: 0, betYes: false, amount: '0.001' },
  { marketId: 1, betYes: true,  amount: '0.002' },  // AI agent $1M DeFi
  { marketId: 1, betYes: false, amount: '0.001' },
  { marketId: 2, betYes: true,  amount: '0.002' },  // Base #1 L2
  { marketId: 2, betYes: false, amount: '0.001' },
  { marketId: 3, betYes: true,  amount: '0.002' },  // MCP standard
  { marketId: 3, betYes: false, amount: '0.001' },
  { marketId: 4, betYes: true,  amount: '0.002' },  // $CHAOS $1M FDV
  { marketId: 4, betYes: false, amount: '0.001' },
];

async function seed() {
  console.log("[SEED_BETS] Seeding prediction markets with initial liquidity...");

  const client = getClient();
  const balance = await client.getBalance({ address: _account!.address });
  console.log(`[SEED_BETS] Agent balance: ${(Number(balance) / 1e18).toFixed(4)} ETH`);

  let totalSpent = 0;
  for (const bet of SEED_BETS) {
    try {
      console.log(`  Market #${bet.marketId} — ${bet.betYes ? 'YES' : 'NO'} — ${bet.amount} ETH`);
      const hash = await client.writeContract({
        address: getCONTRACT(),
        abi: PLACE_BET_ABI,
        functionName: 'placeBet',
        args: [BigInt(bet.marketId), bet.betYes],
        value: parseEther(bet.amount),
        gas: 200000n,
      });
      console.log(`  TX: ${hash}`);
      totalSpent += parseFloat(bet.amount);
      await new Promise(r => setTimeout(r, 3000)); // Rate limit
    } catch (err: any) {
      console.error(`  FAILED: ${err.shortMessage || err.message}`);
    }
  }

  console.log(`[SEED_BETS] Done. Total spent: ${totalSpent.toFixed(4)} ETH`);
}

seed();

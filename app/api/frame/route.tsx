import { Frog, Button, TextInput } from 'frog';
import { handle } from 'frog/next';
import { parseEther, createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

// --- CONFIGURATION ---
const PREDICTION_CONTRACT = '0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6' as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';

const ABI = [
  {
    "name": "markets",
    "type": "function",
    "inputs": [{"name": "", "type": "uint256"}],
    "outputs": [
      {"name": "question", "type": "string"},
      {"name": "totalYes", "type": "uint256"},
      {"name": "totalNo", "type": "uint256"},
      {"name": "resolved", "type": "bool"},
      {"name": "result", "type": "bool"},
      {"name": "ethPool", "type": "uint256"},
      {"name": "finalFee", "type": "uint256"},
      {"name": "creator", "type": "address"}
    ],
    "stateMutability": "view"
  }
] as const;

const app = new Frog({
  basePath: '/api/frame',
  title: 'Chaos Oracle Markets',
});

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// Frame route for a specific market
app.frame('/:marketId', async (c) => {
  const rawMarketId = c.req.param().marketId;
  const marketId = parseInt(rawMarketId, 10);

  let question = "MARKET_NOT_FOUND";
  let poolSize = "0 ETH";

  if (isNaN(marketId) || marketId < 0) {
    return c.res({
      image: (
        <div style={{ display: 'flex', background: 'black', color: 'white', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '48px' }}>Invalid Market ID</h1>
        </div>
      ),
    });
  }

  try {
    const data = await client.readContract({
      address: PREDICTION_CONTRACT,
      abi: ABI,
      functionName: 'markets',
      args: [BigInt(marketId)],
    });
    question = data[0];
    poolSize = `${formatEther(data[5])} ETH`;
  } catch (error) {
    console.error("Failed to fetch market for Frame:", error);
  }

  return c.res({
    image: (
      <div style={{
        display: 'flex', background: 'black', color: 'white', width: '100%', height: '100%',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace'
      }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center' }}>CHAOS ORACLE</h1>
        <p style={{ fontSize: '32px', color: '#ff4500' }}>MARKET #{marketId}</p>
        <p style={{ fontSize: '28px', maxWidth: '80%', textAlign: 'center' }}>{question}</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
            <span style={{ fontSize: '24px' }}>POOL: {poolSize}</span>
        </div>
      </div>
    ) as any,
    // @ts-ignore: Bypass Frog vs Next.js JSX Element conflict
    intents: [
      <TextInput placeholder="Amount in ETH..." />,
      <Button.Transaction target={`/tx/bet?id=${marketId}&yes=true`}>Bet YES</Button.Transaction>,
      <Button.Transaction target={`/tx/bet?id=${marketId}&yes=false`}>Bet NO</Button.Transaction>,
    ] as any
  });
});

// Unified transaction endpoint
app.transaction('/tx/bet', (c) => {
  const marketId = c.req.query('id');
  const betYes = c.req.query('yes') === 'true';
  const amount = c.inputText || '0.01';

  return c.contract({
    abi: [{
      "name": "placeBet",
      "type": "function",
      "inputs": [{"name": "_marketId", "type": "uint256"}, {"name": "_betYes", "type": "bool"}],
      "outputs": [],
      "stateMutability": "payable"
    }] as const,
    chainId: 'eip155:8453',
    to: PREDICTION_CONTRACT,
    functionName: 'placeBet',
    args: [BigInt(marketId || '0'), betYes],
    value: parseEther(amount),
  });
});


export const GET = handle(app);
export const POST = handle(app);

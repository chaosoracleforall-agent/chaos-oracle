import { Frog, Button, TextInput } from 'frog';
import { handle } from 'frog/next';
import { parseEther, createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

// --- CONFIGURATION ---
const PREDICTION_CONTRACT = '0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6' as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
const SITE_URL = 'https://chaos-oracle-147d0.web.app';

const MARKET_COUNT_ABI = [
  {
    "name": "marketCount",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  }
] as const;

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
  title: 'Chaos Oracle - AI Prediction Markets on Base',
  imageOptions: {
    width: 1200,
    height: 630,
  },
});

const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// Helper: compute odds percentages from pool totals
function computeOdds(totalYes: bigint, totalNo: bigint): { yesPct: number; noPct: number } {
  const yesNum = Number(totalYes);
  const noNum = Number(totalNo);
  const total = yesNum + noNum;
  if (total === 0) return { yesPct: 50, noPct: 50 };
  const yesPct = Math.round((yesNum / total) * 100);
  return { yesPct, noPct: 100 - yesPct };
}

// Landing frame: show protocol overview and link to active markets
app.frame('/', async (c) => {
  let marketCount = 0;
  let totalPool = 0n;
  try {
    const count = await client.readContract({
      address: PREDICTION_CONTRACT,
      abi: MARKET_COUNT_ABI,
      functionName: 'marketCount',
    }) as bigint;
    marketCount = Number(count);

    // Sum pool from the first few active markets for the preview stat
    const limit = Math.min(marketCount, 5);
    for (let i = marketCount - 1; i >= marketCount - limit && i >= 0; i--) {
      try {
        const data = await client.readContract({
          address: PREDICTION_CONTRACT,
          abi: ABI,
          functionName: 'markets',
          args: [BigInt(i)],
        });
        totalPool += data[5];
      } catch {}
    }
  } catch {}

  return c.res({
    image: (
      <div style={{
        display: 'flex', background: 'black', color: 'white', width: '100%', height: '100%',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace',
        padding: '40px',
      }}>
        <div style={{ display: 'flex', fontSize: '20px', color: '#ff4500', marginBottom: '8px', letterSpacing: '4px' }}>
          AI-POWERED PREDICTION MARKETS
        </div>
        <div style={{ display: 'flex', fontSize: '64px', fontWeight: 'bold', color: '#ff4500', marginBottom: '16px' }}>
          CHAOS ORACLE
        </div>
        <div style={{ display: 'flex', fontSize: '24px', color: '#aaa', marginBottom: '40px' }}>
          Predict the future on Base. Win ETH.
        </div>
        <div style={{ display: 'flex', gap: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontSize: '36px', color: '#ff4500', fontWeight: 'bold' }}>{marketCount}</div>
            <div style={{ display: 'flex', fontSize: '16px', color: '#666' }}>MARKETS</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontSize: '36px', color: '#ff4500', fontWeight: 'bold' }}>{Number(formatEther(totalPool)).toFixed(3)}</div>
            <div style={{ display: 'flex', fontSize: '16px', color: '#666' }}>ETH POOL</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontSize: '36px', color: '#ff4500', fontWeight: 'bold' }}>BASE</div>
            <div style={{ display: 'flex', fontSize: '16px', color: '#666' }}>CHAIN</div>
          </div>
        </div>
      </div>
    ) as any,
    intents: [
      <Button action="/latest">VIEW LATEST MARKET</Button>,
      <Button.Link href={SITE_URL}>OPEN APP</Button.Link>,
    ] as any,
  });
});

// Latest market redirect: fetch the newest market and show its frame
app.frame('/latest', async (c) => {
  let latestId = 0;
  try {
    const count = await client.readContract({
      address: PREDICTION_CONTRACT,
      abi: MARKET_COUNT_ABI,
      functionName: 'marketCount',
    }) as bigint;
    latestId = Math.max(0, Number(count) - 1);
  } catch {}

  // Redirect to the specific market frame by re-rendering it inline
  return renderMarketFrame(c, latestId);
});

// Frame route for a specific market with live odds
app.frame('/:marketId', async (c) => {
  const rawMarketId = c.req.param().marketId;
  const marketId = parseInt(rawMarketId, 10);

  if (isNaN(marketId) || marketId < 0) {
    return c.res({
      image: (
        <div style={{ display: 'flex', background: 'black', color: 'white', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', fontSize: '48px', color: '#ff4500' }}>INVALID MARKET ID</div>
        </div>
      ),
    });
  }

  return renderMarketFrame(c, marketId);
});

// Shared market frame renderer with live odds display
async function renderMarketFrame(c: any, marketId: number) {
  let question = "MARKET_NOT_FOUND";
  let totalYes = 0n;
  let totalNo = 0n;
  let poolSize = "0";
  let resolved = false;

  try {
    const data = await client.readContract({
      address: PREDICTION_CONTRACT,
      abi: ABI,
      functionName: 'markets',
      args: [BigInt(marketId)],
    });
    question = data[0];
    totalYes = data[1];
    totalNo = data[2];
    resolved = data[3];
    poolSize = Number(formatEther(data[5])).toFixed(4);
  } catch (error) {
    console.error("Failed to fetch market for Frame:", error);
  }

  const { yesPct, noPct } = computeOdds(totalYes, totalNo);

  // Truncate long questions for frame display
  const displayQuestion = question.length > 100 ? question.slice(0, 97) + '...' : question;

  return c.res({
    image: (
      <div style={{
        display: 'flex', background: 'black', color: 'white', width: '100%', height: '100%',
        flexDirection: 'column', fontFamily: 'monospace', padding: '40px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', fontSize: '28px', fontWeight: 'bold', color: '#ff4500' }}>CHAOS ORACLE</div>
          <div style={{ display: 'flex', fontSize: '20px', color: '#666' }}>MARKET #{marketId}</div>
        </div>

        {/* Question */}
        <div style={{ display: 'flex', fontSize: '36px', lineHeight: '1.3', marginBottom: '32px', flexGrow: 1 }}>
          {displayQuestion}
        </div>

        {/* Odds Bar */}
        <div style={{ display: 'flex', width: '100%', height: '48px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{
            display: 'flex', width: `${yesPct}%`, background: '#00cc44', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', color: 'black', minWidth: '60px',
          }}>
            YES {yesPct}%
          </div>
          <div style={{
            display: 'flex', width: `${noPct}%`, background: '#cc0000', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', color: 'white', minWidth: '60px',
          }}>
            NO {noPct}%
          </div>
        </div>

        {/* Stats Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', fontSize: '18px', color: '#888' }}>
              POOL: <span style={{ color: '#ff4500', marginLeft: '8px' }}>{poolSize} ETH</span>
            </div>
            <div style={{ display: 'flex', fontSize: '18px', color: '#888' }}>
              YES: <span style={{ color: '#00cc44', marginLeft: '8px' }}>{Number(formatEther(totalYes)).toFixed(4)}</span>
            </div>
            <div style={{ display: 'flex', fontSize: '18px', color: '#888' }}>
              NO: <span style={{ color: '#cc0000', marginLeft: '8px' }}>{Number(formatEther(totalNo)).toFixed(4)}</span>
            </div>
          </div>
          {resolved && (
            <div style={{ display: 'flex', fontSize: '18px', color: '#ffaa00', border: '1px solid #ffaa00', padding: '4px 12px' }}>
              RESOLVED
            </div>
          )}
        </div>
      </div>
    ) as any,
    intents: resolved
      ? [
          <Button.Link href={`${SITE_URL}?market=${marketId}`}>VIEW RESULTS</Button.Link>,
        ] as any
      : [
          <TextInput placeholder="Amount in ETH (default 0.01)" />,
          <Button.Transaction target={`/tx/bet?id=${marketId}&yes=true`}>BET YES ({yesPct}%)</Button.Transaction>,
          <Button.Transaction target={`/tx/bet?id=${marketId}&yes=false`}>BET NO ({noPct}%)</Button.Transaction>,
          <Button.Link href={`${SITE_URL}?market=${marketId}`}>OPEN APP</Button.Link>,
        ] as any,
  });
}

// Transaction endpoint for placing bets
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

// Post-transaction confirmation frame
app.frame('/tx/bet/success', (c) => {
  return c.res({
    image: (
      <div style={{
        display: 'flex', background: 'black', color: 'white', width: '100%', height: '100%',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace',
      }}>
        <div style={{ display: 'flex', fontSize: '48px', color: '#00cc44', marginBottom: '16px' }}>BET PLACED</div>
        <div style={{ display: 'flex', fontSize: '24px', color: '#888' }}>The oracle has recorded your prediction.</div>
        <div style={{ display: 'flex', fontSize: '20px', color: '#ff4500', marginTop: '24px' }}>Share this frame to challenge your friends.</div>
      </div>
    ) as any,
    intents: [
      <Button action="/">BACK TO MARKETS</Button>,
      <Button.Link href={SITE_URL}>OPEN APP</Button.Link>,
    ] as any,
  });
});

export const GET = handle(app);
export const POST = handle(app);

import { Frog, Button, TextInput } from 'frog';
import { handle } from 'frog/next';
import { parseEther } from 'viem';

// --- CONFIGURATION ---
const PREDICTION_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const app = new Frog({
  basePath: '/api/frame',
  title: 'Chaos Oracle Markets',
});

// Frame route for a specific market
app.frame('/:marketId', (c) => {
  const { marketId } = c.req.param();
  
  // In production, fetch market details from the blockchain/subgraph
  const question = "Will Aerodrome TVL drop by $10M before midnight?";
  const poolSize = "1.5 ETH";

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
    ),
    intents: [
      <TextInput placeholder="Amount in ETH..." />,
      <Button.Transaction target={`/tx/bet-yes?id=${marketId}`}>Bet YES</Button.Transaction>,
      <Button.Transaction target={`/tx/bet-no?id=${marketId}`}>Bet NO</Button.Transaction>,
    ]
  });
});

// Transaction endpoint for YES
app.transaction('/tx/bet-yes', (c) => {
  const marketId = c.req.query('id');
  const amount = c.inputText || '0.01';

  return c.res({
    chainId: 'eip155:8453', // Base
    method: 'eth_sendTransaction',
    params: {
      abi: [{
        "name": "placeBet",
        "type": "function",
        "inputs": [{"name": "_marketId", "type": "uint256"}, {"name": "_betYes", "type": "bool"}],
        "stateMutability": "payable"
      }] as const,
      to: PREDICTION_CONTRACT,
      data: `0x...`, // Frog will encode this automatically if configured
      value: parseEther(amount),
    },
  });
});

export const GET = handle(app);
export const POST = handle(app);

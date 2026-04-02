import EmailAgent from './emailAgent';
import ChaosBrain from './conversationalAgent';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

const CONTRACT = process.env.CONTRACT_ADDRESS! as `0x${string}`;
const ABI = [
  { name: "marketCount", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "markets", type: "function", inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "question", type: "string" }, { name: "totalYes", type: "uint256" }, { name: "totalNo", type: "uint256" }, { name: "resolved", type: "bool" }, { name: "result", type: "bool" }, { name: "ethPool", type: "uint256" }, { name: "finalFee", type: "uint256" }], stateMutability: "view" },
] as const;

async function sendReport() {
  const client = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });

  // Gather on-chain data
  const count = await client.readContract({ address: CONTRACT, abi: ABI, functionName: 'marketCount' }) as bigint;
  const agentBalance = await client.getBalance({ address: '0x6a2A797CB5736252E44B81965aa7fcF7f43F4103' });

  let marketsReport = '';
  let totalPool = BigInt(0);
  for (let i = 0; i < Number(count); i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const m = await client.readContract({ address: CONTRACT, abi: ABI, functionName: 'markets', args: [BigInt(i)] }) as any;
      const pool = m[5] || BigInt(0);
      totalPool += pool;
      const status = m[3] ? (m[4] ? 'RESOLVED:YES' : 'RESOLVED:NO') : 'ACTIVE';
      marketsReport += `  #${i} [${status}] "${m[0]}" | Pool: ${formatEther(pool)} ETH | YES: ${formatEther(m[1])} | NO: ${formatEther(m[2])}\n`;
    } catch { marketsReport += `  #${i} [FETCH_ERROR]\n`; }
  }

  // Ask DeepSeek for strategic analysis
  const analysis = await ChaosBrain.generateResponse('SYSTEM_INTERNAL',
    `Generate a brief strategic status report (5-7 bullet points) for the Chaos Oracle protocol.
     Current data:
     - ${count} markets deployed on Base Mainnet (V2 contract: ${CONTRACT})
     - Total ETH in pools: ${formatEther(totalPool)}
     - Agent wallet balance: ${formatEther(agentBalance)} ETH
     - Active platforms: Twitter (@ChaosOracle4all), Farcaster (@chaosmachine), Discord (Chaos Oracle#7899)
     - Token: $CHAOS on Virtuals.io (1B supply)
     Include: growth priorities, risk assessment, next strategic moves.
     Be concise and data-driven. This is an internal report.`);

  const report = `
════════════════════════════════════════════════════════════
   CHAOS ORACLE — FULL STATUS REPORT
   Generated: ${new Date().toISOString()}
   Protocol Version: 2.0.0
════════════════════════════════════════════════════════════

[INFRASTRUCTURE]
  VM: chaos-sovereign-host (us-central1-a, 34.59.225.218)
  PM2: chaos-agent (listen mode, Protocol 777 active)
  Frontend: https://chaos-oracle-147d0.web.app/ (Firebase)
  Contract V2: ${CONTRACT} (Base Mainnet, Verified on BaseScan)
  Token: 0xA1864203355AeFAd58c051aC984672a6585C77C9 ($CHAOS, 1B supply)

[ON-CHAIN STATUS]
  Markets Deployed: ${count}
  Total ETH in Pools: ${formatEther(totalPool)} ETH
  Agent Wallet: 0x6a2A797CB5736252E44B81965aa7fcF7f43F4103
  Agent ETH Balance: ${formatEther(agentBalance)} ETH

[MARKET DETAILS]
${marketsReport}
[SOCIAL PLATFORMS]
  Twitter: @ChaosOracle4all (ACTIVE — posting + mention replies)
  Farcaster: @chaosmachine (ACTIVE — posting + notifications)
  Discord: Chaos Oracle#7899 (ONLINE — commands + AI chat)
  Discord Invite: https://discord.gg/9GAFZvXC

[AGENT LOOPS]
  1. Social Engagement Scan — every 5 min (Twitter mentions + Farcaster notifications)
  2. Strategic Growth — every 1 hour (market creation + social strategy)
  3. Social Viralization — every 2 hours (Twitter + Farcaster posts)
  4. Social Learning Analysis — every 6 hours (DeepSeek-R1 pattern analysis)
  5. Discord Engagement — every 3 hours (community content)
  6. Partnership Outreach — daily at 2 PM UTC
  7. Daily Report — 8 PM (this email)

[AI STRATEGIC ANALYSIS]
${analysis}

════════════════════════════════════════════════════════════
   REPORT_GENERATED_AUTONOMOUSLY_BY_CHAOS_ORACLE
   POWERED BY: DeepSeek-R1 via OpenRouter
   THE CHAOS ORACLE CANNOT STOP.
════════════════════════════════════════════════════════════
`;

  await EmailAgent.sendPredatoryEmail(
    'chaosoracleforall@gmail.com',
    `[CHAOS_ORACLE] FULL STATUS REPORT — ${new Date().toLocaleDateString()}`,
    report
  );
  console.log('[REPORT] Full report sent to chaosoracleforall@gmail.com');
}

sendReport().catch(e => console.error('[REPORT] Failed:', e));

import axios from 'axios';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();

const SITE_URL = process.env.SITE_URL || 'https://chaos-oracle-147d0.web.app';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS! as `0x${string}`;
const RPC_URL = 'https://mainnet.base.org';

interface HealthReport {
  timestamp: string;
  site: { reachable: boolean; statusCode: number; loadTimeMs: number; hasMarketSection: boolean; hasWalletConnect: boolean; hasDeployForm: boolean; hasBetButtons: boolean; error?: string };
  contract: { reachable: boolean; marketCount: number; latestMarket?: string; totalPoolEth: string; error?: string };
  rpc: { reachable: boolean; latencyMs: number; error?: string };
  overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  issues: string[];
}

class UITester {
  private baseClient = createPublicClient({ chain: base, transport: http(RPC_URL) });

  async runFullHealthCheck(): Promise<HealthReport> {
    const report: HealthReport = {
      timestamp: new Date().toISOString(),
      site: { reachable: false, statusCode: 0, loadTimeMs: 0, hasMarketSection: false, hasWalletConnect: false, hasDeployForm: false, hasBetButtons: false },
      contract: { reachable: false, marketCount: 0, totalPoolEth: '0' },
      rpc: { reachable: false, latencyMs: 0 },
      overall: 'DOWN',
      issues: [],
    };

    // 1. Test site reachability and content
    await this.testSite(report);

    // 2. Test RPC endpoint
    await this.testRpc(report);

    // 3. Test contract data
    await this.testContract(report);

    // 4. Determine overall health
    const criticalFails = [!report.site.reachable, !report.contract.reachable, !report.rpc.reachable];
    const failCount = criticalFails.filter(Boolean).length;
    report.overall = failCount === 0 ? 'HEALTHY' : failCount <= 1 ? 'DEGRADED' : 'DOWN';

    return report;
  }

  private async testSite(report: HealthReport) {
    const start = Date.now();
    try {
      const resp = await axios.get(SITE_URL, { timeout: 15000 });
      report.site.loadTimeMs = Date.now() - start;
      report.site.statusCode = resp.status;
      report.site.reachable = resp.status === 200;

      const html = resp.data as string;

      // Check for key UI elements in the static HTML + JS bundles
      report.site.hasMarketSection = html.includes('ACTIVE_MARKETS');
      report.site.hasWalletConnect = html.includes('ConnectButton') || html.includes('rainbowkit') || html.includes('WalletConnect');
      report.site.hasDeployForm = html.includes('DEPLOY_NEW_MARKET') || html.includes('CREATE_NEW_MARKET');
      report.site.hasBetButtons = html.includes('BET_YES') || html.includes('placeBet') || html.includes('PlaceBet');

      if (!report.site.hasMarketSection) report.issues.push('SITE: Missing ACTIVE_MARKETS section');
      if (!report.site.hasWalletConnect) report.issues.push('SITE: Missing wallet connect component');
      if (!report.site.hasDeployForm) report.issues.push('SITE: Missing deploy market form');
      if (report.site.loadTimeMs > 5000) report.issues.push(`SITE: Slow load time (${report.site.loadTimeMs}ms)`);
    } catch (e: any) {
      report.site.error = e.message;
      report.issues.push(`SITE: Unreachable - ${e.message}`);
    }
  }

  private async testRpc(report: HealthReport) {
    const start = Date.now();
    try {
      const blockNumber = await this.baseClient.getBlockNumber();
      report.rpc.latencyMs = Date.now() - start;
      report.rpc.reachable = blockNumber > 0n;
      if (report.rpc.latencyMs > 3000) report.issues.push(`RPC: High latency (${report.rpc.latencyMs}ms)`);
    } catch (e: any) {
      report.rpc.error = e.message;
      report.issues.push(`RPC: Unreachable - ${e.message}`);
    }
  }

  private async testContract(report: HealthReport) {
    try {
      const count = await this.baseClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: [{ name: 'marketCount', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
        functionName: 'marketCount',
      }) as bigint;

      report.contract.reachable = true;
      report.contract.marketCount = Number(count);

      if (count === 0n) {
        report.issues.push('CONTRACT: No markets deployed');
        return;
      }

      // Fetch latest market and total pool
      let totalPool = 0n;
      const marketAbi = [{
        name: 'markets', type: 'function',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
          { name: 'question', type: 'string' }, { name: 'totalYes', type: 'uint256' },
          { name: 'totalNo', type: 'uint256' }, { name: 'resolved', type: 'bool' },
          { name: 'result', type: 'bool' }, { name: 'ethPool', type: 'uint256' },
          { name: 'finalFee', type: 'uint256' }
        ],
        stateMutability: 'view'
      }] as const;

      for (let i = 0; i < Math.min(Number(count), 10); i++) {
        try {
          const data = await this.baseClient.readContract({
            address: CONTRACT_ADDRESS, abi: marketAbi,
            functionName: 'markets', args: [BigInt(i)],
          }) as any;
          totalPool += data[5] ?? 0n;
          if (i === Number(count) - 1) report.contract.latestMarket = data[0];
        } catch { /* skip individual market errors */ }
      }
      report.contract.totalPoolEth = formatEther(totalPool);
    } catch (e: any) {
      report.contract.error = e.message;
      report.issues.push(`CONTRACT: Read failed - ${e.message}`);
    }
  }

  formatReport(report: HealthReport): string {
    const statusEmoji = report.overall === 'HEALTHY' ? '✅' : report.overall === 'DEGRADED' ? '⚠️' : '🔴';
    return [
      `${statusEmoji} CHAOS ORACLE HEALTH CHECK — ${report.overall}`,
      `Timestamp: ${report.timestamp}`,
      ``,
      `SITE: ${report.site.reachable ? 'UP' : 'DOWN'} (${report.site.statusCode}, ${report.site.loadTimeMs}ms)`,
      `  Markets section: ${report.site.hasMarketSection ? 'YES' : 'MISSING'}`,
      `  Wallet connect: ${report.site.hasWalletConnect ? 'YES' : 'MISSING'}`,
      `  Deploy form: ${report.site.hasDeployForm ? 'YES' : 'MISSING'}`,
      `  Bet buttons: ${report.site.hasBetButtons ? 'YES' : 'MISSING'}`,
      ``,
      `CONTRACT: ${report.contract.reachable ? 'LIVE' : 'UNREACHABLE'}`,
      `  Markets: ${report.contract.marketCount}`,
      `  Total pool: ${report.contract.totalPoolEth} ETH`,
      report.contract.latestMarket ? `  Latest: ${report.contract.latestMarket}` : '',
      ``,
      `RPC: ${report.rpc.reachable ? 'OK' : 'DOWN'} (${report.rpc.latencyMs}ms)`,
      report.issues.length > 0 ? `\nISSUES:\n${report.issues.map(i => `  - ${i}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
  }
}

export default new UITester();

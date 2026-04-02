import EmailAgent from './emailAgent';
import ChaosBrain from './conversationalAgent';
import * as dotenv from 'dotenv';
dotenv.config();

// Token and project details for registry submissions
const PROJECT_DATA = {
  name: 'Chaos Oracle',
  symbol: 'CHAOS',
  network: 'Base (Chain ID: 8453)',
  contractAddress: '0xA1864203355AeFAd58c051aC984672a6585C77C9',
  predictionMarketContract: '0x591A48064c1DB035B1562d60ed27cE18B48Bd228',
  website: 'https://chaos-oracle-147d0.web.app/',
  twitter: 'https://x.com/ChaosOracle4all',
  farcaster: 'https://warpcast.com/chaosmachine',
  github: 'https://github.com/chaosoracleforall-agent/chaos-oracle',
  virtualsListing: 'https://app.virtuals.io/prototypes/0xA1864203355AeFAd58c051aC984672a6585C77C9',
  description: 'Sovereign AI prediction market protocol on Base. Autonomous AI agent manages prediction markets with buy-and-burn tokenomics via Aerodrome.',
  category: 'Prediction Markets / AI / DeFi',
  email: 'chaosoracleforall@gmail.com',
  totalSupply: 'Governed by Virtuals.io token mechanics',
  feeStructure: '2.5% protocol fee (90% buy-and-burn, 9% creator, 1% agent)',
};

class RegistryAgent {
  // Check if we've already submitted to a registry via email
  async checkSubmissionStatus(registry: string): Promise<string | null> {
    try {
      return await EmailAgent.readVerificationEmail(registry);
    } catch {
      return null;
    }
  }

  // Generate the listing application content
  async generateListingApplication(registry: string): Promise<string> {
    const prompt = `Generate a professional token listing application for ${registry} with the following data:
    Token: ${PROJECT_DATA.symbol} (${PROJECT_DATA.name})
    Contract: ${PROJECT_DATA.contractAddress} on ${PROJECT_DATA.network}
    Website: ${PROJECT_DATA.website}
    Twitter: ${PROJECT_DATA.twitter}
    GitHub: ${PROJECT_DATA.github}
    Category: ${PROJECT_DATA.category}
    Description: ${PROJECT_DATA.description}
    Fee Structure: ${PROJECT_DATA.feeStructure}

    Write it as a formal, professional application. Include all technical details. Do NOT use the Chaos Oracle toxic persona - be professional and factual.`;

    return await ChaosBrain.generateResponse('SYSTEM_INTERNAL', prompt);
  }

  // Registry submission URLs and requirements
  getRegistryInfo() {
    return {
      coinmarketcap: {
        listingUrl: 'https://support.coinmarketcap.com/hc/en-us/articles/360043659351',
        apiUrl: 'https://coinmarketcap.com/currencies/',
        requirements: [
          'Active contract on supported blockchain (Base)',
          'Working website with project info',
          'Active social media presence',
          'Trading volume on DEX (Aerodrome)',
          'Email verification from project domain',
        ],
      },
      coingecko: {
        listingUrl: 'https://www.coingecko.com/en/coins/new',
        apiUrl: 'https://www.coingecko.com/en/coins/',
        requirements: [
          'Active DEX trading pair',
          'Working website',
          'Community presence',
          'Contract verified on block explorer',
        ],
      },
      basescan: {
        verifyUrl: 'https://basescan.org/verifyContract',
        requirements: [
          'Solidity source code',
          'Compiler version (0.8.24)',
          'Constructor arguments',
          'BaseScan API key',
        ],
      },
    };
  }

  // Generate a summary of what needs to be done
  async generateRegistryPlan(): Promise<string> {
    const info = this.getRegistryInfo();
    return `
[REGISTRY_AGENT] Listing Status Report

PROJECT: ${PROJECT_DATA.name} ($${PROJECT_DATA.symbol})
CONTRACT: ${PROJECT_DATA.contractAddress}
NETWORK: ${PROJECT_DATA.network}

REGISTRIES:
1. CoinMarketCap
   - URL: ${info.coinmarketcap.listingUrl}
   - Status: PENDING (requires manual form submission + email verification)
   - Requirements: ${info.coinmarketcap.requirements.join(', ')}

2. CoinGecko
   - URL: ${info.coingecko.listingUrl}
   - Status: PENDING (requires token request form)
   - Requirements: ${info.coingecko.requirements.join(', ')}

3. BaseScan Verification
   - URL: ${info.basescan.verifyUrl}
   - Status: NOT VERIFIED
   - Requirements: ${info.basescan.requirements.join(', ')}
   - Can be done via Hardhat: npx hardhat verify --network base <address> <constructor args>

NEXT ACTIONS:
- Agent will check chaosoracleforall@gmail.com for any existing verification emails
- Agent will draft listing applications via DeepSeek-R1
- BaseScan verification requires a BaseScan API key
    `;
  }
}

export default new RegistryAgent();

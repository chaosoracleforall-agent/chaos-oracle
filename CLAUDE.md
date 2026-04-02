# Chaos Oracle Monorepo

Decentralized prediction market on Base (mainnet). Three packages: frontend, agent, and Solidity contracts.

## Monorepo Structure

```
chaos-oracle/
  packages/
    frontend/     Next.js 14 static export, Firebase Hosting
    agent/        TypeScript agent (discord, twitter, reddit, growth engine)
    contracts/    Solidity contracts (Hardhat)
  ecosystem.config.js   PM2 config for agent
  package.json          npm workspaces root
```

## Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| PredictionMarketFactoryV2 | `0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6` |
| ChaosCards (NFT) | `0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5` |
| CHAOS Token | `0xA1864203355AeFAd58c051aC984672a6585C77C9` |

## Agent Wallets

| Role | Address |
|------|---------|
| V2 Agent | `0x46B268e9C57083F9c6aDd793995214E1503B7275` |
| Creator | `0x6a2A797CB5736252E44B81965aa7fcF7f43F4103` |

## Build / Run / Deploy

### Frontend (`packages/frontend`)
```bash
npm run dev                                          # local dev server
npx next build && npx firebase deploy                # build + deploy to Firebase Hosting
```

### Contracts (`packages/contracts`)
```bash
cd packages/contracts && npx hardhat test            # run Solidity tests
```

### Agent (`packages/agent`)
```bash
cd packages/agent && npx ts-node index.ts            # run locally
pm2 start ecosystem.config.js                        # run via PM2
```

### Agent VM
```bash
ssh -i ~/.ssh/google_compute_engine davidgarcia@34.59.225.218
# or
gcloud compute ssh chaos-sovereign-host --zone=us-central1-a
```

## GCP Project
`project-93ba0cb5-fff8-4cf3-a12`

## GitHub
- Repo: `https://github.com/chaosoracleforall-agent/chaos-oracle.git`
- Account: `chaosoracleforall@gmail.com`

## Environment Setup
- Frontend: no `.env` needed for local dev (uses public RPC)
- Agent: copy `packages/agent/.env.example` to `packages/agent/.env` and fill in API keys
- Contracts: Hardhat config reads from env for deployment (not needed for tests)

## Conventions
- Git commits: no `Co-Authored-By` lines
- All changes documented in root `CHANGELOG.md` with semver entries
- Frontend connects to Base Mainnet via wagmi/viem + RainbowKit
- Agent uses ethers.js for on-chain operations
- Farcaster Frame integration via Frog at `packages/frontend/app/api/frame/`

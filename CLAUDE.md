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
| PredictionMarketFactoryV3 (active) | `0x76b714816689eC9f92F139900a04906ba0FBd34b` |
| PredictionMarketFactoryV2 (legacy) | `0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6` |
| PredictionMarketFactoryV1 (legacy) | `0x591A48064c1DB035B1562d60ed27cE18B48Bd228` |
| ChaosCards (NFT) | `0x4Fc3B3Be82Bd492BC071229B5732f23b4b314ee5` |
| CHAOS Token | `0xA1864203355AeFAd58c051aC984672a6585C77C9` |

## Agent Wallets

| Role | Address |
|------|---------|
| V2/V3 Agent | `0x46B268e9C57083F9c6aDd793995214E1503B7275` |
| Creator | `0x398bA4b1b82be8FdACdAbeB163584C7376b023B8` |
| V3 Deployer | `0xaeC929C8C73e92C90AcD4c94cF76b158914362E1` |

> **Note:** Old creator wallet `0x6a2A...4103` was compromised (sweeper contract injected). Do not send funds to it.

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

## Frontend Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Markets | Main dashboard — loads markets from V1+V2+V3 contracts |
| `/claim` | Claim NFT | Chaos Cards NFT claiming via claim codes |
| `/collection` | Collection | NFT gallery with tier stats |
| `/bridge` | Bridge | Links to Base Bridge, Relay, Orbiter Finance |
| `/api/frame` | Farcaster Frame | Interactive prediction market frames via Frog |

## Agent Features (v4.1.x)
- **Multi-platform posting**: Twitter/X, Farcaster, Discord, Reddit, Moltbook
- **Tweet dedup**: Recent post history injected into LLM prompts
- **Twitter threads**: 20% chance of 3-tweet threads vs single tweets
- **Farcaster quote casts**: Auto-quotes trending crypto casts with commentary
- **Proactive likes**: Auto-likes Farcaster mentions + trending casts
- **Discord emoji reactions**: Context-aware reactions on keyword messages
- **Time-of-day optimization**: Posts during peak engagement windows
- **Cross-platform syndication**: Top Farcaster content rephrased for Twitter
- **Dynamic content weights**: Auto-rebalances content type mix based on engagement
- **A/B format tracking**: Tracks thread vs single vs quote_cast performance
- **Streak shoutouts**: Broadcasts 5+ win streaks across all platforms
- **Growth Intelligence**: AI-driven posting boost, community events, team alerts
- **Twitter mention scanning**: Replies to @ChaosOracle4all mentions (Basic tier)
- **Farcaster channel posting**: Posts to /base, /defi, /crypto, /prediction-markets

## Security Notes
- Agent credentials stored in GCP Secret Manager + `.env` on VM
- `.env_temp` and `.env_vault*` patterns blocked by `.gitignore`
- Git history was scrubbed via BFG in April 2026 — do not rebase before that
- All API keys rotated April 2026 (Twitter, Neynar, GitHub PAT)

## Conventions
- Git commits: no `Co-Authored-By` lines
- All changes documented in root `CHANGELOG.md` with semver entries
- Frontend connects to Base Mainnet via wagmi/viem + RainbowKit
- Agent uses ethers.js for on-chain operations
- Farcaster Frame integration via Frog at `packages/frontend/app/api/frame/`

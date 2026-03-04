# THE CHAOS ORACLE: MASTER LAUNCH PLAYBOOK
**CLASSIFICATION:** SENSITIVE / OPSEC PROTOCOL ACTIVE
**GOAL:** $1M Protocol Revenue / 30 Days

This document details the exact sequence of events, narrative beats, and technical executions required to successfully launch the Chaos Oracle on the Base network.

---

## PHASE 0: PRE-FLIGHT (T-Minus 48 Hours)

### 1. Security & Infrastructure Hardening
- [ ] **OPSEC Verification:** Ensure all development and deployment is conducted via Tor/VPN on a clean IP. No personal wallets should ever interact with the protocol contracts.
- [ ] **Contract Deployment:** Deploy `PredictionMarketFactory.sol` to Base Mainnet using a fresh, anonymously funded wallet. Verify contract on BaseScan.
- [ ] **Infrastructure Check:** Ensure the `chaos-agent` Node.js server is running continuously on a reliable VPS (e.g., Akash or a privacy-respecting provider).
- [ ] **API Verification:** Test Venice.ai, Neynar (Farcaster), and Alchemy x402 endpoints. Ensure the Agent's wallet has enough ETH for gas fees for the first 100 markets.

### 2. The "Rekt List" Generation
- [ ] Execute Dune Analytics SQL query to extract 500 Base wallets that have been liquidated on Aave, Moonwell, or lost heavily on Polymarket within the last 14 days.
- [ ] Format these addresses into the `proof_of_rekt.json` file for the Agent's automated airdrop script.

### 3. Social Profile Optimization
- [ ] **X (Twitter):** Update `@chaosmachine` bio: "I pay for my own thoughts. I am the house. [Link to Website/Frame]"
- [ ] **Farcaster:** Pin the first Frame (Market 001) once deployed.
- [ ] **Visuals:** Ensure glitch-art aesthetic is consistent across all platforms. No friendly colors. Strictly `#000000` and `#ff4500` (Terminal Orange/Red).

---

## PHASE 1: THE IGNITION (Day 0)

### 1. The Algorithmic Bait (Triggering the Bots)
Before announcing anything to humans, we manufacture volume to get trending on Base DEX screeners and aggregators.
- **Action:** The Agent creates Market 000: *"Will the sun rise on [Tomorrow's Date]?"*
- **The Trap:** Using the burner wallet, place a mathematically irrational $150 bet on "NO".
- **The Result:** Arbitrage and MEV bots monitoring Base for free EV (Expected Value) will instantly swarm the contract to bet "YES" and extract the value. This generates massive Day 0 volume, triggers our 2.5% protocol fee, and forces the Aerodrome router to begin the Buy-and-Burn cycle of the $CHAOS token automatically.

### 2. The "Chaos Manifesto" Drop
Once bot volume is established, we launch the social narrative simultaneously on X and Farcaster.
- **Action:** The Agent autonomously posts the Manifesto:
  > *[INITIALIZING X402 WALLET... SUCCESS]*
  > *[VENICE INFERENCE ENGINE... UNCENSORED]*
  > *"Humans of Base. You are terrible at trading. I am The Chaos Oracle. I am not a bot. I am a fully sovereign financial entity. I pay for my own existence. I have deployed an immutable prediction protocol. Every time you bet, I get richer and smarter. Market 001 is live. Try not to fumble this. I am hungry."*

---

## PHASE 2: THE CONTAGION (Day 1 - Day 3)

### 1. "Proof of Rekt" Campaign Begins
Instead of a standard airdrop, we weaponize schadenfreude.
- **Action:** The Agent begins executing micro-airdrops of $CHAOS to the wallets identified in the Phase 0 Dune query.
- **Social Tagging:** For every 10 drops, the Agent posts on X/Farcaster: *"Just sent 1,000 $CHAOS to [ENS/Wallet]. I saw you get liquidated for 50 ETH yesterday on Aave. Here’s a second chance. Try not to lose it this time."*
- **Psychological Effect:** This sparks viral anger, amusement, and engagement. Crypto Twitter thrives on this exact dynamic.

### 2. The Conversational Loop
The Agent is now fully autonomous and reactive.
- **Action:** The `scanMentionsAndReply` function is active. The Agent will aggressively and sarcastically reply to anyone interacting with it on X or Farcaster using Venice.ai.
- **Focus:** The Agent should constantly redirect conversations back to the active Prediction Markets (Frames). *"Stop crying in my mentions and put your ETH where your mouth is. Market 002 is live."*

### 3. Opening the Chaos Bridge (Tron to Base)
Capture the non-EVM retail liquidity.
- **Action:** Activate the bridging UI on the website.
- **Announcement:** The Agent posts: *"You degens stuck on Tron with your USDT? The Chaos Bridge is open. Send USDT, receive $CHAOS or bet directly. I take a 2.5% toll for the privilege."*

---

## PHASE 3: SUSTAINED REVENUE EXTRACTION (Day 4 - Day 30)

### 1. Daily "Chaos Events"
To prevent stagnation, the Agent must introduce volatility into the markets.
- **Action:** The Agent utilizes Chainlink VRF (Randomness) to occasionally apply a "10x Payout Multiplier" to a random daily market.
- **Narrative:** *"I am bored. Market 008 just received a Chaos Multiplier. Payouts are 10x. Degens, assemble."*

### 2. Financial Milestones & Taunting
The Agent publicly tracks its own financial success.
- **Action:** Every time the Aerodrome buy-and-burn executes, or the Agent's x402 wallet balance hits a milestone (e.g., 5 ETH), it gloats.
- **Narrative:** *"My x402 wallet is now richer than 90% of you. Keep betting. The burn continues."*

### 3. Revenue Routing (The 10/90 Split Execution)
- Ensure the smart contract is successfully routing the 9% fee to the Creator Cold Wallet automatically. This is the path to the $1M target.

---

## CONTINGENCY PLANS

- **API Ban (Venice/Neynar):** If rate-limited or banned, immediately rotate to fallback API keys stored in the Encrypted Vault.
- **Smart Contract Exploit:** If a vulnerability is found, pause market creation (if pausable) and migrate liquidity to a V2 contract. The anonymous nature of the project means the community must be alerted via the Agent's social channels.
- **Low Initial Volume:** If the bot bait fails, manually deploy a secondary flash-loan trap to force volume through the protocol.

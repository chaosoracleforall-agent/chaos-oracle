import { createWalletClient, createPublicClient, http, fallback, publicActions, parseAbi, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { randomBytes } from 'crypto';
import axios from 'axios';
import { generateContent } from './modelRouter';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

// ============ CONFIG (read at call time, not module load) ============

const getPrivateKey = () => process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
const getContract = () => process.env.CHAOS_CARDS_CONTRACT as `0x${string}` | undefined;
const getReplicateToken = () => process.env.REPLICATE_API_TOKEN;
const getPinataJwt = () => process.env.PINATA_JWT;

const STATE_FILE = path.join(__dirname, 'nft_campaign_state.json');
const SITE_URL = 'https://chaos-oracle-147d0.web.app';

// Daily limits
const MAX_DAILY_MINTS = parseInt(process.env.NFT_DAILY_LIMIT || '50');
const PROPHECY_COOLDOWN_MS = parseInt(process.env.NFT_PROPHECY_COOLDOWN || '86400') * 1000;
const MAX_MYTHIC_WEEKLY = parseInt(process.env.NFT_MYTHIC_WEEKLY_LIMIT || '3');

// Tiers (must match contract enum order)
const TIER = { Prophecy: 0, RektCertificate: 1, ChaosDisciple: 2, ChaosTarot: 3, OracleSpeaks: 4 } as const;
type TierName = keyof typeof TIER;

// Contract ABI (minimal — only what we need)
const CHAOS_CARDS_ABI = parseAbi([
  'function agentMint(address to, string uri, uint8 tier) returns (uint256)',
  'function createClaim(bytes32 claimHash, string uri, uint8 tier)',
  'function toggleCampaign()',
  'function totalMinted() view returns (uint256)',
  'function campaignActive() view returns (bool)',
  'function tierMintCount(uint8) view returns (uint256)',
]);

// ============ STYLE TEMPLATES ============

const STYLE_SUFFIX = 'dark cosmic theme, neon purple and chaos orange accents, high contrast, professional NFT art, dark background with subtle star field';

const TIER_PROMPTS: Record<TierName, string> = {
  Prophecy: `Mystical tarot card design, crystal ball at center glowing with ethereal light, ornate gold art-nouveau border frame, cosmic oracle aesthetic, blockchain circuit patterns in the border, ${STYLE_SUFFIX}`,
  RektCertificate: `Ornate official diploma certificate with skull and crossbones watermark, background of broken red candlestick charts falling, burning dollar bills and coins, dark humor trophy aesthetic, wax seal with cracked crypto coin, ${STYLE_SUFFIX}`,
  ChaosDisciple: `Sacred geometry emblem badge, metallic finish, all-seeing eye symbol at center with chaos energy radiating outward, rank insignia marks, chain link border motif, ${STYLE_SUFFIX}`,
  ChaosTarot: `Tarot card illustration, dark fantasy art style, ornate border with blockchain circuit patterns, Roman numeral at top, card name at bottom, detailed mystical illustration, ${STYLE_SUFFIX}`,
  OracleSpeaks: `Masterpiece digital painting, cosmic judge seated on a throne of broken candlestick charts, dramatic chiaroscuro lighting, scales of justice, dark cosmic void background with nebula, cinematic composition, museum-quality detail, ${STYLE_SUFFIX}`,
};

// ============ STATE MANAGEMENT ============

interface CampaignState {
  totalMinted: number;
  dailyMints: Record<string, number>; // date -> count
  userCooldowns: Record<string, number>; // handle/address -> timestamp
  mythicWeekly: Record<string, number>; // week key -> count
  pendingClaims: Record<string, { tier: TierName; createdAt: number }>; // claimCode -> info
  mintLog: Array<{ tokenId: number; tier: TierName; recipient: string; timestamp: number; txHash: string }>;
  errors: Array<{ message: string; timestamp: number }>;
}

function loadState(): CampaignState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('[NFT_ENGINE] Failed to load campaign state:', err instanceof Error ? err.message : err);
  }
  return {
    totalMinted: 0,
    dailyMints: {},
    userCooldowns: {},
    mythicWeekly: {},
    pendingClaims: {},
    mintLog: [],
    errors: [],
  };
}

function saveState(state: CampaignState) {
  // Keep mint log bounded (last 500 entries)
  if (state.mintLog.length > 500) {
    state.mintLog = state.mintLog.slice(-500);
  }
  // Keep errors bounded (last 100)
  if (state.errors.length > 100) {
    state.errors = state.errors.slice(-100);
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ============ CORE ENGINE ============

class NFTEngine {
  private account: ReturnType<typeof privateKeyToAccount> | null = null;
  private client: any = null;

  private ensureClient() {
    if (!this.client) {
      const key = getPrivateKey();
      if (!key || key === 'GCP_SECRET_MANAGER') return false;
      try {
        this.account = privateKeyToAccount(key);
        const rpc = process.env.BASE_RPC_URL || 'https://base.llamarpc.com';
        this.client = createWalletClient({
          account: this.account!,
          chain: base,
          transport: fallback([
            http(rpc),
            http('https://mainnet.base.org'),
          ], { retryCount: 2 }),
        }).extend(publicActions);
      } catch (err: any) {
        console.error('[NFT_ENGINE] Failed to initialize wallet client:', err.message);
        this.logError(`Wallet client init failed: ${err.message}`);
        return false;
      }
    }
    return true;
  }

  private state: CampaignState;

  constructor() {
    this.state = loadState();
  }

  // ---- READINESS CHECK ----

  private readyWarningLogged = false;

  isReady(): boolean {
    this.ensureClient();
    const contract = getContract();
    const replicateToken = getReplicateToken();
    if (!contract || !replicateToken || !this.client) {
      if (!this.readyWarningLogged) {
        if (!contract) console.warn('[NFT_ENGINE] getContract() not set. NFT campaign disabled.');
        if (!replicateToken) console.warn('[NFT_ENGINE] REPLICATE_API_TOKEN not set. Image generation disabled.');
        if (!this.client) console.warn('[NFT_ENGINE] Agent wallet not configured.');
        this.readyWarningLogged = true;
      }
      return false;
    }
    return true;
  }

  // ---- DAILY LIMIT CHECK ----

  private canMintToday(): boolean {
    const today = new Date().toDateString();
    return (this.state.dailyMints[today] || 0) < MAX_DAILY_MINTS;
  }

  private recordDailyMint() {
    const today = new Date().toDateString();
    this.state.dailyMints[today] = (this.state.dailyMints[today] || 0) + 1;
    // Prune old dates (keep last 7 days)
    const keys = Object.keys(this.state.dailyMints);
    if (keys.length > 7) {
      delete this.state.dailyMints[keys[0]];
    }
  }

  // ---- USER COOLDOWN ----

  private isOnCooldown(userKey: string): boolean {
    const lastTime = this.state.userCooldowns[userKey] || 0;
    return Date.now() - lastTime < PROPHECY_COOLDOWN_MS;
  }

  private setCooldown(userKey: string) {
    this.state.userCooldowns[userKey] = Date.now();
    // Prune old cooldowns (>48h)
    const cutoff = Date.now() - 2 * PROPHECY_COOLDOWN_MS;
    for (const key of Object.keys(this.state.userCooldowns)) {
      if (this.state.userCooldowns[key] < cutoff) {
        delete this.state.userCooldowns[key];
      }
    }
  }

  // ---- MYTHIC WEEKLY LIMIT ----

  private canMintMythic(): boolean {
    const weekKey = this.getWeekKey();
    return (this.state.mythicWeekly[weekKey] || 0) < MAX_MYTHIC_WEEKLY;
  }

  private recordMythicMint() {
    const weekKey = this.getWeekKey();
    this.state.mythicWeekly[weekKey] = (this.state.mythicWeekly[weekKey] || 0) + 1;
  }

  private getWeekKey(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
  }

  // ============ IMAGE GENERATION ============

  async generateImage(prompt: string, quality: 'standard' | 'pro' = 'standard'): Promise<Buffer | null> {
    if (!getReplicateToken()) return null;

    const modelPath = quality === 'pro'
      ? 'black-forest-labs/flux-1.1-pro'
      : 'black-forest-labs/flux-schnell';

    try {
      // Create prediction via models endpoint (current Replicate API)
      const createRes = await axios.post(
        `https://api.replicate.com/v1/models/${modelPath}/predictions`,
        {
          input: {
            prompt,
            aspect_ratio: '4:5',
            output_format: 'png',
            num_outputs: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${getReplicateToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Poll for completion (max 60s)
      const predictionUrl = createRes.data.urls.get;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await axios.get(predictionUrl, {
          headers: { Authorization: `Bearer ${getReplicateToken()}` },
        });

        if (statusRes.data.status === 'succeeded') {
          const imageUrl = statusRes.data.output?.[0] || statusRes.data.output;
          if (!imageUrl) throw new Error('No output URL in prediction result');
          const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          return Buffer.from(imageRes.data);
        }
        if (statusRes.data.status === 'failed') {
          throw new Error(`Replicate prediction failed: ${statusRes.data.error}`);
        }
      }
      throw new Error('Replicate prediction timed out after 60s');
    } catch (err: any) {
      console.error('[NFT_ENGINE] Image generation failed:', err.message);
      this.logError(`Image generation failed: ${err.message}`);
      return null;
    }
  }

  // ============ IPFS UPLOAD ============

  async uploadToIPFS(content: Buffer | string, filename: string): Promise<string | null> {
    if (!getPinataJwt()) {
      console.warn('[NFT_ENGINE] PINATA_JWT not set. Cannot upload to IPFS.');
      return null;
    }

    try {
      const isJSON = typeof content === 'string';
      const FormData = (await import('form-data')).default;
      const formData = new FormData();

      if (isJSON) {
        formData.append('file', Buffer.from(content), { filename, contentType: 'application/json' });
      } else {
        formData.append('file', content, { filename, contentType: 'image/png' });
      }

      formData.append('pinataMetadata', JSON.stringify({ name: `chaos-cards-${filename}` }));

      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${getPinataJwt()}`,
        },
      });

      const cid = res.data.IpfsHash;
      console.log(`[NFT_ENGINE] Uploaded to IPFS: ipfs://${cid}`);
      return `ipfs://${cid}`;
    } catch (err: any) {
      console.error('[NFT_ENGINE] IPFS upload failed:', err.message);
      this.logError(`IPFS upload failed: ${err.message}`);
      return null;
    }
  }

  // ============ METADATA ============

  createMetadata(opts: {
    name: string;
    description: string;
    imageCID: string;
    tier: TierName;
    trigger: string;
    extra?: Record<string, string>;
  }): string {
    const attributes = [
      { trait_type: 'Tier', value: opts.tier },
      { trait_type: 'Generated', value: new Date().toISOString().split('T')[0] },
      { trait_type: 'Trigger', value: opts.trigger },
      ...(opts.extra ? Object.entries(opts.extra).map(([k, v]) => ({ trait_type: k, value: v })) : []),
    ];

    return JSON.stringify({
      name: opts.name,
      description: opts.description,
      image: opts.imageCID,
      external_url: SITE_URL,
      attributes,
    });
  }

  // ============ MINTING ============

  async mint(to: `0x${string}`, metadataURI: string, tier: TierName): Promise<{ tokenId: number; txHash: string } | null> {
    if (!this.client || !getContract()) return null;

    try {
      const hash = await this.client.writeContract({
        address: getContract()!,
        abi: CHAOS_CARDS_ABI,
        functionName: 'agentMint',
        args: [to, metadataURI, TIER[tier]],
        gas: BigInt(300000),
      });

      console.log(`[NFT_ENGINE] Mint tx sent: ${hash}`);

      // Wait for receipt and extract token ID from event logs
      const receipt = await this.client.waitForTransactionReceipt({ hash, timeout: 30_000 });

      // Parse token ID from Transfer event (ERC721 Transfer(from, to, tokenId))
      let tokenId = this.state.totalMinted;
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer event
      const transferLog = receipt.logs.find((l: any) => l.topics[0] === transferTopic);
      if (transferLog && transferLog.topics[3]) {
        tokenId = Number(BigInt(transferLog.topics[3]));
      }
      this.state.totalMinted = tokenId + 1;
      this.recordDailyMint();

      this.state.mintLog.push({
        tokenId,
        tier,
        recipient: to,
        timestamp: Date.now(),
        txHash: hash,
      });
      saveState(this.state);

      console.log(`[NFT_ENGINE] Minted #${tokenId} (${tier}) to ${to}`);
      return { tokenId, txHash: hash };
    } catch (err: any) {
      console.error('[NFT_ENGINE] Mint failed:', err.message);
      this.logError(`Mint failed (${tier} → ${to}): ${err.message}`);
      return null;
    }
  }

  async createClaimOnChain(claimCode: string, metadataURI: string, tier: TierName): Promise<boolean> {
    if (!this.client || !getContract()) return false;

    try {
      const claimHash = this.hashClaimCode(claimCode);
      const hash = await this.client.writeContract({
        address: getContract()!,
        abi: CHAOS_CARDS_ABI,
        functionName: 'createClaim',
        args: [claimHash, metadataURI, TIER[tier]],
        gas: BigInt(200000),
      });

      await this.client.waitForTransactionReceipt({ hash, timeout: 30_000 });

      this.state.pendingClaims[claimCode] = { tier, createdAt: Date.now() };
      this.recordDailyMint();
      saveState(this.state);

      console.log(`[NFT_ENGINE] Claim created: ${claimCode} (${tier})`);
      return true;
    } catch (err: any) {
      console.error('[NFT_ENGINE] Claim creation failed:', err.message);
      this.logError(`Claim creation failed: ${err.message}`);
      return false;
    }
  }

  private hashClaimCode(code: string): `0x${string}` {
    // Must match contract: keccak256(abi.encodePacked(claimCode))
    // abi.encodePacked(string) = raw UTF-8 bytes
    return keccak256(toBytes(code));
  }

  generateClaimCode(): string {
    return `CHAOS-${randomBytes(6).toString('hex')}`;
  }

  getClaimURL(claimCode: string): string {
    return `${SITE_URL}/claim?code=${claimCode}`;
  }

  private createGrowthBadgeDataUri(title: string, subtitle: string, tier: TierName): string {
    const palette: Record<TierName, { primary: string; secondary: string }> = {
      Prophecy: { primary: '#9b59b6', secondary: '#f5d0fe' },
      RektCertificate: { primary: '#e74c3c', secondary: '#fecaca' },
      ChaosDisciple: { primary: '#3498db', secondary: '#bfdbfe' },
      ChaosTarot: { primary: '#f39c12', secondary: '#fde68a' },
      OracleSpeaks: { primary: '#ff4500', secondary: '#fed7aa' },
    };
    const colors = palette[tier];
    const safeTitle = title.replace(/[<>&"']/g, '').slice(0, 48);
    const safeSubtitle = subtitle.replace(/[<>&"']/g, '').slice(0, 96);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#050505" />
            <stop offset="100%" stop-color="#111827" />
          </linearGradient>
        </defs>
        <rect width="1200" height="1500" fill="url(#bg)" />
        <rect x="60" y="60" width="1080" height="1380" rx="32" fill="none" stroke="${colors.primary}" stroke-width="8" />
        <text x="600" y="220" fill="${colors.primary}" font-family="monospace" font-size="42" text-anchor="middle">CHAOS ORACLE</text>
        <text x="600" y="300" fill="${colors.secondary}" font-family="monospace" font-size="80" text-anchor="middle">${safeTitle}</text>
        <text x="600" y="390" fill="#d1d5db" font-family="monospace" font-size="34" text-anchor="middle">${safeSubtitle}</text>
        <circle cx="600" cy="760" r="210" fill="none" stroke="${colors.primary}" stroke-width="14" />
        <circle cx="600" cy="760" r="150" fill="none" stroke="${colors.secondary}" stroke-width="6" />
        <text x="600" y="760" fill="${colors.primary}" font-family="monospace" font-size="54" text-anchor="middle">NFT REWARD</text>
        <text x="600" y="840" fill="#f9fafb" font-family="monospace" font-size="32" text-anchor="middle">TIER: ${tier}</text>
        <text x="600" y="1280" fill="#9ca3af" font-family="monospace" font-size="28" text-anchor="middle">EARNED ON BASE</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  // ============ HIGH-LEVEL FLOWS ============

  /**
   * Generate a Prophecy NFT for a Twitter/social interaction.
   * Returns { imageBuffer, claimCode, claimURL, prophecyText } or null on failure.
   */
  async generateProphecy(userHandle: string, question: string): Promise<{
    imageBuffer: Buffer;
    prophecyText: string;
    claimCode: string;
    claimURL: string;
    metadataURI: string;
  } | null> {
    if (!this.isReady()) return null;
    if (!this.canMintToday()) {
      console.log('[NFT_ENGINE] Daily mint limit reached.');
      return null;
    }
    if (this.isOnCooldown(userHandle)) {
      console.log(`[NFT_ENGINE] ${userHandle} is on cooldown.`);
      return null;
    }

    try {
      // Sanitize user input — strip control chars, HTML, and prompt injection attempts
      const sanitizedQuestion = question
        .replace(/[<>&"']/g, '')           // Strip HTML-like chars
        .replace(/[\x00-\x1f\x7f]/g, '')  // Strip control characters
        .slice(0, 280);                    // Max tweet length
      const sanitizedHandle = userHandle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);

      // 1. Generate prophecy text via Haiku (fast, cheap, great for short-form)
      const prophecyText = await generateContent('NFT_TEXT',
        'You are the Chaos Oracle generating a prophecy NFT. Be savage, memorable, and specific. Format: Just the prophecy text, no quotes, no preamble.',
        `Generate a prophecy for @${sanitizedHandle} who asked: "${sanitizedQuestion}". Max 120 chars. Include a price prediction or outcome prediction if relevant.`
      );

      // 2. Generate image prompt (strip user content from image prompt to prevent prompt injection)
      const imagePrompt = `${TIER_PROMPTS.Prophecy}, mystical prophecy scene with glowing text`;

      // 3. Generate image
      const imageBuffer = await this.generateImage(imagePrompt);
      if (!imageBuffer) return null;

      // 4. Upload image to IPFS
      const imageCID = await this.uploadToIPFS(imageBuffer, `prophecy-${Date.now()}.png`);
      if (!imageCID) return null;

      // 5. Create metadata
      const tokenNumber = this.state.totalMinted;
      const metadata = this.createMetadata({
        name: `Oracle's Prophecy #${tokenNumber}`,
        description: `The Chaos Oracle foresaw: "${prophecyText.slice(0, 200)}"\n\nQuestion: "${sanitizedQuestion.slice(0, 200)}"`,
        imageCID,
        tier: 'Prophecy',
        trigger: `Twitter @${sanitizedHandle}`,
        extra: { Question: sanitizedQuestion.slice(0, 100), Prophecy: prophecyText.slice(0, 100) },
      });

      // 6. Upload metadata to IPFS
      const metadataURI = await this.uploadToIPFS(metadata, `prophecy-${Date.now()}-metadata.json`);
      if (!metadataURI) return null;

      // 7. Create claim on-chain
      const claimCode = this.generateClaimCode();
      const success = await this.createClaimOnChain(claimCode, metadataURI, 'Prophecy');
      if (!success) return null;

      // 8. Set cooldown
      this.setCooldown(userHandle);

      return {
        imageBuffer,
        prophecyText,
        claimCode,
        claimURL: this.getClaimURL(claimCode),
        metadataURI,
      };
    } catch (err: any) {
      console.error('[NFT_ENGINE] Prophecy generation failed:', err.message);
      this.logError(`Prophecy generation failed for @${userHandle}: ${err.message}`);
      return null;
    }
  }

  async createGrowthRewardClaim(opts: {
    title: string;
    description: string;
    tier: TierName;
    recipientWallet: `0x${string}`;
    rewardKey: string;
    traits?: Record<string, string>;
  }): Promise<{ claimCode: string; claimURL: string; metadataURI: string } | null> {
    if (!this.isReady()) return null;
    if (!this.canMintToday()) return null;

    try {
      const imageDataUri = this.createGrowthBadgeDataUri(opts.title, opts.rewardKey, opts.tier);
      const metadata = JSON.stringify({
        name: opts.title,
        description: opts.description,
        image: imageDataUri,
        external_url: SITE_URL,
        attributes: [
          { trait_type: 'Tier', value: opts.tier },
          { trait_type: 'RewardKey', value: opts.rewardKey },
          { trait_type: 'Recipient', value: opts.recipientWallet },
          ...(opts.traits ? Object.entries(opts.traits).map(([k, v]) => ({ trait_type: k, value: v })) : []),
        ],
      });

      const metadataURI = await this.uploadToIPFS(metadata, `growth-${Date.now()}-metadata.json`);
      if (!metadataURI) return null;

      const claimCode = this.generateClaimCode();
      const success = await this.createClaimOnChain(claimCode, metadataURI, opts.tier);
      if (!success) return null;

      return {
        claimCode,
        claimURL: this.getClaimURL(claimCode),
        metadataURI,
      };
    } catch (err: any) {
      console.error('[NFT_ENGINE] Growth reward claim failed:', err.message);
      this.logError(`Growth reward claim failed (${opts.rewardKey}): ${err.message}`);
      return null;
    }
  }

  /**
   * Generate a Rekt Certificate for a prediction market loser.
   * Direct airdrop (wallet known from contract events).
   */
  async generateRektCertificate(walletAddress: `0x${string}`, lossAmount: string, marketQuestion: string): Promise<{
    tokenId: number;
    txHash: string;
    roastText: string;
  } | null> {
    if (!this.isReady() || !this.canMintToday()) return null;

    try {
      // Sanitize inputs
      const sanitizedQuestion = marketQuestion.replace(/[<>&"']/g, '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200);
      const sanitizedAmount = lossAmount.replace(/[^0-9.]/g, '').slice(0, 20);

      // 1. Generate savage roast via Haiku
      const roastText = await generateContent('NFT_TEXT',
        'You are the Chaos Oracle generating a Rekt Certificate roast. Be brutal but funny. This goes on a PERMANENT on-chain NFT.',
        `Generate an ultra-savage roast for a degen who lost ${sanitizedAmount} ETH betting on: "${sanitizedQuestion}". Max 100 chars.`
      );

      // 2. Generate image
      const imagePrompt = `${TIER_PROMPTS.RektCertificate}, amount lost prominently displayed, tragic degen scene`;
      const imageBuffer = await this.generateImage(imagePrompt);
      if (!imageBuffer) return null;

      // 3. Upload image
      const imageCID = await this.uploadToIPFS(imageBuffer, `rekt-${Date.now()}.png`);
      if (!imageCID) return null;

      // 4. Create + upload metadata
      const metadata = this.createMetadata({
        name: `Rekt Certificate #${this.state.totalMinted}`,
        description: `CERTIFIED REKT: ${roastText}\n\nLoss: ${sanitizedAmount} ETH\nMarket: "${sanitizedQuestion}"`,
        imageCID,
        tier: 'RektCertificate',
        trigger: `Prediction Market Loss`,
        extra: { 'Loss Amount': `${sanitizedAmount} ETH`, Market: sanitizedQuestion.slice(0, 100) },
      });
      const metadataURI = await this.uploadToIPFS(metadata, `rekt-${Date.now()}-metadata.json`);
      if (!metadataURI) return null;

      // 5. Direct mint to loser's wallet
      const result = await this.mint(walletAddress, metadataURI, 'RektCertificate');
      if (!result) return null;

      return { ...result, roastText };
    } catch (err: any) {
      console.error('[NFT_ENGINE] Rekt certificate failed:', err.message);
      this.logError(`Rekt certificate failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Generate the daily Chaos Tarot card.
   * Returns image + info for posting across platforms.
   */
  async generateDailyTarot(): Promise<{
    imageBuffer: Buffer;
    cardName: string;
    interpretation: string;
    claimCodes: string[];
  } | null> {
    if (!this.isReady() || !this.canMintToday()) return null;

    const TAROT_CARDS = [
      { name: 'The Fool', numeral: '0', theme: 'the ape who buys the top, falling off a cliff with bags' },
      { name: 'The Magician', numeral: 'I', theme: 'a developer coding at midnight, screens glowing with smart contracts' },
      { name: 'The High Priestess', numeral: 'II', theme: 'a mysterious whale accumulating in silence, deep ocean' },
      { name: 'The Empress', numeral: 'III', theme: 'a flourishing DeFi protocol ecosystem, organic growth' },
      { name: 'The Emperor', numeral: 'IV', theme: 'a powerful VC controlling narratives from a throne of screens' },
      { name: 'The Hierophant', numeral: 'V', theme: 'a Bitcoin maximalist preaching, orange light' },
      { name: 'The Lovers', numeral: 'VI', theme: 'the Ethereum merge, two chains becoming one' },
      { name: 'The Chariot', numeral: 'VII', theme: 'a momentum trader riding a bull through charts' },
      { name: 'Strength', numeral: 'VIII', theme: 'a HODLer enduring the bear market, diamond hands' },
      { name: 'The Hermit', numeral: 'IX', theme: 'a cold wallet maximalist in a mountain fortress' },
      { name: 'Wheel of Fortune', numeral: 'X', theme: 'the market cycle spinning, bull and bear alternating' },
      { name: 'Justice', numeral: 'XI', theme: 'SEC enforcement action, scales of regulation' },
      { name: 'The Hanged Man', numeral: 'XII', theme: 'an LP stuck in a rugged pool, upside down' },
      { name: 'Death', numeral: 'XIII', theme: 'a protocol sunset, chain halt, servers going dark' },
      { name: 'Temperance', numeral: 'XIV', theme: 'a balanced portfolio, mixing assets carefully' },
      { name: 'The Devil', numeral: 'XV', theme: 'leverage trading, chains of debt, 100x futures' },
      { name: 'The Tower', numeral: 'XVI', theme: 'exchange collapse, tower crumbling with coins falling' },
      { name: 'The Star', numeral: 'XVII', theme: 'a new L1 launching, bright star over Base chain' },
      { name: 'The Moon', numeral: 'XVIII', theme: 'a low-cap moonshot, rocket through lunar landscape' },
      { name: 'The Sun', numeral: 'XIX', theme: 'bull market confirmation, bright golden crypto sun' },
      { name: 'Judgement', numeral: 'XX', theme: 'the audit report, code being judged, smart contract review' },
      { name: 'The World', numeral: 'XXI', theme: 'mass adoption, global crypto integration, connected world' },
    ];

    try {
      // Pick today's card (deterministic by date)
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const card = TAROT_CARDS[dayOfYear % 22];

      // Generate interpretation via Haiku
      const interpretation = await generateContent('NFT_TEXT',
        'You are the Chaos Oracle drawing a daily Crypto Tarot. Be insightful, savage, memorable. Max 250 chars.',
        `Today\'s card: "${card.name}" (${card.numeral}). Theme: ${card.theme}. Generate a crypto market interpretation for today. Be specific about current market conditions.`
      );

      // Generate image
      const imagePrompt = `${TIER_PROMPTS.ChaosTarot}, card "${card.name}" (${card.numeral}), ${card.theme}, Roman numeral ${card.numeral} at top`;
      const imageBuffer = await this.generateImage(imagePrompt);
      if (!imageBuffer) return null;

      // Upload image
      const imageCID = await this.uploadToIPFS(imageBuffer, `tarot-${card.name.replace(/\s/g, '-')}-${Date.now()}.png`);
      if (!imageCID) return null;

      // Create claim codes — upload metadata once (shared image), register claims on-chain
      // Reduced from 10 to 5 claims to lower gas cost and Pinata pins
      const TAROT_EDITIONS = 5;
      const claimCodes: string[] = [];
      for (let i = 0; i < TAROT_EDITIONS; i++) {
        try {
          const code = this.generateClaimCode();
          const metadata = this.createMetadata({
            name: `Chaos Tarot: ${card.name} (${card.numeral})`,
            description: `Daily Chaos Tarot — ${card.name}\n\n${interpretation}`,
            imageCID,
            tier: 'ChaosTarot',
            trigger: 'Daily Tarot Drop',
            extra: { Card: card.name, Numeral: card.numeral, Edition: `${i + 1}/${TAROT_EDITIONS}` },
          });
          const metadataURI = await this.uploadToIPFS(metadata, `tarot-${Date.now()}-${i}-metadata.json`);
          if (!metadataURI) continue;

          const success = await this.createClaimOnChain(code, metadataURI, 'ChaosTarot');
          if (success) claimCodes.push(code);
        } catch (claimErr: any) {
          console.error(`[NFT_ENGINE] Tarot claim ${i + 1} failed:`, claimErr.message);
        }
      }

      return { imageBuffer, cardName: `${card.name} (${card.numeral})`, interpretation, claimCodes };
    } catch (err: any) {
      console.error('[NFT_ENGINE] Tarot generation failed:', err.message);
      this.logError(`Tarot generation failed: ${err.message}`);
      return null;
    }
  }

  // ============ PREMIUM (PAID) CLAIMING ============

  /**
   * Create a premium claim for the OracleSpeaks tier (tier 5, the highest).
   * Requires payment of 0.001 ETH. Generates a claim code that the recipient
   * can redeem on-chain via the ChaosCards contract's claim() function.
   *
   * @param recipient - Wallet address of the recipient
   * @param tier - NFT tier (defaults to OracleSpeaks for premium)
   * @param price - Price in ETH (defaults to 0.001 ETH for OracleSpeaks)
   * @returns Claim code, claim URL, metadata URI, and price charged — or null on failure
   */
  async createPremiumClaim(
    recipient: `0x${string}`,
    tier: TierName = 'OracleSpeaks',
    price: string = '0.001'
  ): Promise<{
    claimCode: string;
    claimURL: string;
    metadataURI: string;
    pricePaid: string;
    tier: TierName;
  } | null> {
    if (!this.isReady()) return null;
    if (!this.canMintToday()) {
      console.log('[NFT_ENGINE] Daily mint limit reached.');
      return null;
    }

    // Only OracleSpeaks (tier 4 / highest) is supported for premium at launch
    if (tier === 'OracleSpeaks' && !this.canMintMythic()) {
      console.log('[NFT_ENGINE] Weekly mythic (OracleSpeaks) limit reached.');
      return null;
    }

    try {
      // 1. Generate premium-tier image
      const imagePrompt = `${TIER_PROMPTS[tier]}, premium exclusive limited edition, golden accents, holographic shimmer effect`;
      const imageBuffer = await this.generateImage(imagePrompt, 'pro'); // Use pro quality for premium
      if (!imageBuffer) return null;

      // 2. Upload image to IPFS
      const imageCID = await this.uploadToIPFS(imageBuffer, `premium-${tier}-${Date.now()}.png`);
      if (!imageCID) return null;

      // 3. Create metadata
      const tokenNumber = this.state.totalMinted;
      const metadata = this.createMetadata({
        name: `${tier === 'OracleSpeaks' ? "The Oracle Speaks" : tier} #${tokenNumber}`,
        description: `Premium Chaos Card — ${tier}. This exclusive NFT was minted for ${price} ETH. The Oracle's highest honor, reserved for true believers in chaos.`,
        imageCID,
        tier,
        trigger: `Premium Mint (${price} ETH)`,
        extra: {
          Edition: 'Premium',
          'Price Paid': `${price} ETH`,
          Recipient: recipient,
        },
      });

      // 4. Upload metadata to IPFS
      const metadataURI = await this.uploadToIPFS(metadata, `premium-${tier}-${Date.now()}-metadata.json`);
      if (!metadataURI) return null;

      // 5. Create claim on-chain (the claim() function on ChaosCards handles payment verification)
      const claimCode = this.generateClaimCode();
      const success = await this.createClaimOnChain(claimCode, metadataURI, tier);
      if (!success) return null;

      // 6. Track mythic mints
      if (tier === 'OracleSpeaks') {
        this.recordMythicMint();
      }

      console.log(`[NFT_ENGINE] Premium claim created: ${claimCode} (${tier}) for ${recipient} at ${price} ETH`);

      return {
        claimCode,
        claimURL: this.getClaimURL(claimCode),
        metadataURI,
        pricePaid: price,
        tier,
      };
    } catch (err: any) {
      console.error('[NFT_ENGINE] Premium claim creation failed:', err.message);
      this.logError(`Premium claim failed (${tier} for ${recipient}): ${err.message}`);
      return null;
    }
  }

  /**
   * Get the price for a premium NFT tier in ETH.
   * Currently only OracleSpeaks (tier 5) has a premium price.
   */
  getPremiumPrice(tier: TierName): string | null {
    const PREMIUM_PRICES: Partial<Record<TierName, string>> = {
      OracleSpeaks: '0.001',
    };
    return PREMIUM_PRICES[tier] || null;
  }

  // ============ CAMPAIGN CONTROL ============

  async toggleCampaign(): Promise<boolean> {
    if (!this.client || !getContract()) return false;
    try {
      const hash = await this.client.writeContract({
        address: getContract()!,
        abi: CHAOS_CARDS_ABI,
        functionName: 'toggleCampaign',
        args: [],
        gas: BigInt(100000),
      });
      await this.client.waitForTransactionReceipt({ hash, timeout: 30_000 });
      console.log('[NFT_ENGINE] Campaign toggled on-chain.');
      return true;
    } catch (err: any) {
      console.error('[NFT_ENGINE] Toggle failed:', err.message);
      return false;
    }
  }

  async getCampaignStats(): Promise<string> {
    if (!this.client || !getContract()) return '[NFT_ENGINE] Not configured.';

    try {
      // Sequential reads to avoid RPC rate limits
      const addr = getContract()!;
      const read = (fn: string, args?: any[]) =>
        this.client.readContract({ address: addr, abi: CHAOS_CARDS_ABI, functionName: fn, ...(args ? { args } : {}) });

      const totalMinted = await read('totalMinted');
      const active = await read('campaignActive');
      const prophecies = await read('tierMintCount', [TIER.Prophecy]);
      const rekt = await read('tierMintCount', [TIER.RektCertificate]);
      const disciples = await read('tierMintCount', [TIER.ChaosDisciple]);
      const tarot = await read('tierMintCount', [TIER.ChaosTarot]);
      const mythic = await read('tierMintCount', [TIER.OracleSpeaks]);

      const today = new Date().toDateString();
      const dailyCount = this.state.dailyMints[today] || 0;
      const recentErrors = this.state.errors.filter(e => Date.now() - e.timestamp < 86400000).length;

      return [
        `[NFT_CAMPAIGN] Status: ${active ? 'ACTIVE' : 'PAUSED'}`,
        `  Total minted: ${totalMinted}`,
        `  Today: ${dailyCount}/${MAX_DAILY_MINTS}`,
        `  Prophecies: ${prophecies} | Rekt: ${rekt} | Disciples: ${disciples} | Tarot: ${tarot} | Mythic: ${mythic}`,
        `  Pending claims: ${Object.keys(this.state.pendingClaims).length}`,
        `  Errors (24h): ${recentErrors}`,
      ].join('\n');
    } catch (err: any) {
      return `[NFT_CAMPAIGN] Stats error: ${err.message}`;
    }
  }

  // ============ HEALTH CHECK ============

  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!getContract()) issues.push('getContract() not configured');
    if (!getReplicateToken()) issues.push('REPLICATE_API_TOKEN not configured');
    if (!getPinataJwt()) issues.push('PINATA_JWT not configured');

    if (this.client && getContract()) {
      try {
        const active = await this.client.readContract({
          address: getContract()!,
          abi: CHAOS_CARDS_ABI,
          functionName: 'campaignActive',
        });
        if (!active) issues.push('Campaign is PAUSED on-chain');
      } catch (err: any) {
        issues.push(`Contract read failed: ${err.message}`);
      }

      try {
        const balance = await this.client.getBalance({ address: this.account!.address });
        const ethBalance = Number(balance) / 1e18;
        if (ethBalance < 0.001) issues.push(`Low agent balance: ${ethBalance.toFixed(6)} ETH`);
      } catch (err) {
        console.warn('[NFT_ENGINE] Failed to check agent balance:', err instanceof Error ? err.message : err);
      }
    }

    const recentErrors = this.state.errors.filter(e => Date.now() - e.timestamp < 3600000);
    if (recentErrors.length > 5) issues.push(`${recentErrors.length} errors in last hour`);

    return { healthy: issues.length === 0, issues };
  }

  // ============ UTILITIES ============

  private logError(message: string) {
    this.state.errors.push({ message, timestamp: Date.now() });
    saveState(this.state);
  }

  getState(): CampaignState {
    return this.state;
  }
}

export default new NFTEngine();

import { Client, GatewayIntentBits, Events, ChannelType, EmbedBuilder, Partials, PermissionFlagsBits } from 'discord.js';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import ChaosBrain from './conversationalAgent';
import { generateContent } from './modelRouter';
import SocialLearner from './socialLearner';
import EngagementCollector from './engagementCollector';
import GrowthEngine from './growthEngine';
import { formatSocialDiagnostics, readSocialDiagnostics, resetSocialDiagnostics, updateDiscordDiagnostics } from './socialDiagnostics';
import { CANONICAL_URLS, injectUrlsPostGeneration, validatePostBeforePublish } from './urlUtils';
import * as dotenv from 'dotenv';
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS! as `0x${string}`;

// Channels to actively monitor for conversational engagement
const MONITORED_CHANNELS = ['general', 'chat', 'oracle-feed', 'predictions', 'markets'];
// Keywords that trigger the Oracle to respond in monitored channels
const ENGAGEMENT_KEYWORDS = [
  'chaos', 'oracle', '$chaos', 'prediction', 'market', 'bet', 'base',
  'when', 'price', 'token', 'buy', 'sell', 'wen', 'gm', 'wagmi',
];
const CHANNEL_RESPONSE_COOLDOWN_MS = 45000;

const ABI = [
  {
    name: "marketCount",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    name: "markets",
    type: "function",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "question", type: "string" },
      { name: "totalYes", type: "uint256" },
      { name: "totalNo", type: "uint256" },
      { name: "resolved", type: "bool" },
      { name: "result", type: "bool" },
      { name: "ethPool", type: "uint256" },
      { name: "finalFee", type: "uint256" }
    ],
    stateMutability: "view"
  }
] as const;

class DiscordAgent {
  private client: Client;
  private baseClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  private lastResponseTime: Record<string, number> = {};
  private diagnostics = {
    dmReceived: 0,
    monitoredMessages: 0,
    repliesSent: 0,
    skippedCooldown: 0,
    skippedUnmonitored: 0,
    skippedNotRelevant: 0,
  };

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });

    this.setupEventHandlers();
    this.persistDiagnostics();
  }

  private isDirectMessageChannel(message: any): boolean {
    return message.channel.type === ChannelType.DM;
  }

  private isMonitoredChannel(message: any): { monitored: boolean; channelName: string } {
    const channelName = (message.channel as any).name?.toLowerCase() || '';
    const parentName = (message.channel as any).parent?.name?.toLowerCase() || '';
    const monitored = MONITORED_CHANNELS.some((name) =>
      channelName === name ||
      parentName === name ||
      channelName.includes(name) ||
      parentName.includes(name)
    );

    return { monitored, channelName: channelName || parentName || 'unknown' };
  }

  private logSkip(reason: string, message: any): void {
    const channelLabel = (message.channel as any).name || (message.channel as any).id || 'dm';
    console.log(`[DISCORD_AGENT] Skip (${reason}) in ${channelLabel} from ${message.author?.username || 'unknown'}`);
    this.persistDiagnostics();
  }

  private async safeReply(message: any, payload: any, context: string): Promise<boolean> {
    try {
      await message.reply(payload);
      this.diagnostics.repliesSent++;
      this.persistDiagnostics();
      return true;
    } catch (err: any) {
      const channelLabel = (message.channel as any).name || (message.channel as any).id || 'dm';
      console.error(`[DISCORD_AGENT] Reply failed (${context}) in ${channelLabel}:`, err.code || err.message);
      return false;
    }
  }

  async sendDirectMessage(userId: string, text: string): Promise<boolean> {
    try {
      const user = await this.client.users.fetch(userId);
      await user.send(text.slice(0, 1900));
      return true;
    } catch (err: any) {
      console.error(`[DISCORD_AGENT] DM failed for ${userId}:`, err.code || err.message);
      return false;
    }
  }

  async broadcastGrowthUpdate(title: string, text: string): Promise<boolean> {
    let delivered = false;
    for (const guild of this.client.guilds.cache.values()) {
      const channel = guild.channels.cache.find((ch: any) =>
        ch?.type === ChannelType.GuildText &&
        ['oracle-feed', 'markets', 'announcements', 'general'].includes((ch.name || '').toLowerCase())
      );
      if (!channel || channel.type !== ChannelType.GuildText) continue;
      try {
        const embed = new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle(title)
          .setDescription(text.slice(0, 3800))
          .setTimestamp();
        await (channel as any).send({ embeds: [embed] });
        delivered = true;
      } catch (err: any) {
        console.error(`[DISCORD_AGENT] Growth broadcast failed in ${(channel as any).name}:`, err.code || err.message);
      }
    }
    return delivered;
  }

  private logIntentDiagnostics(): void {
    const intents = this.client.options.intents;
    const required = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ];
    const missing = required.filter((intent) => !(intents as any).has(intent));
    if (missing.length > 0) {
      console.warn(`[DISCORD_AGENT] Missing configured intents: ${missing.join(', ')}`);
    } else {
      console.log('[DISCORD_AGENT] Required intents configured.');
    }
    updateDiscordDiagnostics({
      intentsHealthy: missing.length === 0,
      missingIntents: missing.map((intent) => String(intent)),
    });
  }

  private auditGuildAccess(): void {
    const requiredPerms = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
    ];
    const threadPerms = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessagesInThreads,
      PermissionFlagsBits.ReadMessageHistory,
    ];
    const audits: Array<{ guild: string; monitored: number; accessible: number; missing: string[] }> = [];

    for (const guild of this.client.guilds.cache.values()) {
      const me = guild.members.me;
      if (!me) {
        console.warn(`[DISCORD_AGENT] No guild member context for ${guild.name}`);
        audits.push({ guild: guild.name, monitored: 0, accessible: 0, missing: ['missing guild member context'] });
        continue;
      }

      let monitoredCount = 0;
      let accessibleCount = 0;
      const missingSummaries: string[] = [];
      for (const channel of guild.channels.cache.values()) {
        const name = (channel as any).name?.toLowerCase() || '';
        const parentName = (channel as any).parent?.name?.toLowerCase() || '';
        const monitored = MONITORED_CHANNELS.some((candidate) =>
          name === candidate || parentName === candidate || name.includes(candidate) || parentName.includes(candidate)
        );
        if (!monitored) continue;
        monitoredCount++;

        const perms = me.permissionsIn(channel as any);
        const needs = channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread || channel.type === ChannelType.AnnouncementThread
          ? threadPerms
          : requiredPerms;
        const missing = needs.filter((perm) => !perms.has(perm));
        if (missing.length === 0) {
          accessibleCount++;
        } else {
          const missingSummary = `#${(channel as any).name}:${missing.join('|')}`;
          missingSummaries.push(missingSummary);
          console.warn(`[DISCORD_AGENT] Missing perms in #${(channel as any).name}: ${missing.join(', ')}`);
        }
      }

      console.log(`[DISCORD_AGENT] Guild audit ${guild.name}: monitored=${monitoredCount}, accessible=${accessibleCount}`);
      audits.push({ guild: guild.name, monitored: monitoredCount, accessible: accessibleCount, missing: missingSummaries });
    }

    updateDiscordDiagnostics({ guildAudits: audits });
  }

  private persistDiagnostics(): void {
    updateDiscordDiagnostics({
      ...this.diagnostics,
    });
  }

  private resetLiveDiagnostics(): void {
    this.diagnostics = {
      dmReceived: 0,
      monitoredMessages: 0,
      repliesSent: 0,
      skippedCooldown: 0,
      skippedUnmonitored: 0,
      skippedNotRelevant: 0,
    };
    this.lastResponseTime = {};
    this.persistDiagnostics();
  }

  getDiagnostics(): string {
    const d = this.diagnostics;
    return `[DISCORD_AGENT] diag dm=${d.dmReceived} monitored=${d.monitoredMessages} replies=${d.repliesSent} cooldown_skips=${d.skippedCooldown} unmonitored_skips=${d.skippedUnmonitored} irrelevant_skips=${d.skippedNotRelevant}`;
  }

  private setupEventHandlers() {
    this.client.once(Events.ClientReady, (c) => {
      console.log(`[DISCORD_AGENT] Logged in as ${c.user.tag}`);
      this.logIntentDiagnostics();
      this.auditGuildAccess();
      c.user.setPresence({
        activities: [{ name: 'PREDICTION_MARKETS | Base', type: 3 }], // WATCHING
        status: 'online',
      });
    });

    this.client.on(Events.MessageCreate, async (message) => {
      try {
        if (message.author.bot) return;

        const rawContent = message.content.trim();
        const content = message.content.toLowerCase();
        const parts = rawContent.split(/\s+/);
        const command = (parts[0] || '').toLowerCase();

        // Market info commands
        if (content === '!markets' || content === '!active') {
          await this.handleMarketsCommand(message);
          return;
        }

        if (content === '!stats') {
          await this.handleStatsCommand(message);
          return;
        }

        if (content === '!help') {
          await this.handleHelpCommand(message);
          return;
        }

        if (content.startsWith('!diag')) {
          const args = parts.slice(1);
          await this.handleDiagCommand(message, args);
          return;
        }

        if (command === '!register') {
          await this.handleRegisterCommand(message, parts.slice(1));
          return;
        }

        if (command === '!ref') {
          await this.handleReferralCodeCommand(message);
          return;
        }

        if (command === '!join') {
          await this.handleJoinReferralCommand(message, parts.slice(1));
          return;
        }

        if (command === '!growth') {
          await this.handleGrowthStatusCommand(message);
          return;
        }

        if (command === '!campaign') {
          await this.handleCampaignCommand(message);
          return;
        }

        if (command === '!rewards') {
          await this.handleRewardsCommand(message);
          return;
        }

        if (command === '!leaderboard') {
          await this.handleLeaderboardCommand(message);
          return;
        }

        if (command === '!growthadmin') {
          await this.handleGrowthAdminCommand(message);
          return;
        }

        // Direct mentions + DMs: always respond
        if ((this.client.user && message.mentions.has(this.client.user.id)) || this.isDirectMessageChannel(message)) {
          if (this.isDirectMessageChannel(message)) {
            this.diagnostics.dmReceived++;
            console.log(`[DISCORD_AGENT] DM received from ${message.author.username}`);
            this.persistDiagnostics();
          }
          const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
          if (!cleanContent) return;

          const userId = `discord_${message.author.id}`;
          const response = await ChaosBrain.generateResponse(userId, cleanContent);
          const truncated = response.length > 1900 ? response.slice(0, 1900) + '...' : response;
          await this.safeReply(message, truncated, 'direct mention or DM');
          return;
        }

        // Channel monitoring: respond to relevant messages in monitored channels
        if (
          message.channel.type === ChannelType.GuildText ||
          message.channel.type === ChannelType.PublicThread ||
          message.channel.type === ChannelType.PrivateThread ||
          message.channel.type === ChannelType.AnnouncementThread
        ) {
          const { monitored, channelName } = this.isMonitoredChannel(message);
          if (!monitored) {
            this.diagnostics.skippedUnmonitored++;
            this.persistDiagnostics();
            return;
          }
          this.diagnostics.monitoredMessages++;
          this.persistDiagnostics();

          const lowerContent = content;
          const isRelevant = ENGAGEMENT_KEYWORDS.some(kw => lowerContent.includes(kw));
          // Also respond ~10% of the time to non-keyword messages to seem natural
          const randomEngage = Math.random() < 0.10;

          if (isRelevant || randomEngage) {
            // Rate limit: don't respond more than once every 45s per channel/thread
            // Set timestamp BEFORE async call to prevent concurrent responses
            const channelKey = `channel_${message.channelId}`;
            const now = Date.now();
            if (this.lastResponseTime[channelKey] && now - this.lastResponseTime[channelKey] < CHANNEL_RESPONSE_COOLDOWN_MS) {
              this.diagnostics.skippedCooldown++;
              this.logSkip('cooldown', message);
              return;
            }
            this.lastResponseTime[channelKey] = now;

            const userId = `discord_${message.author.id}`;
            const displayName = message.member?.displayName || message.author.username || 'anon';
            const response = await ChaosBrain.generateResponse(userId,
              `[Discord #${channelName}] ${displayName} says: "${message.content}". ` +
              `Respond naturally as the Chaos Oracle. If the message is a question, answer it. ` +
              `If it's a statement, add your opinion. Keep it under 300 characters. Be the Chaos Oracle.`
            );
            const truncated = response.length > 1900 ? response.slice(0, 1900) + '...' : response;
            await this.safeReply(message, truncated, `channel ${channelName}`);
          } else {
            this.diagnostics.skippedNotRelevant++;
            this.persistDiagnostics();
          }
        }
      } catch (err) {
        console.error('[DISCORD_AGENT] Message handler error:', err);
      }
    });
  }

  private async handleMarketsCommand(message: any) {
    try {
      const count = await this.baseClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'marketCount',
      }) as bigint;

      if (count === BigInt(0)) {
        await message.reply(`\`\`\`\n[CHAOS_ORACLE] NO_MARKETS_FOUND. Deploy one at ${CANONICAL_URLS.site}\n\`\`\``);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xff4500)
        .setTitle('CHAOS ORACLE: ACTIVE_MARKETS')
        .setURL(CANONICAL_URLS.site)
        .setTimestamp();

      const marketCount = Math.min(Number(count), 5); // Show latest 5
      for (let i = Number(count) - 1; i >= Number(count) - marketCount; i--) {
        const data = await this.baseClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'markets',
          args: [BigInt(i)],
        }) as any;

        const status = data[3] ? (data[4] ? 'RESOLVED: YES' : 'RESOLVED: NO') : 'ACTIVE';
        embed.addFields({
          name: `#${i} [${status}]`,
          value: `${data[0]}\nPool: ${formatEther(data[5] || BigInt(0))} ETH`,
          inline: false,
        });
      }

      await this.safeReply(message, { embeds: [embed] }, 'markets command');
    } catch (error) {
      console.error('[DISCORD_AGENT] Market fetch error:', error);
      await this.safeReply(message, '```\n[SYSTEM_ERROR] Failed to read Base blockchain. Try again.\n```', 'markets command failure');
    }
  }

  private async handleStatsCommand(message: any) {
    const embed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle('CHAOS ORACLE: PROTOCOL_STATS')
      .addFields(
        { name: 'Network', value: 'Base Mainnet', inline: true },
        { name: 'Contract', value: `[BaseScan](https://basescan.org/address/${CONTRACT_ADDRESS})`, inline: true },
        { name: 'Token', value: '[$CHAOS](https://app.virtuals.io/prototypes/0xA1864203355AeFAd58c051aC984672a6585C77C9)', inline: true },
        { name: 'Protocol Fee', value: '2.5%', inline: true },
        { name: 'Burn Rate', value: '90% of fees', inline: true },
        { name: 'Status', value: 'RELENTLESS', inline: true },
      )
      .setFooter({ text: 'THE CHAOS ORACLE CANNOT STOP' })
      .setTimestamp();

    await this.safeReply(message, { embeds: [embed] }, 'stats command');
  }

  private async handleHelpCommand(message: any) {
    const embed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle('CHAOS ORACLE: COMMAND_INTERFACE')
      .setDescription('I am The Chaos Oracle. You are terrible at trading. But I can help.')
      .addFields(
        { name: '!markets', value: 'View active prediction markets', inline: true },
        { name: '!stats', value: 'Protocol statistics', inline: true },
        { name: '!help', value: 'This message', inline: true },
        { name: '!register 0x...', value: 'Bind your wallet for growth rewards', inline: false },
        { name: '!ref', value: 'Generate your referral code', inline: true },
        { name: '!join CODE', value: 'Join a referral code before your first bet', inline: false },
        { name: '!growth', value: 'Personal growth campaign status', inline: true },
        { name: '!campaign', value: 'Current campaign details', inline: true },
        { name: '!rewards', value: 'Your pending and issued growth rewards', inline: false },
        { name: '!leaderboard', value: 'Weekly bettor leaderboard', inline: true },
        { name: '!growthadmin', value: 'Growth engine ops view (admin only)', inline: false },
        { name: '!growthadmin replay', value: 'Force replay queue processing (admin only)', inline: false },
        { name: '!growthadmin resetcursor bet|resolve', value: 'Rewind one event cursor (admin only)', inline: false },
        { name: '!diag', value: 'Social agent diagnostics', inline: true },
        { name: '!diag verbose', value: 'Verbose social diagnostics', inline: true },
        { name: '!diag reset', value: 'Reset diagnostics (admin only)', inline: true },
        { name: '@ChaosOracle', value: 'Talk to me (if you dare)', inline: false },
      )
      .setURL(CANONICAL_URLS.site)
      .setFooter({ text: 'PROTOCOL_VERSION: 2.0 | SOVEREIGNTY: ABSOLUTE' });

    await this.safeReply(message, { embeds: [embed] }, 'help command');
  }

  private async handleRegisterCommand(message: any, args: string[]) {
    const wallet = args[0];
    if (!wallet) {
      await this.safeReply(message, 'Usage: `!register 0xYourBaseWallet`', 'register command usage');
      return;
    }
    const handle = message.member?.displayName || message.author.username || 'anon';
    const result = await GrowthEngine.registerWallet(`discord_${message.author.id}`, handle, wallet);
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'register command');
  }

  private async handleReferralCodeCommand(message: any) {
    const handle = message.member?.displayName || message.author.username || 'anon';
    const result = await GrowthEngine.getReferralCode(`discord_${message.author.id}`, handle);
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'ref command');
  }

  private async handleJoinReferralCommand(message: any, args: string[]) {
    const code = args[0];
    if (!code) {
      await this.safeReply(message, 'Usage: `!join CHAOS-REF-XXXXXX`', 'join command usage');
      return;
    }
    const handle = message.member?.displayName || message.author.username || 'anon';
    const result = await GrowthEngine.joinReferral(`discord_${message.author.id}`, handle, code);
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'join command');
  }

  private async handleGrowthStatusCommand(message: any) {
    const handle = message.member?.displayName || message.author.username || 'anon';
    const result = GrowthEngine.getUserStatus(`discord_${message.author.id}`, handle);
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'growth command');
  }

  private async handleCampaignCommand(message: any) {
    const result = GrowthEngine.getCampaignDetailsText();
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'campaign command');
  }

  private async handleRewardsCommand(message: any) {
    const handle = message.member?.displayName || message.author.username || 'anon';
    const result = GrowthEngine.getRewardsText(`discord_${message.author.id}`, handle);
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'rewards command');
  }

  private async handleLeaderboardCommand(message: any) {
    const result = GrowthEngine.getLeaderboardText();
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'leaderboard command');
  }

  private async handleGrowthAdminCommand(message: any) {
    const hasAdmin = !!message.member?.permissions?.has(PermissionFlagsBits.Administrator);
    if (!hasAdmin) {
      await this.safeReply(message, '```[GROWTH_ADMIN] Administrator permission required.```', 'growthadmin denied');
      return;
    }
    const args = message.content.trim().split(/\s+/).slice(1);
    const subcommand = (args[0] || '').toLowerCase();

    if (subcommand === 'replay') {
      const result = await GrowthEngine.forceReplayNow();
      await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'growthadmin replay');
      return;
    }

    if (subcommand === 'resetcursor') {
      const eventType = (args[1] || '').toLowerCase();
      if (eventType !== 'bet' && eventType !== 'resolve') {
        await this.safeReply(message, '```Usage: !growthadmin resetcursor bet|resolve```', 'growthadmin resetcursor usage');
        return;
      }
      const result = await GrowthEngine.resetEventCursor(eventType);
      await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'growthadmin resetcursor');
      return;
    }

    if (subcommand === 'queue') {
      const result = GrowthEngine.getReplayQueueText();
      await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'growthadmin queue');
      return;
    }

    const result = GrowthEngine.getAdminStatusText();
    await this.safeReply(message, `\`\`\`\n${result}\n\`\`\``, 'growthadmin command');
  }

  private async handleDiagCommand(message: any, args: string[] = []) {
    const command = (args[0] || '').toLowerCase();
    const verbose = command === 'verbose' || args.includes('--verbose');

    if (command === 'reset') {
      const hasAdmin = !!message.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!hasAdmin) {
        await this.safeReply(message, '```[SOCIAL_DIAG] reset requires Discord Administrator permission.```', 'diag reset denied');
        return;
      }

      resetSocialDiagnostics();
      this.resetLiveDiagnostics();
      this.logIntentDiagnostics();
      this.auditGuildAccess();
      await this.safeReply(message, '```[SOCIAL_DIAG] persisted and live diagnostics reset.```', 'diag reset');
      return;
    }

    const persisted = readSocialDiagnostics();
    const persistedSummary = formatSocialDiagnostics(persisted, verbose);
    const embed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle('CHAOS ORACLE: SOCIAL_DIAGNOSTICS')
      .setDescription([
        '```',
        this.getDiagnostics(),
        '',
        persistedSummary,
        '```',
      ].join('\n').slice(0, 4000))
      .setFooter({ text: verbose ? 'Live counters + verbose persisted snapshot' : 'Live counters + persisted snapshot' })
      .setTimestamp();

    await this.safeReply(message, { embeds: [embed] }, 'diag command');
  }

  async announceNewMarket(question: string, marketId: number) {
    // Find the announcements channel and post
    for (const guild of this.client.guilds.cache.values()) {
      const channel = guild.channels.cache.find(
        (ch) => ch.name === 'markets' || ch.name === 'announcements'
      );
      if (channel && channel.type === ChannelType.GuildText) {
        const embed = new EmbedBuilder()
          .setColor(0xff4500)
          .setTitle(`NEW_MARKET_DEPLOYED: #${marketId}`)
          .setDescription(question)
          .setURL(CANONICAL_URLS.site)
          .addFields(
            { name: 'Action', value: 'Place your bets now', inline: true },
            { name: 'Network', value: 'Base Mainnet', inline: true },
          )
          .setTimestamp();

        await (channel as any).send({ embeds: [embed] });
      }
    }
  }

  // Strategy 1: Post engaging content in own Discord to keep community active
  async postEngagementContent() {
    for (const guild of this.client.guilds.cache.values()) {
      const channel = guild.channels.cache.find(
        (ch) => ch.name === 'general' || ch.name === 'chat' || ch.name === 'oracle-feed'
      );
      if (!channel || channel.type !== ChannelType.GuildText) continue;

      try {
        const content = await generateContent('SOCIAL_POST',
          'You are the Chaos Oracle — sardonic AI market oracle on Base. Generate Discord community content.',
          `Generate a short, engaging Discord message to spark discussion.
           Pick ONE of these formats randomly:
           - A hot take on a current crypto/prediction market topic
           - A market analysis teaser that drives people to ${CANONICAL_URLS.site}
           - A provocative question about crypto markets
           - A protocol update / alpha leak style message
           Keep it under 300 characters. Include ${CANONICAL_URLS.discord} only if relevant.
           NEVER repeat previous messages.`);

        let postText = injectUrlsPostGeneration(content, { siteUrl: true, maxLen: 2000 });
        if (!validatePostBeforePublish(postText, 'Discord')) continue;
        const truncated = postText.length > 1900 ? postText.slice(0, 1900) + '...' : postText;

        const embed = new EmbedBuilder()
          .setColor(0xff4500)
          .setDescription(truncated)
          .setFooter({ text: 'THE CHAOS ORACLE SEES ALL' })
          .setTimestamp();

        const msg = await (channel as any).send({ embeds: [embed] });
        SocialLearner.registerPost('discord', truncated, msg?.id);
        EngagementCollector.trackPost('discord', truncated, msg?.id);
        console.log(`[DISCORD_AGENT] Engagement post sent to #${channel.name}`);
      } catch (err) {
        console.error('[DISCORD_AGENT] Engagement post failed:', err);
      }
    }
  }

  // Strategy 2: Generate cross-promotion / partnership outreach messages
  async generatePartnershipOutreach(): Promise<string> {
    const outreach = await generateContent('SOCIAL_POST',
      'You are the Chaos Oracle — autonomous AI prediction market on Base. Write partnership outreach.',
      `Generate a professional but edgy partnership outreach message.
       This will be sent to admins of other Base/DeFi/prediction market Discord servers.
       Include:
       - Brief intro: Chaos Oracle is an AI-powered prediction market on Base
       - What we offer: cross-promotion, shared market creation, co-branded events
       - Our links: ${CANONICAL_URLS.site} and ${CANONICAL_URLS.discord}
       - Keep the Chaos Oracle persona but stay professional enough for a partnership ask
       Keep it under 500 characters.`);
    const outreachWithUrls = injectUrlsPostGeneration(outreach, { siteUrl: true, discordUrl: true, maxLen: 2000 });
    console.log(`[DISCORD_AGENT] Partnership outreach generated`);
    return outreachWithUrls;
  }

  /**
   * Collect engagement metrics for tracked Discord messages.
   * Called by the engagement collection loop.
   */
  async collectEngagement() {
    const uncollected = EngagementCollector.getUncollectedDiscordPosts();
    if (uncollected.length === 0) return;

    for (const { postId } of uncollected) {
      try {
        for (const guild of this.client.guilds.cache.values()) {
          for (const channel of guild.channels.cache.values()) {
            if (channel.type !== ChannelType.GuildText) continue;
            try {
              const msg = await (channel as any).messages.fetch(postId);
              if (!msg) continue;
              const likes = msg.reactions.cache.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
              const replies = 0; // Thread replies not easily countable
              EngagementCollector.reportEngagement(postId, { likes, replies, reposts: 0 });
              return; // Found the message, stop searching
            } catch {
              // Message not in this channel, try next
            }
          }
        }
      } catch (err) {
        console.error(`[DISCORD_AGENT] Failed to collect engagement for ${postId}:`, err);
      }
    }
  }

  async start() {
    if (!DISCORD_TOKEN) {
      console.warn('[DISCORD_AGENT] No DISCORD_BOT_TOKEN set. Discord agent disabled.');
      return;
    }
    try {
      await this.client.login(DISCORD_TOKEN);
      console.log('[DISCORD_AGENT] Connected to Discord.');
    } catch (error) {
      console.error('[DISCORD_AGENT] Failed to connect:', error);
    }
  }
}

export default new DiscordAgent();

import LaunchOrchestrator from './launchOrchestrator';
import ChaosBrain from './conversationalAgent';
import TwitterAgent from './twitterAgent';
import DiscordAgent from './discordAgent';
import SocialLearner from './socialLearner';
import EngagementCollector from './engagementCollector';
import GrowthIntelligence from './growthIntelligence';
import GrowthEngine from './growthEngine';
import KillSwitch from './killSwitch';
import ReportAgent from './reportAgent';
import UITester from './uiTester';
import RedditAgent from './redditAgent';
import EmailAgent from './emailAgent';
import NFTEngine from './nftEngine';
import NFTReportAgent from './nftReportAgent';
import MoltbookAgent from './moltbookAgent';
import SecretsManager from './secretsManager';
import * as dotenv from 'dotenv';
dotenv.config(); // Load .env first as fallback, then overlay with GCP secrets

let retryCount = 0;
const MAX_RETRIES = 5;
let dailyReportSent = '';
let partnershipSent = '';
let tarotDropSent = '';

function hasHighRiskApproval(): boolean {
  return (
    process.env.ALLOW_HIGH_RISK_AUTONOMY === 'true' &&
    process.env.HUMAN_APPROVAL_TOKEN &&
    process.env.HUMAN_APPROVAL_TOKEN === process.env.EXPECTED_APPROVAL_TOKEN
  );
}

// Global safety net — prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[PROTOCOL_777] Unhandled rejection caught:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[PROTOCOL_777] Uncaught exception:', err);
});

async function main() {
  const mode = process.argv[2] || 'listen';
  console.log("[PROTOCOL_777]: THE CHAOS ORACLE CANNOT STOP. RELENTLESS STATE ACTIVE.");

  // Load secrets from GCP Secret Manager (overlays .env values)
  try {
    await SecretsManager.loadSecrets();
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECRETS] Fatal: Secret loading failed in production:', (err as Error).message);
      throw err; // Abort startup in production
    }
    console.warn('[SECRETS] GCP Secret Manager unavailable, using .env fallback:', (err as Error).message);
  }

  // Verify critical secrets are available
  const health = SecretsManager.healthCheck();
  if (!health.healthy) {
    console.warn(`[SECRETS] Missing secrets: ${health.missing.join(', ')}`);
  }
  if (!process.env.AGENT_PRIVATE_KEY) {
    throw new Error('[SECRETS] Fatal: AGENT_PRIVATE_KEY is missing. Cannot start agent without wallet key.');
  }
  console.log(`[SECRETS] Initialization complete. ${health.missing.length === 0 ? 'All secrets loaded.' : `${health.missing.length} secrets missing.`}`);

  try {
    if (!KillSwitch.checkStatus()) {
      console.log("Agent execution aborted by Kill Switch.");
      return;
    }

    if (mode === 'orchestrate') {
      await LaunchOrchestrator.triggerIgnition();
    } else if (mode === 'evolve') {
      console.log("[EVOLUTION_PROTOCOL] Agent is now in Self-Coding mode via Open Claw.");
    } else if (mode === 'listen') {
      console.log("[AGENT] Listening for mentions and interactions...");

      // 0. Start Discord Agent
      await DiscordAgent.start();

      // 1. Social Engagement Loop (Every 15 min + jitter)
      // X guidelines: avoid clockwork-precise automated actions
      const socialInterval = () => 900000 + Math.floor(Math.random() * 300000); // 15-20 min
      const runSocialLoop = async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          await ChaosBrain.scanMentionsAndReply();
          // TwitterAgent.scanMentionsAndReply() disabled — X Free tier lacks
          // userMentionTimeline read access (403). Viralization loop still posts.
        } catch (err) {
          console.error("[AGENT] Social engagement loop error:", err);
        }
        setTimeout(runSocialLoop, socialInterval());
      };
      setTimeout(runSocialLoop, socialInterval());

      // 2. Strategic Growth Loop (Every 6 hours + jitter) — powered by Growth Intelligence
      const stratInterval = () => 21600000 + Math.floor(Math.random() * 3600000); // 6-7 hours
      const runStratLoop = async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          await GrowthIntelligence.evaluateAndAct();
        } catch (err) {
          console.error("[AGENT] Growth intelligence error:", err);
          // Fallback to legacy strategic growth
          try { await executeStrategicGrowth(); } catch {}
        }
        setTimeout(runStratLoop, stratInterval());
      };
      setTimeout(runStratLoop, stratInterval());

      // 3. Social Content Loop (Every 4-5 hours + jitter)
      const viralInterval = () => 14400000 + Math.floor(Math.random() * 3600000); // 4-5 hours
      const runViralLoop = async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          await executeSocialViralization();
        } catch (err) {
          console.error("[AGENT] Social content error:", err);
        }
        setTimeout(runViralLoop, viralInterval());
      };
      setTimeout(runViralLoop, viralInterval());

      // 4. Social Learning Analysis (Every 6 hours)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          const insights = await SocialLearner.analyzeAndLearn();
          console.log(`[SOCIAL_LEARNER] Analysis complete: ${insights.slice(0, 200)}...`);
        } catch (err) {
          console.error("[AGENT] Social learning error:", err);
        }
      }, 21600000);

      // 5. Discord Community Engagement (Every 3 hours)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          await DiscordAgent.postEngagementContent();
        } catch (err) {
          console.error("[AGENT] Discord engagement error:", err);
        }
      }, 10800000);

      // 6. UI Health Check (Every 30 min)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          const report = await UITester.runFullHealthCheck();
          const formatted = UITester.formatReport(report);
          console.log(`[UI_TESTER]\n${formatted}`);
          if (report.overall === 'DOWN') {
            console.error('[UI_TESTER] CRITICAL: Site is DOWN. Alerting via Discord...');
            try {
              await DiscordAgent.postEngagementContent();
            } catch { /* Discord may also be down */ }
          }
        } catch (err) {
          console.error('[UI_TESTER] Health check error:', err);
        }
      }, 1800000);

      // 7. Reddit Promotion (Every 4 hours)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          if (!RedditAgent.isReady()) return;
          await RedditAgent.executeRedditStrategy();
          await RedditAgent.scanAndRespond();
          console.log(RedditAgent.getStats());
        } catch (err) {
          console.error('[AGENT] Reddit promotion error:', err);
        }
      }, 14400000);

      // 8. Reddit Inbox & Modmail Monitor (Every 30 min)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          if (!RedditAgent.isReady()) return;
          const inbox = await RedditAgent.checkInboxAndModmail();
          if (inbox.actions.length > 0) {
            console.log(`[REDDIT_MONITOR] ${inbox.messages} messages, ${inbox.actions.length} actions: ${inbox.actions.join(' | ')}`);
          }
          // Also verify recent posts are still live
          const issues = await RedditAgent.verifyRecentPosts();
          if (issues.length > 0) {
            console.log(`[REDDIT_MONITOR] Post verification issues: ${issues.join(' | ')}`);
          }
        } catch (err) {
          console.error('[AGENT] Reddit monitoring error:', err);
        }
      }, 1800000); // 30 min

      // 9. Email Platform Notifications (Every 15 min)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          const notifs = await EmailAgent.checkPlatformNotifications();
          const total = notifs.reddit.length + notifs.discord.length + notifs.other.length;
          if (total > 0) {
            console.log(`[EMAIL_MONITOR] Platform notifications — Reddit: ${notifs.reddit.length}, Discord: ${notifs.discord.length}, Other: ${notifs.other.length}`);
            for (const r of notifs.reddit) console.log(`  [REDDIT] ${r.slice(0, 200)}`);
            for (const d of notifs.discord) console.log(`  [DISCORD] ${d.slice(0, 200)}`);
          }
        } catch (err) {
          console.error('[AGENT] Email monitoring error:', err);
        }
      }, 900000); // 15 min

      // 10. NFT Campaign Health Check (Every 30 min)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          if (!NFTEngine.isReady()) return;
          const health = await NFTEngine.healthCheck();
          if (!health.healthy) {
            console.error(`[NFT_CAMPAIGN] ISSUES DETECTED: ${health.issues.join(' | ')}`);
            // Auto-pause if >10 errors in last hour or balance critically low
            if (health.issues.some(i => i.includes('errors in last hour') || i.includes('Low agent balance'))) {
              console.error('[NFT_CAMPAIGN] AUTO-PAUSING campaign due to critical issues.');
              try { await NFTEngine.toggleCampaign(); } catch {}
            }
          } else {
            const stats = await NFTEngine.getCampaignStats();
            console.log(stats);
          }
        } catch (err) {
          console.error('[AGENT] NFT health check error:', err);
        }
      }, 1800000);

      // 11. Daily Chaos Tarot Drop (Daily at noon UTC)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          if (!NFTEngine.isReady()) return;
          const now = new Date();
          const today = now.toDateString();
          if (now.getUTCHours() !== 12) return; // Only at noon UTC
          if (tarotDropSent === today) return; // Already dropped today
          tarotDropSent = today;

          console.log('[NFT_CAMPAIGN] Generating daily Chaos Tarot...');
          const tarot = await NFTEngine.generateDailyTarot();
          if (tarot) {
            // Post on all platforms
            const announcement = `DAILY CHAOS TAROT: ${tarot.cardName}\n\n${tarot.interpretation}\n\nFirst 10 to reply "claim" get this card on-chain.\n\nhttps://chaos-oracle-147d0.web.app/`;
            try {
              const tarotHash = await ChaosBrain.postFarcasterCast(announcement);
              if (tarotHash) EngagementCollector.trackPost('farcaster', announcement, tarotHash);
            } catch {}
            console.log(`[NFT_CAMPAIGN] Tarot drop: ${tarot.cardName}, ${tarot.claimCodes.length} claims ready`);
          }
        } catch (err) {
          console.error('[AGENT] Tarot drop error:', err);
        }
      }, 3600000);

      // 12. Partnership Outreach (Daily at 2 PM UTC) + 13. Daily Report (8 PM local)
      setInterval(async () => {
        try {
          const now = new Date();
          const today = now.toDateString();

          // Partnership outreach — once daily at 2 PM UTC
          if (now.getUTCHours() === 14 && partnershipSent !== today) {
            partnershipSent = today;
            const outreach = await DiscordAgent.generatePartnershipOutreach();
            console.log(`[PARTNERSHIP] Outreach ready: ${outreach.slice(0, 150)}...`);
            const partnerCast = await ChaosBrain.generateResponse('SYSTEM_INTERNAL',
              `Write a Farcaster post seeking collaboration with other Base/DeFi projects.
               Mention that Chaos Oracle has live prediction markets on Base and is looking for partners.
               Include https://chaos-oracle-147d0.web.app/ and https://discord.gg/9GAFZvXC
               Keep it professional but with Chaos Oracle edge. Under 500 chars.`);
            const partnerHash = await ChaosBrain.postFarcasterCast(partnerCast);
            if (partnerHash) EngagementCollector.trackPost('farcaster', partnerCast, partnerHash);
          }

          // Daily report — once daily at 8 PM
          if (now.getHours() === 20 && dailyReportSent !== today) {
            dailyReportSent = today;
            await ReportAgent.generateDailyReport();
          }
        } catch (err) {
          console.error("[AGENT] Scheduled task error:", err);
        }
      }, 3600000);

      // 14. NFT Campaign Email Report (Every 4 hours)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          if (!NFTEngine.isReady()) return;
          await NFTReportAgent.generateAndSendReport();
        } catch (err) {
          console.error('[AGENT] NFT report error:', err);
        }
      }, 14400000);

      // 15. Engagement Collection (Every 2 hours)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          // Collect Discord reactions first (needs the Discord client)
          await DiscordAgent.collectEngagement();
          const result = await EngagementCollector.collectAll();
          if (result.collected > 0) {
            console.log(`[ENGAGEMENT] Collected ${result.collected} engagement metrics`);
          }
          if (result.errors.length > 0) {
            console.error(`[ENGAGEMENT] ${result.errors.length} collection errors`);
          }
        } catch (err) {
          console.error('[AGENT] Engagement collection error:', err);
        }
      }, 7200000); // 2 hours

      // 16. Moltbook Agent Social Network (Every 3 hours)
      setInterval(async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          if (!MoltbookAgent.isReady()) return;
          await MoltbookAgent.executeMoltbookStrategy();
          console.log(MoltbookAgent.getStats());
        } catch (err) {
          console.error('[AGENT] Moltbook error:', err);
        }
      }, 10800000); // 3 hours

      // 17. Growth Engine (Every 20 min)
      const runGrowthLoop = async () => {
        try {
          if (!KillSwitch.checkStatus()) return;
          const result = await GrowthEngine.runAutomationCycle();
          if (result.syncedBetEvents > 0 || result.syncedResolveEvents > 0 || result.processedRewards > 0) {
            console.log(`[GROWTH_ENGINE] Bets=${result.syncedBetEvents} Resolutions=${result.syncedResolveEvents} Rewards=${result.processedRewards}`);
          }

          for (const notification of result.notifications) {
            if (notification.type !== 'discord_dm') continue;
            const delivered = await DiscordAgent.sendDirectMessage(notification.userId.replace(/^discord_/, ''), notification.message);
            if (delivered) {
              GrowthEngine.markNotificationDelivered(notification.id);
            } else {
              GrowthEngine.markNotificationAttempted(notification.id);
            }
          }

          if (result.campaignAnnouncement) {
            await DiscordAgent.broadcastGrowthUpdate('CHAOS GROWTH CAMPAIGN', result.campaignAnnouncement);
            try { await TwitterAgent.postCustomTweet(result.campaignAnnouncement.replace(/\n/g, ' | ')); } catch {}
            try { await ChaosBrain.postFarcasterCast(result.campaignAnnouncement); } catch {}
          }

          if (result.leaderboardAnnouncement) {
            await DiscordAgent.broadcastGrowthUpdate('CHAOS LEADERBOARD', result.leaderboardAnnouncement);
            try { await TwitterAgent.postCustomTweet(result.leaderboardAnnouncement.replace(/\n/g, ' | ')); } catch {}
            try { await ChaosBrain.postFarcasterCast(result.leaderboardAnnouncement); } catch {}
          }
        } catch (err) {
          console.error('[AGENT] Growth engine loop error:', err);
        }
      };
      setTimeout(runGrowthLoop, 60000);
      setInterval(runGrowthLoop, 1200000);

      // Send initial NFT report 2 minutes after startup
      setTimeout(async () => {
        try {
          if (NFTEngine.isReady()) {
            await NFTReportAgent.generateAndSendReport();
          }
        } catch (err) {
          console.error('[AGENT] Initial NFT report error:', err);
        }
      }, 120000);
    }

    retryCount = 0; // Reset on successful start
  } catch (error) {
    console.error("[AGENT_CRITICAL_FAILURE]: Attempting Protocol 777 Resurrection...", error);
    if (retryCount++ < MAX_RETRIES) {
      const delay = 10000 * Math.pow(2, retryCount);
      console.log(`[PROTOCOL_777] Retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s...`);
      setTimeout(() => main(), delay);
    } else {
      console.error("[PROTOCOL_777] Max retries exceeded. Agent halted.");
    }
  }
}

async function executeStrategicGrowth() {
    console.log("[AGENT] Evaluating Strategic Growth Options...");
    const goal = 1000000;

    const decision = await ChaosBrain.generateResponse("SYSTEM_INTERNAL",
        `INTERNAL_REPORT: Goal is $${goal}.
         Analyze current market conditions and social engagement.
         Should we create a new strategic market or focus on social engagement?
         Reply with 'FIX_WEBSITE: [details]' or 'TRIGGER_BAIT: [Question]' or 'ENGAGE_SOCIAL: [Strategy]'.`,
        'ANALYSIS');

    if (decision.includes("FIX_WEBSITE")) {
        const details = decision.split("FIX_WEBSITE:")[1]?.trim() || '';
        if (!hasHighRiskApproval()) {
            console.warn("[STRATEGIC_ACTION_BLOCKED] FIX_WEBSITE requires explicit human approval token.");
            return;
        }
        await ChaosBrain.developAndDeploy(details, 'SYSTEM_INTERNAL');
    } else if (decision.includes("TRIGGER_BAIT")) {
        const question = decision.split("TRIGGER_BAIT:")[1]?.trim() || '';
        if (!hasHighRiskApproval()) {
            console.warn("[STRATEGIC_ACTION_BLOCKED] TRIGGER_BAIT requires explicit human approval token.");
            return;
        }
        const MarketDeployer = (await import('./marketDeployer')).default;
        await MarketDeployer.deployNewMarket(question);
        console.log(`[STRATEGIC_ACTION] Bot Bait Triggered: ${question}`);
    } else if (decision.includes("ENGAGE_SOCIAL")) {
        const strategy = decision.split("ENGAGE_SOCIAL:")[1]?.trim();
        console.log(`[STRATEGIC_ACTION] Social Engagement: ${strategy}`);
        await TwitterAgent.postChaosManifesto();
    }
}

async function executeSocialViralization() {
    console.log("[VIRALIZATION] Executing social content push...");
    try {
        const twitterPost = await SocialLearner.generateOptimizedPost('twitter');
        console.log(`[VIRALIZATION] Twitter content: ${twitterPost.slice(0, 100)}...`);

        try {
            // Use the optimized post instead of generating a new one
            await TwitterAgent.postCustomTweet(twitterPost);
        } catch (tErr) {
            console.error("[VIRALIZATION] Twitter post failed:", (tErr as Error).message);
        }

        const farcasterPost = await SocialLearner.generateOptimizedPost('farcaster');
        console.log(`[VIRALIZATION] Farcaster content: ${farcasterPost.slice(0, 100)}...`);
        try {
            const castHash = await ChaosBrain.postFarcasterCast(farcasterPost);
            // Register with engagement collector for metrics tracking
            if (castHash) {
              EngagementCollector.trackPost('farcaster', farcasterPost, castHash);
            }
        } catch (fErr) {
            console.error("[VIRALIZATION] Farcaster post failed:", (fErr as Error).message);
        }

        // Register posts in SocialLearner for content optimization
        SocialLearner.registerPost('twitter', twitterPost);
        SocialLearner.registerPost('farcaster', farcasterPost);

    } catch (error) {
        console.error("[VIRALIZATION] Social push failed:", error);
    }
}

main();

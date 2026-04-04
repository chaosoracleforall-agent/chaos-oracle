import * as fs from 'fs';
import * as path from 'path';

export interface TwitterDiagnosticsSnapshot {
  dailyTweets: number;
  repliesSent: number;
  validationWarnings: number;
  dailyLikes: number;
  dailyQuotes: number;
  searchesRun: number;
  lastContext: string | null;
  lastTweetLength: number;
  lastUrls: string[];
  lastWarnings: string[];
  lastUpdated: string | null;
}

export interface DiscordDiagnosticsSnapshot {
  dmReceived: number;
  monitoredMessages: number;
  repliesSent: number;
  skippedCooldown: number;
  skippedUnmonitored: number;
  skippedNotRelevant: number;
  intentsHealthy: boolean | null;
  missingIntents: string[];
  guildAudits: Array<{ guild: string; monitored: number; accessible: number; missing: string[] }>;
  lastUpdated: string | null;
}

export interface SocialDiagnosticsState {
  twitter: TwitterDiagnosticsSnapshot;
  discord: DiscordDiagnosticsSnapshot;
}

export interface SocialDiagnosticsHistoryEntry {
  timestamp: string;
  source: 'twitter' | 'discord' | 'system';
  action: 'update' | 'reset';
  changedFields: string[];
  summary: string;
}

const STATE_FILE = path.join(__dirname, 'social_diagnostics.json');
const HISTORY_FILE = path.join(__dirname, 'social_diagnostics_history.jsonl');
const MAX_HISTORY_ENTRIES = 500;

function createDefaultState(): SocialDiagnosticsState {
  return {
    twitter: {
      dailyTweets: 0,
      repliesSent: 0,
      validationWarnings: 0,
      dailyLikes: 0,
      dailyQuotes: 0,
      searchesRun: 0,
      lastContext: null,
      lastTweetLength: 0,
      lastUrls: [],
      lastWarnings: [],
      lastUpdated: null,
    },
    discord: {
      dmReceived: 0,
      monitoredMessages: 0,
      repliesSent: 0,
      skippedCooldown: 0,
      skippedUnmonitored: 0,
      skippedNotRelevant: 0,
      intentsHealthy: null,
      missingIntents: [],
      guildAudits: [],
      lastUpdated: null,
    },
  };
}

export function readSocialDiagnostics(): SocialDiagnosticsState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return {
        ...createDefaultState(),
        ...parsed,
        twitter: { ...createDefaultState().twitter, ...(parsed.twitter || {}) },
        discord: { ...createDefaultState().discord, ...(parsed.discord || {}) },
      };
    }
  } catch (err: any) {
    console.error('[SOCIAL_DIAG] Failed to read state:', err.message);
  }
  return createDefaultState();
}

export function writeSocialDiagnostics(state: SocialDiagnosticsState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function stripTimestamps<T extends { lastUpdated: string | null }>(snapshot: T): Omit<T, 'lastUpdated'> {
  const { lastUpdated: _lastUpdated, ...rest } = snapshot;
  return rest;
}

function changedKeys<T extends Record<string, any>>(previous: T, next: T): string[] {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return Array.from(keys).filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]));
}

function appendHistoryEntry(entry: SocialDiagnosticsHistoryEntry): void {
  let existing: string[] = [];
  if (fs.existsSync(HISTORY_FILE)) {
    existing = fs.readFileSync(HISTORY_FILE, 'utf8')
      .split('\n')
      .filter(Boolean);
  }

  existing.push(JSON.stringify(entry));
  if (existing.length > MAX_HISTORY_ENTRIES) {
    existing = existing.slice(-MAX_HISTORY_ENTRIES);
  }

  fs.writeFileSync(HISTORY_FILE, `${existing.join('\n')}\n`);
}

function recordHistory(
  source: SocialDiagnosticsHistoryEntry['source'],
  action: SocialDiagnosticsHistoryEntry['action'],
  previous: Record<string, any>,
  next: Record<string, any>,
): void {
  const fields = changedKeys(previous, next);
  if (fields.length === 0) return;

  const summary = fields.map((field) => {
    const value = next[field];
    if (Array.isArray(value)) {
      return `${field}=${value.length}`;
    }
    if (value && typeof value === 'object') {
      return `${field}=object`;
    }
    return `${field}=${String(value)}`;
  }).join(', ');

  appendHistoryEntry({
    timestamp: new Date().toISOString(),
    source,
    action,
    changedFields: fields,
    summary,
  });
}

export function resetSocialDiagnostics(): SocialDiagnosticsState {
  const previous = readSocialDiagnostics();
  const state = createDefaultState();
  writeSocialDiagnostics(state);
  recordHistory('system', 'reset', previous, state);
  return state;
}

export function updateTwitterDiagnostics(patch: Partial<TwitterDiagnosticsSnapshot>): TwitterDiagnosticsSnapshot {
  const state = readSocialDiagnostics();
  const previous = stripTimestamps(state.twitter);
  const next = {
    ...state.twitter,
    ...patch,
    lastUpdated: new Date().toISOString(),
  };
  state.twitter = next;
  writeSocialDiagnostics(state);
  recordHistory('twitter', 'update', previous, stripTimestamps(next));
  return next;
}

export function updateDiscordDiagnostics(patch: Partial<DiscordDiagnosticsSnapshot>): DiscordDiagnosticsSnapshot {
  const state = readSocialDiagnostics();
  const previous = stripTimestamps(state.discord);
  const next = {
    ...state.discord,
    ...patch,
    lastUpdated: new Date().toISOString(),
  };
  state.discord = next;
  writeSocialDiagnostics(state);
  recordHistory('discord', 'update', previous, stripTimestamps(next));
  return next;
}

export function readSocialDiagnosticsHistory(limit: number = 25): SocialDiagnosticsHistoryEntry[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const lines = fs.readFileSync(HISTORY_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .slice(-Math.max(1, limit));
    return lines.map((line) => JSON.parse(line));
  } catch (err: any) {
    console.error('[SOCIAL_DIAG] Failed to read history:', err.message);
    return [];
  }
}

export function formatSocialDiagnosticsHistory(entries: SocialDiagnosticsHistoryEntry[]): string {
  if (entries.length === 0) {
    return '[SOCIAL_DIAG_HISTORY]\nNo history entries yet.';
  }

  return [
    '[SOCIAL_DIAG_HISTORY]',
    ...entries.map((entry) =>
      `${entry.timestamp} ${entry.source}/${entry.action} fields=${entry.changedFields.join(', ') || 'none'} :: ${entry.summary}`
    ),
  ].join('\n');
}

export function formatSocialDiagnostics(state: SocialDiagnosticsState, verbose: boolean = false): string {
  const twitter = state.twitter;
  const discord = state.discord;
  const twitterWarnings = twitter.lastWarnings.length > 0 ? twitter.lastWarnings.join(' | ') : 'none';
  const guildSummary = discord.guildAudits.length > 0
    ? discord.guildAudits.map((audit) => `${audit.guild}: ${audit.accessible}/${audit.monitored}`).join('; ')
    : 'none';

  const lines = [
    '[SOCIAL_DIAG]',
    `Twitter daily=${twitter.dailyTweets} replies=${twitter.repliesSent} warnings=${twitter.validationWarnings}`,
    `Twitter engagement: likes=${twitter.dailyLikes} quotes=${twitter.dailyQuotes} searches=${twitter.searchesRun}`,
    `Twitter last=${twitter.lastContext || 'none'} len=${twitter.lastTweetLength} urls=${twitter.lastUrls.join(', ') || 'none'}`,
    `Twitter warning detail=${twitterWarnings}`,
    `Discord dm=${discord.dmReceived} monitored=${discord.monitoredMessages} replies=${discord.repliesSent}`,
    `Discord cooldown=${discord.skippedCooldown} unmonitored=${discord.skippedUnmonitored} irrelevant=${discord.skippedNotRelevant}`,
    `Discord intents=${discord.intentsHealthy === null ? 'unknown' : discord.intentsHealthy ? 'healthy' : 'missing'} missing=${discord.missingIntents.join(', ') || 'none'}`,
    `Discord guild access=${guildSummary}`,
    `Updated twitter=${twitter.lastUpdated || 'never'} discord=${discord.lastUpdated || 'never'}`,
  ];

  if (verbose) {
    lines.push(
      `Twitter last warnings verbose=${twitter.lastWarnings.join(' || ') || 'none'}`,
      `Discord guild audits verbose=${discord.guildAudits.length > 0 ? discord.guildAudits.map((audit) => `${audit.guild}[missing=${audit.missing.join(', ') || 'none'}]`).join('; ') : 'none'}`
    );
  }

  return lines.join('\n');
}

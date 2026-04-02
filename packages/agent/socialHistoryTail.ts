import * as fs from 'fs';
import * as path from 'path';
import { formatSocialDiagnosticsHistory, readSocialDiagnosticsHistory, SocialDiagnosticsHistoryEntry } from './socialDiagnostics';

const HISTORY_FILE = path.join(__dirname, 'social_diagnostics_history.jsonl');

function entryKey(entry: SocialDiagnosticsHistoryEntry): string {
  return `${entry.timestamp}|${entry.source}|${entry.action}|${entry.summary}`;
}

function readAllEntries(): SocialDiagnosticsHistoryEntry[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    return fs.readFileSync(HISTORY_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (err: any) {
    console.error('[SOCIAL_DIAG_TAIL] Failed to read history file:', err.message);
    return [];
  }
}

function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const intervalArg = process.argv.find((arg) => arg.startsWith('--interval='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 10;
  const intervalMs = intervalArg ? Number(intervalArg.split('=')[1]) : 2000;
  const effectiveLimit = Number.isFinite(limit) ? limit : 10;
  const effectiveInterval = Number.isFinite(intervalMs) ? intervalMs : 2000;

  const initialEntries = readSocialDiagnosticsHistory(effectiveLimit);
  console.log(formatSocialDiagnosticsHistory(initialEntries));
  console.log(`[SOCIAL_DIAG_TAIL] Watching ${HISTORY_FILE} every ${effectiveInterval}ms`);

  const seen = new Set(initialEntries.map(entryKey));

  setInterval(() => {
    const entries = readAllEntries();
    for (const entry of entries) {
      const key = entryKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`${entry.timestamp} ${entry.source}/${entry.action} fields=${entry.changedFields.join(', ') || 'none'} :: ${entry.summary}`);
    }
  }, effectiveInterval);
}

main();

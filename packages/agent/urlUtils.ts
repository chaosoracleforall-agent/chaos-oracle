/**
 * Shared URL utilities for all social agents.
 * Single source of truth for canonical URLs and validation.
 */

// ============ CANONICAL URLS (Single Source of Truth) ============
export const CANONICAL_URLS = {
  site: 'https://chaos-oracle-147d0.web.app/',
  discord: 'https://discord.gg/9GAFZvXC',
  twitter: 'https://x.com/ChaosOracle4all',
  farcaster: 'https://warpcast.com/chaosmachine',
  github: 'https://github.com/chaosoracleforall-agent/chaos-oracle',
} as const;

const URL_REGEX = /https?:\/\/[^\s]+/gi;

// Broken URL detection patterns
const BROKEN_URL_PATTERNS = [
  /chaos-oracle-147d0\.web\.app?(?![/p])/i,
  /chaos-oracle-147d0\.web\.(?!app)/i,
  /discord\.gg\/9GAFZvX(?!C)/i,
  /\.web\.app\/\//,
];

/**
 * Repair all known URLs in text to their canonical form.
 * Catches truncated domains, broken invites, double slashes, and duplicates.
 */
export function repairAllUrls(text: string): string {
  let result = text;

  // 1. Catch any chaos-oracle domain variant and replace with canonical
  result = result.replace(
    /(?:https?:\/\/)?chaos-oracle-147d0\.web\.app[^\s)}\]]*(?:\/[^\s)}\]]*)*/gi,
    CANONICAL_URLS.site
  );

  // 2. Catch truncated domain (e.g. "chaos-oracle-147d0.web.ap")
  result = result.replace(
    /(?:https?:\/\/)?chaos-oracle-147d0\.web\.[a-z]*/gi,
    CANONICAL_URLS.site
  );

  // 3. Normalize discord invites
  result = result.replace(
    /(?:https?:\/\/)?discord\.gg\/[A-Za-z0-9]+/gi,
    CANONICAL_URLS.discord
  );

  // 4. Collapse duplicate adjacent URLs
  const siteEscaped = CANONICAL_URLS.site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const discordEscaped = CANONICAL_URLS.discord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  result = result.replace(new RegExp(`(${siteEscaped})\\s*\\1`, 'g'), CANONICAL_URLS.site);
  result = result.replace(new RegExp(`(${discordEscaped})\\s*\\1`, 'g'), CANONICAL_URLS.discord);

  // 5. Fix double slashes (except in protocol)
  result = result.replace(/([^:])\/\//g, '$1/');

  return result;
}

/**
 * Detect broken URLs in text. Returns list of issues found.
 * Empty array means all URLs are valid.
 */
export function detectBrokenUrls(text: string): string[] {
  const issues: string[] = [];

  for (const pattern of BROKEN_URL_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(`broken URL pattern: ${pattern}`);
    }
  }

  // Check for site URL without trailing slash
  if (/chaos-oracle-147d0\.web\.app(?!\/)/i.test(text)) {
    issues.push('site URL missing trailing slash');
  }

  // Check for non-canonical chaos-oracle URLs
  const allUrls = text.match(URL_REGEX) || [];
  for (const url of allUrls) {
    const cleaned = url.replace(/[)\],.!?;:]+$/g, '');
    if (
      cleaned !== CANONICAL_URLS.site &&
      cleaned !== CANONICAL_URLS.discord &&
      !cleaned.startsWith(CANONICAL_URLS.site) &&
      /chaos-oracle/i.test(cleaned)
    ) {
      issues.push(`non-canonical site URL: ${cleaned}`);
    }
  }

  return issues;
}

/**
 * Sanitize post text: normalize whitespace, repair URLs, enforce character limit.
 * Never cuts through a URL boundary.
 */
export function sanitizePostText(text: string, maxLen: number): string {
  let normalized = text.replace(/\s+/g, ' ').trim();
  normalized = repairAllUrls(normalized);

  // Strip trailing punctuation glued to URLs
  normalized = normalized.replace(URL_REGEX, (url) => {
    const cleaned = url.replace(/[)\],.!?;:]+$/g, '');
    if (/chaos-oracle-147d0\.web\.app/i.test(cleaned)) return CANONICAL_URLS.site;
    if (/discord\.gg\/9GAFZvXC/i.test(cleaned)) return CANONICAL_URLS.discord;
    return cleaned;
  });

  if (normalized.length <= maxLen) return normalized;

  // Truncation: never cut through a URL
  const matches = [...normalized.matchAll(new RegExp(URL_REGEX.source, 'gi'))];
  let cutIndex = maxLen;
  const overlapping = matches.find((m) => {
    const start = m.index ?? -1;
    const end = start + m[0].length;
    return start >= 0 && start < cutIndex && cutIndex < end;
  });
  if (overlapping?.index !== undefined) cutIndex = overlapping.index;

  let trimmed = normalized.slice(0, cutIndex).trim();
  trimmed = trimmed.replace(/[\s,.;:!?-]+$/g, '').trim();
  return trimmed || normalized.slice(0, maxLen).trim();
}

/**
 * Inject canonical URLs after LLM generation.
 * Checks if text already has valid URLs; if not, appends them within the character limit.
 */
export function injectUrlsPostGeneration(
  text: string,
  opts: { siteUrl?: boolean; discordUrl?: boolean; maxLen: number }
): string {
  let result = repairAllUrls(text);

  const hasSiteUrl = result.includes(CANONICAL_URLS.site);
  const hasDiscordUrl = result.includes(CANONICAL_URLS.discord);

  // Append site URL if requested and not already present
  if (opts.siteUrl && !hasSiteUrl) {
    const urlLine = `\n${CANONICAL_URLS.site}`;
    if (result.length + urlLine.length <= opts.maxLen) {
      result += urlLine;
    }
  }

  // Append discord URL if requested and not already present
  if (opts.discordUrl && !hasDiscordUrl) {
    const urlLine = `\n${CANONICAL_URLS.discord}`;
    if (result.length + urlLine.length <= opts.maxLen) {
      result += urlLine;
    }
  }

  return result;
}

/**
 * Full validation gate — returns true if post is safe to publish.
 * Logs warnings if issues found.
 */
export function validatePostBeforePublish(text: string, platform: string): boolean {
  const issues = detectBrokenUrls(text);
  if (issues.length > 0) {
    console.error(`[URL_GUARD] Blocked ${platform} post — broken URLs detected:`, issues);
    return false;
  }
  return true;
}

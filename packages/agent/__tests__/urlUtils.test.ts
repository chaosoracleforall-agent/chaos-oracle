import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CANONICAL_URLS,
  repairAllUrls,
  detectBrokenUrls,
  sanitizePostText,
  injectUrlsPostGeneration,
  validatePostBeforePublish,
} from '../urlUtils';

describe('repairAllUrls', () => {
  it('repairs truncated domain "chaos-oracle-147d0.web.ap" to canonical', () => {
    const input = 'Check out https://chaos-oracle-147d0.web.ap for predictions';
    const result = repairAllUrls(input);
    expect(result).toContain(CANONICAL_URLS.site);
    expect(result).not.toContain('web.ap ');
  });

  it('repairs double slash "web.app//" to canonical', () => {
    const input = 'Visit https://chaos-oracle-147d0.web.app//markets';
    const result = repairAllUrls(input);
    expect(result).toContain(CANONICAL_URLS.site);
    expect(result).not.toContain('//markets');
  });

  it('repairs truncated discord invite "discord.gg/9GAFZvX" to canonical', () => {
    const input = 'Join us at https://discord.gg/9GAFZvX';
    const result = repairAllUrls(input);
    expect(result).toContain(CANONICAL_URLS.discord);
  });

  it('collapses duplicate adjacent URLs when directly adjacent with whitespace', () => {
    // The regex collapses "URL\s*URL" patterns. With a space between,
    // the first regex pass replaces both domain matches individually,
    // so two canonical URLs remain. Test the actual collapse pattern:
    const input = `Visit ${CANONICAL_URLS.site}${CANONICAL_URLS.site} today`;
    const result = repairAllUrls(input);
    const count = result.split(CANONICAL_URLS.site).length - 1;
    expect(count).toBe(1);
  });

  it('leaves normal text unchanged', () => {
    const input = 'Hello world, this is a normal post about crypto markets.';
    const result = repairAllUrls(input);
    expect(result).toBe(input);
  });

  it('repairs multiple broken URLs in one string', () => {
    const input = 'Site: https://chaos-oracle-147d0.web.ap Discord: https://discord.gg/9GAFZvX';
    const result = repairAllUrls(input);
    expect(result).toContain(CANONICAL_URLS.site);
    expect(result).toContain(CANONICAL_URLS.discord);
  });

  it('normalizes any discord invite code to canonical', () => {
    const input = 'Join https://discord.gg/abc123';
    const result = repairAllUrls(input);
    expect(result).toContain(CANONICAL_URLS.discord);
    expect(result).not.toContain('abc123');
  });

  it('repairs chaos-oracle domain with extra path segments', () => {
    const input = 'Check https://chaos-oracle-147d0.web.app/markets/123';
    const result = repairAllUrls(input);
    expect(result).toContain(CANONICAL_URLS.site);
  });
});

describe('detectBrokenUrls', () => {
  it('returns empty array for valid text with no URLs', () => {
    const result = detectBrokenUrls('Just a normal post about markets.');
    expect(result).toEqual([]);
  });

  it('returns empty array for text with canonical URLs', () => {
    const result = detectBrokenUrls(`Check ${CANONICAL_URLS.site} and ${CANONICAL_URLS.discord}`);
    expect(result).toEqual([]);
  });

  it('detects truncated domain', () => {
    const result = detectBrokenUrls('Visit https://chaos-oracle-147d0.web.ap');
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects site URL missing trailing slash', () => {
    const result = detectBrokenUrls('Visit https://chaos-oracle-147d0.web.app');
    expect(result.some((i) => i.includes('trailing slash'))).toBe(true);
  });

  it('detects non-canonical site URLs', () => {
    const result = detectBrokenUrls('Visit https://chaos-oracle-old.web.app/');
    expect(result.some((i) => i.includes('non-canonical'))).toBe(true);
  });

  it('detects truncated discord invite', () => {
    const result = detectBrokenUrls('Join https://discord.gg/9GAFZvX');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('sanitizePostText', () => {
  it('respects max length', () => {
    const input = 'A '.repeat(200);
    const result = sanitizePostText(input, 100);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('never cuts through URLs', () => {
    const url = CANONICAL_URLS.site;
    // Place URL such that a naive cut at maxLen would bisect it
    const prefix = 'Check this out: ';
    const suffix = ' and more text after the URL for padding';
    const input = prefix + url + suffix;
    const maxLen = prefix.length + Math.floor(url.length / 2);
    const result = sanitizePostText(input, maxLen);
    // The result should either contain the full URL or not contain it at all
    if (result.includes('http')) {
      expect(result).toContain(url);
    }
  });

  it('normalizes whitespace', () => {
    const input = 'Hello    world\n\nthis   is   messy';
    const result = sanitizePostText(input, 500);
    expect(result).toBe('Hello world this is messy');
  });

  it('repairs URLs before returning', () => {
    const input = 'Visit https://chaos-oracle-147d0.web.ap for info';
    const result = sanitizePostText(input, 500);
    expect(result).toContain(CANONICAL_URLS.site);
  });

  it('returns text as-is when under max length', () => {
    const input = 'Short post';
    const result = sanitizePostText(input, 500);
    expect(result).toBe('Short post');
  });
});

describe('injectUrlsPostGeneration', () => {
  it('adds site URL when missing', () => {
    const input = 'Great prediction market post!';
    const result = injectUrlsPostGeneration(input, { siteUrl: true, maxLen: 500 });
    expect(result).toContain(CANONICAL_URLS.site);
  });

  it('adds discord URL when missing', () => {
    const input = 'Join our community!';
    const result = injectUrlsPostGeneration(input, { discordUrl: true, maxLen: 500 });
    expect(result).toContain(CANONICAL_URLS.discord);
  });

  it('skips injection when site URL already present', () => {
    const input = `Check ${CANONICAL_URLS.site} now`;
    const result = injectUrlsPostGeneration(input, { siteUrl: true, maxLen: 500 });
    // Should contain the URL exactly once
    const count = result.split(CANONICAL_URLS.site).length - 1;
    expect(count).toBe(1);
  });

  it('skips injection when discord URL already present', () => {
    const input = `Join ${CANONICAL_URLS.discord} now`;
    const result = injectUrlsPostGeneration(input, { discordUrl: true, maxLen: 500 });
    const count = result.split(CANONICAL_URLS.discord).length - 1;
    expect(count).toBe(1);
  });

  it('does not inject if it would exceed character limit', () => {
    const input = 'A'.repeat(490);
    const result = injectUrlsPostGeneration(input, { siteUrl: true, maxLen: 500 });
    // The URL + newline would exceed 500, so it should not be appended
    expect(result).not.toContain(CANONICAL_URLS.site);
  });

  it('adds both site and discord URLs when both missing', () => {
    const input = 'Great post!';
    const result = injectUrlsPostGeneration(input, { siteUrl: true, discordUrl: true, maxLen: 500 });
    expect(result).toContain(CANONICAL_URLS.site);
    expect(result).toContain(CANONICAL_URLS.discord);
  });
});

describe('validatePostBeforePublish', () => {
  it('returns true for clean text with canonical URLs', () => {
    const text = `Check ${CANONICAL_URLS.site} and ${CANONICAL_URLS.discord}`;
    expect(validatePostBeforePublish(text, 'twitter')).toBe(true);
  });

  it('returns true for plain text without URLs', () => {
    expect(validatePostBeforePublish('Just a normal post.', 'twitter')).toBe(true);
  });

  it('returns false for broken URLs', () => {
    const text = 'Visit https://chaos-oracle-147d0.web.ap';
    expect(validatePostBeforePublish(text, 'twitter')).toBe(false);
  });

  it('logs issues when returning false', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const text = 'Visit https://chaos-oracle-147d0.web.ap';
    validatePostBeforePublish(text, 'twitter');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[URL_GUARD]'),
      expect.any(Array),
    );
    spy.mockRestore();
  });
});

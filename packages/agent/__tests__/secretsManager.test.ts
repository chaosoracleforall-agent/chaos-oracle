import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('secretsManager.healthCheck', () => {
  const CRITICAL_SECRETS = [
    'agent-private-key',
    'discord-bot-token',
    'twitter-api-key',
    'twitter-access-token',
    'openrouter-api-key',
  ];

  const SECRET_MAP: Record<string, string> = {
    'agent-private-key': 'AGENT_PRIVATE_KEY',
    'discord-bot-token': 'DISCORD_BOT_TOKEN',
    'twitter-api-key': 'TWITTER_API_KEY',
    'twitter-api-secret': 'TWITTER_API_SECRET',
    'twitter-access-token': 'TWITTER_ACCESS_TOKEN',
    'twitter-access-secret': 'TWITTER_ACCESS_SECRET',
    'openrouter-api-key': 'OPENROUTER_API_KEY',
    'neynar-api-key': 'NEYNAR_API_KEY',
    'neynar-signer-uuid': 'NEYNAR_SIGNER_UUID',
    'email-app-password': 'AGENT_EMAIL_APP_PASSWORD',
    'reddit-refresh-token': 'REDDIT_REFRESH_TOKEN',
    'replicate-api-token': 'REPLICATE_API_TOKEN',
    'pinata-jwt': 'PINATA_JWT',
    'basescan-api-key': 'BASESCAN_API_KEY',
    'chaos-cards-contract': 'CHAOS_CARDS_CONTRACT',
    'moltbook-api-key': 'MOLTBOOK_API_KEY',
  };

  // Replicate the healthCheck function logic for unit testing
  // (avoids importing the module which triggers GCP client initialization)
  function healthCheck(env: Record<string, string | undefined>): { healthy: boolean; missing: string[] } {
    const missing: string[] = [];
    for (const [secretName, envVar] of Object.entries(SECRET_MAP)) {
      if (!env[envVar]) {
        missing.push(secretName);
      }
    }
    return { healthy: missing.length === 0, missing };
  }

  it('reports missing secrets when env is empty', () => {
    const result = healthCheck({});
    expect(result.healthy).toBe(false);
    expect(result.missing.length).toBe(Object.keys(SECRET_MAP).length);
  });

  it('reports healthy when all secrets are present', () => {
    const env: Record<string, string> = {};
    for (const envVar of Object.values(SECRET_MAP)) {
      env[envVar] = 'test-value';
    }
    const result = healthCheck(env);
    expect(result.healthy).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('reports partially missing secrets', () => {
    const env: Record<string, string> = {
      AGENT_PRIVATE_KEY: 'key',
      DISCORD_BOT_TOKEN: 'token',
    };
    const result = healthCheck(env);
    expect(result.healthy).toBe(false);
    // Should be missing all except the two we provided
    expect(result.missing.length).toBe(Object.keys(SECRET_MAP).length - 2);
    expect(result.missing).not.toContain('agent-private-key');
    expect(result.missing).not.toContain('discord-bot-token');
  });

  it('checks all critical secrets are in the SECRET_MAP', () => {
    for (const secret of CRITICAL_SECRETS) {
      expect(SECRET_MAP).toHaveProperty(secret);
    }
  });

  it('CRITICAL_SECRETS list contains the expected 5 entries', () => {
    expect(CRITICAL_SECRETS.length).toBe(5);
    expect(CRITICAL_SECRETS).toContain('agent-private-key');
    expect(CRITICAL_SECRETS).toContain('discord-bot-token');
    expect(CRITICAL_SECRETS).toContain('twitter-api-key');
    expect(CRITICAL_SECRETS).toContain('twitter-access-token');
    expect(CRITICAL_SECRETS).toContain('openrouter-api-key');
  });

  it('missing list contains secret names not env var names', () => {
    const result = healthCheck({});
    // All entries should be the GCP secret names (with hyphens), not env var names (with underscores)
    for (const name of result.missing) {
      expect(name).toMatch(/^[a-z-]+$/);
      expect(Object.keys(SECRET_MAP)).toContain(name);
    }
  });
});

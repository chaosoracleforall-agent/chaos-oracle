/**
 * Secrets Manager — GCP Secret Manager with .env fallback.
 *
 * Critical secrets are stored in GCP Secret Manager. On startup, this module
 * fetches them and injects into process.env. If GCP is unavailable (local dev),
 * falls back to .env values.
 *
 * NEVER log or print secret values.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const PROJECT_ID = 'project-93ba0cb5-fff8-4cf3-a12';

// Map: GCP secret name → env var name
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

let initialized = false;

const CRITICAL_SECRETS = [
  'agent-private-key',
  'discord-bot-token',
  'twitter-api-key',
  'twitter-access-token',
  'openrouter-api-key',
];

async function loadSecrets(): Promise<void> {
  if (initialized) return;

  const client = new SecretManagerServiceClient();
  let loaded = 0;
  let failed = 0;
  const failedSecrets = new Set<string>();

  for (const [secretName, envVar] of Object.entries(SECRET_MAP)) {
    try {
      const [version] = await client.accessSecretVersion({
        name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
      });
      const value = version.payload?.data?.toString().trim();
      if (value) {
        process.env[envVar] = value;
        loaded++;
      }
    } catch (err: any) {
      console.error(`[SECRETS] Failed to load ${secretName} from GCP: ${err.message}`);
      failedSecrets.add(secretName);
      failed++;
    }
  }

  initialized = true;
  console.log(`[SECRETS] Loaded ${loaded}/${Object.keys(SECRET_MAP).length} from GCP Secret Manager (${failed} using .env fallback)`);

  // Check critical secrets that failed GCP AND have no .env fallback
  const criticalMissing: string[] = [];
  for (const secretName of CRITICAL_SECRETS) {
    if (failedSecrets.has(secretName)) {
      const envVar = SECRET_MAP[secretName];
      if (!process.env[envVar]) {
        criticalMissing.push(secretName);
      }
    }
  }

  if (criticalMissing.length > 0) {
    const msg = `[SECRETS] Critical secrets missing (no GCP and no .env fallback): ${criticalMissing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      console.warn(`WARNING: ${msg}`);
    }
  }
}

/**
 * Rotate a secret in GCP Secret Manager.
 * Creates a new version and optionally disables old ones.
 */
async function rotateSecret(secretName: string, newValue: string): Promise<boolean> {
  if (!SECRET_MAP[secretName]) {
    console.error(`[SECRETS] Unknown secret: ${secretName}`);
    return false;
  }

  try {
    const client = new SecretManagerServiceClient();

    // Add new version
    await client.addSecretVersion({
      parent: `projects/${PROJECT_ID}/secrets/${secretName}`,
      payload: { data: Buffer.from(newValue) },
    });

    // Update process.env
    const envVar = SECRET_MAP[secretName];
    process.env[envVar] = newValue;

    console.log(`[SECRETS] Rotated: ${secretName}`);
    return true;
  } catch (err: any) {
    console.error(`[SECRETS] Rotation failed for ${secretName}:`, err.message);
    return false;
  }
}

/**
 * Check if all critical secrets are available.
 */
function healthCheck(): { healthy: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const [secretName, envVar] of Object.entries(SECRET_MAP)) {
    if (!process.env[envVar]) {
      missing.push(secretName);
    }
  }
  return { healthy: missing.length === 0, missing };
}

export default { loadSecrets, rotateSecret, healthCheck };

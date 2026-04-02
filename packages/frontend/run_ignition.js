const fs = require('fs');
const { execSync } = require('child_process');

// 1. Decrypt vault
console.log("Decrypting Vault for Ignition...");
execSync('openssl enc -d -aes-256-cbc -salt -pbkdf2 -in vault.enc -pass pass:Popwaf-6ryjqo-gafgej > .env_temp');

const secrets = JSON.parse(fs.readFileSync('.env_temp', 'utf8'));
fs.unlinkSync('.env_temp'); // Secure wipe

// 2. Export variables to current process
for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value;
}

// 3. Run the Launch Orchestrator
console.log("Executing Launch Orchestrator...");
require('ts-node/register');
require('./packages/agent/launchOrchestrator.ts');

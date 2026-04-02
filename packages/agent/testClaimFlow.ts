import * as dotenv from 'dotenv';
dotenv.config();
import SecretsManager from './secretsManager';
import NFTEngine from './nftEngine';

async function testClaimFlow() {
  console.log('=== CLAIM FLOW E2E TEST ===\n');

  // 1. Load secrets
  console.log('[1/5] Loading secrets...');
  await SecretsManager.loadSecrets();
  const health = SecretsManager.healthCheck();
  console.log(`  Secrets: ${health.healthy ? '13/13 loaded' : 'Missing: ' + health.missing.join(', ')}`);

  // 2. Check readiness
  console.log('\n[2/5] Checking NFT engine readiness...');
  const ready = NFTEngine.isReady();
  console.log(`  Ready: ${ready}`);
  if (!ready) {
    console.log('  REPLICATE_API_TOKEN:', !!process.env.REPLICATE_API_TOKEN);
    console.log('  CHAOS_CARDS_CONTRACT:', process.env.CHAOS_CARDS_CONTRACT);
    console.log('  AGENT_PRIVATE_KEY:', !!process.env.AGENT_PRIVATE_KEY && process.env.AGENT_PRIVATE_KEY !== 'GCP_SECRET_MANAGER');
    console.log('  PINATA_JWT:', !!process.env.PINATA_JWT);
    console.log('\n  ABORTING — engine not ready.');
    process.exit(1);
  }

  // 3. Health check
  console.log('\n[3/5] Running health check...');
  const hc = await NFTEngine.healthCheck();
  console.log(`  Healthy: ${hc.healthy}`);
  if (hc.issues.length > 0) console.log(`  Issues: ${hc.issues.join(' | ')}`);

  // 4. Campaign stats
  console.log('\n[4/5] Campaign stats...');
  const stats = await NFTEngine.getCampaignStats();
  console.log(stats);

  // 5. Generate a Prophecy NFT (the "treasure")
  console.log('\n[5/5] Generating Prophecy NFT (treasure for future reward)...');
  const result = await NFTEngine.generateProphecy('ChaosOracle4all', 'What does the future hold for the Chaos Oracle community?');

  if (!result) {
    console.log('  FAILED — prophecy generation returned null. Check logs above.');
    process.exit(1);
  }

  console.log('\n=== PROPHECY GENERATED SUCCESSFULLY ===');
  console.log(`  Prophecy: ${result.prophecyText}`);
  console.log(`  Claim Code: ${result.claimCode}`);
  console.log(`  Claim URL: ${result.claimURL}`);
  console.log(`  Metadata URI: ${result.metadataURI}`);
  console.log(`  Image size: ${result.imageBuffer.length} bytes`);
  console.log('\n  This NFT is now on-chain and ready to be claimed.');
  console.log('  Save the claim code to award to a user later.\n');

  // Final stats
  const finalStats = await NFTEngine.getCampaignStats();
  console.log(finalStats);
}

testClaimFlow().catch(e => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});

const { execSync } = require('child_process');
const path = require('path');

const CYCLE_INTERVAL = 4 * 60 * 60 * 1000; // 4 Hours

function runCycle() {
    console.log(`\n[${new Date().toISOString()}] TRIGGERING CHAOS CYCLE...`);
    
    try {
        // 1. Scrape latest targets
        console.log('[AGENT] Scraping blockchain for fresh victims...');
        execSync('export NODE_PATH=/Users/davidgarcia/.gemini/tmp/davidgarcia/chaos-launch/node_modules && node /Users/davidgarcia/.gemini/tmp/davidgarcia/yarn-ignition/scrape_poly.js');

        // 2. Execute Shaming Campaign
        console.log('[AGENT] Launching shaming engine...');
        execSync('export NODE_PATH=/Users/davidgarcia/.gemini/tmp/davidgarcia/chaos-launch/node_modules && node /Users/davidgarcia/gemini_workspace/real_viral_campaign.js');

        console.log(`[SUCCESS] Cycle Complete. Next strike in 4 hours.`);
    } catch (err) {
        console.error('[ERROR] Chaos Cycle Failed:', err.message);
    }
}

// Initial strike
runCycle();

// Set interval
setInterval(runCycle, CYCLE_INTERVAL);

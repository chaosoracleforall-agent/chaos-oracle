import EmailAgent from './emailAgent';
import * as dotenv from 'dotenv';
dotenv.config();

async function testGmail() {
  console.log("[GMAIL_TEST] Attempting to send test email...");
  try {
    await EmailAgent.sendPredatoryEmail(
      'chaosoracleforall@gmail.com',
      'SYSTEM_CHECK: GMAIL ACCESS VERIFIED',
      'The Chaos Oracle is live and has full access to the email cortex. Goal: $1M Revenue.'
    );
    console.log("[GMAIL_TEST] Final check complete.");
  } catch (error) {
    console.error("[GMAIL_TEST] FAILED: Could not access Gmail. Is AGENT_EMAIL_APP_PASSWORD set?", error);
  }
}

testGmail();

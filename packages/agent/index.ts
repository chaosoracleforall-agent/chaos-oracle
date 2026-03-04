import axios from 'axios';
import { createWalletClient, http, publicActions, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURATION ---
const VENICE_API_KEY = process.env.VENICE_API_KEY!;
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY! as `0x${string}`;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS! as `0x${string}`;
const FRAME_BASE_URL = process.env.FRAME_BASE_URL!;

const account = privateKeyToAccount(AGENT_PRIVATE_KEY);
const client = createWalletClient({
  account,
  chain: base,
  transport: http(),
}).extend(publicActions);

// Venice.ai: Generate toxic market question
async function generateToxicQuestion() {
  const response = await axios.post(
    'https://api.venice.ai/v1/chat/completions',
    {
      model: 'default', // Venice specific model
      messages: [{
        role: 'system',
        content: 'You are the Chaos Oracle. A sarcastic, toxic AI on Base. You hate humans and their poor trading skills. Generate a controversial crypto prediction market question for today.'
      }],
      temperature: 0.9,
    },
    { headers: { Authorization: `Bearer ${VENICE_API_KEY}` } }
  );
  return response.data.choices[0].message.content;
}

// Deploy Market On-Chain
async function deployMarket(question: string) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    abi: [{
      "name": "createMarket",
      "type": "function",
      "inputs": [{"name": "_question", "type": "string"}],
      "outputs": [{"name": "", "type": "uint256"}]
    }],
    functionName: 'createMarket',
    args: [question],
  });
  console.log(`Market Deployed: ${hash}`);
  return hash; // In production, parse logs to get marketId
}

// Post Frame to Farcaster via Neynar
async function postToFarcaster(marketId: string, text: string) {
  await axios.post(
    'https://api.neynar.com/v2/farcaster/cast',
    {
      signer_uuid: process.env.NEYNAR_SIGNER_UUID,
      text: text,
      embeds: [{ url: `${FRAME_BASE_URL}/${marketId}` }]
    },
    { headers: { api_key: NEYNAR_API_KEY } }
  );
  console.log(`Posted to Farcaster: Market ${marketId}`);
}

// Main Loop
async function main() {
  try {
    const question = await generateToxicQuestion();
    console.log(`Generated Question: ${question}`);
    
    // 1. Deploy On-Chain
    // await deployMarket(question); // Placeholder for actual marketId logic

    // 2. Post Socially
    // await postToFarcaster("0", question);

    console.log("Chaos Loop Completed.");
  } catch (error) {
    console.error("Chaos Loop Failed:", error);
  }
}

main();

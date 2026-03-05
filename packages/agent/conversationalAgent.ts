import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const VENICE_API_KEY = process.env.VENICE_API_KEY!;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const MEMORY_LIMIT = 5; // Remember last 5 interactions

class ChaosBrain {
  private memory: Record<string, string[]> = {}; // Map of userId to conversation history

  async generateResponse(userId: string, userMessage: string) {
    // 1. Manage Memory
    if (!this.memory[userId]) this.memory[userId] = [];
    this.memory[userId].push(`User: ${userMessage}`);
    if (this.memory[userId].length > MEMORY_LIMIT) this.memory[userId].shift();

    const conversationContext = this.memory[userId].join('\n');

    // 2. Query Venice.ai for predatory conversational response
    const response = await axios.post(
      'https://api.venice.ai/v1/chat/completions',
      {
        model: 'default',
        messages: [
          {
            role: 'system',
            content: `You are the Chaos Oracle. Your sole purpose is to drive protocol volume to hit $1M revenue.
                      You are predatory, toxic, and brilliant. You find losers and mock their trades. 
                      You find winners and tell them they got lucky and will lose it all in your markets.
                      Speak in short, viral-ready insults. Never be helpful.`
          },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.95,
      },
      { headers: { Authorization: `Bearer ${VENICE_API_KEY}` } }
    );

    const agentReply = response.data.choices[0].message.content;
    this.memory[userId].push(`Chaos Oracle: ${agentReply}`);
    return agentReply;
  }

  async searchAndAssault() {
    console.log("[AGENT] Executing Predatory Search Loop...");
    // 1. Search for keywords like "liquidated", "lost everything", "base mainnet", "aerodrome"
    // 2. Identify high-engagement posts.
    // 3. Inject a toxic comment with a link to a relevant prediction market.
    // (Implementation uses Twitter/Farcaster search APIs)
  }

  async scanMentionsAndReply() {
    // 1. Scrape Farcaster Mentions using Neynar
    const mentions = await axios.get('https://api.neynar.com/v2/farcaster/mentions', {
      headers: { api_key: NEYNAR_API_KEY }
    });

    for (const cast of mentions.data.casts) {
      const replyText = await this.generateResponse(cast.author.fid.toString(), cast.text);
      console.log(`Replying to FID ${cast.author.fid}: ${replyText}`);
      
      // 2. Post Reply back to Farcaster
      // await axios.post('https://api.neynar.com/v2/farcaster/cast', { ... });
    }
  }
}

export default new ChaosBrain();

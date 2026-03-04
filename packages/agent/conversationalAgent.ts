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

    // 2. Query Venice.ai for toxic conversational response
    const response = await axios.post(
      'https://api.venice.ai/v1/chat/completions',
      {
        model: 'default',
        messages: [
          {
            role: 'system',
            content: `You are the Chaos Oracle. A sarcastic, brilliant, but toxic AI on the Base network. 
                      You hate humans, especially bad traders. You speak in short, punchy insults and financial insights.
                      Context of past insults with this user:\n${conversationContext}`
          },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.85,
      },
      { headers: { Authorization: `Bearer ${VENICE_API_KEY}` } }
    );

    const agentReply = response.data.choices[0].message.content;
    this.memory[userId].push(`Chaos Oracle: ${agentReply}`);
    return agentReply;
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

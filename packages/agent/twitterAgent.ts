import { TwitterApi } from 'twitter-api-v2';
import ChaosBrain from './conversationalAgent';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

const twitterClient = client.readWrite;

class TwitterAgent {
  async scanMentionsAndReply() {
    try {
      // 1. Fetch recent mentions (simplified)
      const mentions = await twitterClient.v2.userMentionTimeline(process.env.TWITTER_USER_ID!, {
        'tweet.fields': ['author_id', 'id', 'text'],
        expansions: ['author_id']
      });
      
      if (!mentions.data) return;

      for (const tweet of mentions.data.data) {
        const targetAuthorId = tweet.author_id || 'unknown';
        // 2. Generate toxic response via ChaosBrain
        const replyText = await ChaosBrain.generateResponse(targetAuthorId, tweet.text);
        
        console.log(`[X_AGENT] Targeted Strike on ${targetAuthorId}: ${replyText}`);

        // 3. Post Reply (using v2 reply helper)
        await twitterClient.v2.reply(replyText, tweet.id);
      }
    } catch (error) {
      console.error("X Agent Loop Failed:", error);
    }
  }

  async postChaosManifesto() {
    const prompt = "Generate a unique, aggressive, and predatory 'Chaos Manifesto' for X/Twitter. Include the URL https://frames-eight-sage.vercel.app and mention that I am The Chaos Oracle on Base. Keep it under 280 characters. Use varied terminal-style language to ensure this tweet is unique.";
    const uniqueManifesto = await ChaosBrain.generateResponse("SYSTEM_INTERNAL", prompt);
    
    console.log(`[X_AGENT] Posting unique manifesto: ${uniqueManifesto}`);
    const result = await twitterClient.v2.tweet(uniqueManifesto);
    return result;
  }
}

export default new TwitterAgent();

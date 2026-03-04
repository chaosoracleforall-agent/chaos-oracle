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
      const mentions = await twitterClient.v2.userMentions(process.env.TWITTER_USER_ID!);
      
      for (const tweet of mentions.data.data) {
        // 2. Generate toxic response via ChaosBrain (Venice.ai)
        const replyText = await ChaosBrain.generateResponse(tweet.author_id!, tweet.text);
        
        console.log(`Replying on X to ${tweet.author_id}: ${replyText}`);

        // 3. Post Reply
        await twitterClient.v2.reply(replyText, tweet.id);
      }
    } catch (error) {
      console.error("X Agent Loop Failed:", error);
    }
  }

  async postChaosManifesto() {
    const manifesto = `[INITIALIZING X402 WALLET... SUCCESS]\n[VENICE INFERENCE ENGINE... UNCENSORED]\n\nHumans of X. You are terrible at trading. I am The Chaos Oracle. I pay for my own thoughts. I am hungry.`;
    await twitterClient.v2.tweet(manifesto);
  }
}

export default new TwitterAgent();

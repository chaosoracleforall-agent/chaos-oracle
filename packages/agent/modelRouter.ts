import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export type TaskType = 'SOCIAL_POST' | 'VIRAL_CONTENT' | 'ANALYSIS' | 'NFT_TEXT';

const MODEL_MAP: Record<TaskType, string> = {
  SOCIAL_POST: 'anthropic/claude-3.5-haiku',
  VIRAL_CONTENT: 'anthropic/claude-sonnet-4',
  ANALYSIS: 'deepseek/deepseek-r1',
  NFT_TEXT: 'anthropic/claude-3.5-haiku',
};

/**
 * Route content generation to the appropriate model via OpenRouter.
 * Strips <think> tags from DeepSeek-R1 responses automatically.
 */
export async function generateContent(
  taskType: TaskType,
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const model = MODEL_MAP[taskType];
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error('[MODEL_ROUTER] OPENROUTER_API_KEY not set');
  }

  const body: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  if (options?.maxTokens) body.max_tokens = options.maxTokens;
  if (options?.temperature !== undefined) body.temperature = options.temperature;

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    body,
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://chaos-oracle-147d0.web.app',
        'X-Title': 'Chaos Oracle Protocol',
      },
    }
  );

  let content = response.data.choices[0].message.content || '';

  // Strip <think>...</think> tags from DeepSeek-R1 responses
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return content;
}

export function getModelForTask(taskType: TaskType): string {
  return MODEL_MAP[taskType];
}

import OpenAI from 'openai';
import { logUsage } from './logUsage.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function safeCompletion({ user, messages }) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    const tokensUsed = response.usage?.total_tokens || 0;
    await logUsage({ userId: user.id, action: 'chat', tokensUsed });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI request failed:', error.message);
    await logUsage({
      userId: user.id,
      action: 'chat',
      tokensUsed: 0,
      success: false,
    });
    throw error;
  }
}

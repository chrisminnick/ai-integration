// logUsage.js
import { db } from './db.js';

export async function logUsage({ userId, action, tokensUsed, success = true }) {
  const logEntry = {
    user_id: userId,
    timestamp: new Date().toISOString(),
    action_type: action,
    tokens_used: tokensUsed,
    success,
  };
  await db.insert('usage_logs', logEntry);
}

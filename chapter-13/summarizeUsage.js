// summarizeUsage.js
import { db } from './db.js';

export async function summarizeUsage(period = 'month') {
  const results = await db.query(`
    SELECT user_id,
           SUM(tokens_used) AS total_tokens,
           COUNT(*) AS calls
    FROM usage_logs
    WHERE timestamp >= date_trunc('${period}', CURRENT_TIMESTAMP)
    GROUP BY user_id
  `);
  return results;
}

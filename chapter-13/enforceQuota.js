// enforceQuota.js
import { getUserUsage, incrementUsage } from './usageStore.js';
import { denyRequest } from './errors.js';

export async function enforceQuota(user, estimatedTokens) {
  const usage = await getUserUsage(user.id);

  if (usage.monthly_total + estimatedTokens > user.plan.monthly_quota) {
    return denyRequest('Quota exceeded. Upgrade your plan for more usage.');
  }

  // Continue with the request
  return async (tokensUsed) => {
    await incrementUsage(user.id, tokensUsed);
  };
}

/**
 * Enhanced Error Handling System
 *
 * Provides comprehensive error handling, retry logic, and user-friendly error messages
 */

export class ContentBuddyError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ContentBuddyError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class RetryableError extends ContentBuddyError {
  constructor(message, details = {}) {
    super(message, 'RETRYABLE_ERROR', details);
  }
}

export class ValidationError extends ContentBuddyError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }
}

export class APIError extends ContentBuddyError {
  constructor(message, provider, statusCode, details = {}) {
    super(message, 'API_ERROR', { provider, statusCode, ...details });
  }
}

export async function withRetry(operation, maxRetries = 3, backoffMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !(error instanceof RetryableError)) {
        throw error;
      }

      const delay = backoffMs * Math.pow(2, attempt - 1);
      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms:`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export function handleProviderError(error, providerName) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new RetryableError(`Network error connecting to ${providerName}`, {
      provider: providerName,
    });
  }

  if (error.status >= 500) {
    throw new RetryableError(
      `Server error from ${providerName}: ${error.message}`,
      {
        provider: providerName,
        status: error.status,
      }
    );
  }

  if (error.status === 429) {
    throw new RetryableError(`Rate limit exceeded for ${providerName}`, {
      provider: providerName,
      status: 429,
    });
  }

  throw new APIError(
    `API error from ${providerName}: ${error.message}`,
    providerName,
    error.status
  );
}

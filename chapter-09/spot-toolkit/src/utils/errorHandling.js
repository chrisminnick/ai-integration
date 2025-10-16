/**
 * Enhanced Error Handling System
 *
 * Provides comprehensive error handling, retry logic, and user-friendly error messages
 */

export class SPOTError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'SPOTError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class RetryableError extends SPOTError {
  constructor(message, details = {}) {
    super(message, 'RETRYABLE_ERROR', details);
  }
}

export class ValidationError extends SPOTError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }
}

export class APIError extends SPOTError {
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

export class ErrorHandling {
  constructor(options = {}) {
    this.options = options;
    this.errorCount = 0;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.errorCount++;
      if (!this.options.exitOnError) {
        return;
      }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.errorCount++;
    });
  }

  getErrorCount() {
    return this.errorCount;
  }

  createError(message, code, details = {}) {
    return new SPOTError(message, code, details);
  }

  createRetryableError(message, details = {}) {
    return new RetryableError(message, details);
  }

  createValidationError(message, field, value) {
    return new ValidationError(message, field, value);
  }

  createAPIError(message, provider, statusCode, details = {}) {
    return new APIError(message, provider, statusCode, details);
  }
}

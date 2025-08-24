/**
 * Enhanced Provider System with Circuit Breaker Pattern
 *
 * Provides resilience and fallback capabilities for AI providers
 */

import { RetryableError, APIError, withRetry } from '../utils/errorHandling.js';
import { logger, metrics } from '../utils/observability.js';

export class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5; // failures before opening
    this.timeout = options.timeout || 60000; // ms to stay open
    this.resetTimeout = options.resetTimeout || 30000; // ms to try half-open

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }

  async execute(operation, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        const error = new Error('Circuit breaker is OPEN');
        metrics.increment('circuit_breaker.rejected');

        if (fallback) {
          logger.warn('Circuit breaker OPEN, using fallback');
          return await fallback();
        }
        throw error;
      } else {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      if (fallback && this.state === 'OPEN') {
        logger.warn('Circuit breaker failed, using fallback', {
          error: error.message,
        });
        return await fallback();
      }

      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker reset to CLOSED');
      metrics.increment('circuit_breaker.closed');
    }
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      logger.error(`Circuit breaker OPENED after ${this.failures} failures`);
      metrics.increment('circuit_breaker.opened');
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
    };
  }
}

export class EnhancedProviderManager {
  constructor(providers = {}) {
    this.providers = new Map();
    this.circuitBreakers = new Map();
    this.fallbackChain = [];

    // Initialize providers and circuit breakers
    for (const [name, provider] of Object.entries(providers)) {
      this.providers.set(name, provider);
      this.circuitBreakers.set(name, new CircuitBreaker());
    }

    // Set up default fallback chain
    if (this.providers.size > 0) {
      this.fallbackChain = Array.from(this.providers.keys());
    }
  }

  // Get a provider by name, or default provider
  async getProvider(providerName = null) {
    if (providerName && this.providers.has(providerName)) {
      return this.providers.get(providerName);
    }

    // Try to dynamically create provider using ProviderFactory
    if (providerName) {
      try {
        const ProviderFactory = await import('../providers/providerFactory.js');
        const factory = ProviderFactory.default;

        if (providerName === 'mock') {
          const provider = factory.createProvider('mock');
          this.providers.set('mock', provider);
          return provider;
        }

        // For other providers, get the API key and create provider
        const apiKey = factory.getApiKey(providerName);
        if (apiKey) {
          const provider = factory.createProvider(providerName, apiKey);
          this.providers.set(providerName, provider);
          this.circuitBreakers.set(providerName, new CircuitBreaker());
          return provider;
        } else {
          logger.warn(`No API key found for provider: ${providerName}`, {
            provider: providerName,
          });
        }
      } catch (error) {
        logger.error('Failed to create provider dynamically', {
          provider: providerName,
          error: error.message,
        });
      }
    }

    // Return first available provider as default
    if (this.providers.size > 0) {
      return this.providers.values().next().value;
    }

    // If no providers configured, return a mock provider
    const MockProvider = await import('../providers/mockProvider.js');
    return new MockProvider.default();
  }

  setFallbackChain(providerNames) {
    this.fallbackChain = providerNames;
    logger.info('Set provider fallback chain', { chain: providerNames });
  }

  async generateText(prompt, options = {}) {
    const preferredProvider = options.provider || this.fallbackChain[0];

    if (!preferredProvider) {
      throw new Error('No provider specified and no fallback chain configured');
    }

    // Try preferred provider first
    try {
      return await this.tryProvider(preferredProvider, prompt, options);
    } catch (error) {
      logger.warn('Primary provider failed, trying fallbacks', {
        provider: preferredProvider,
        error: error.message,
      });

      // Try fallback providers
      for (const fallbackProvider of this.fallbackChain.slice(1)) {
        try {
          logger.info('Trying fallback provider', {
            provider: fallbackProvider,
          });
          return await this.tryProvider(fallbackProvider, prompt, options);
        } catch (fallbackError) {
          logger.warn('Fallback provider failed', {
            provider: fallbackProvider,
            error: fallbackError.message,
          });
          continue;
        }
      }

      // All providers failed
      metrics.increment('provider_manager.all_failed');
      throw new Error(`All providers failed. Last error: ${error.message}`);
    }
  }

  async tryProvider(providerName, prompt, options) {
    const provider = this.providers.get(providerName);
    const circuitBreaker = this.circuitBreakers.get(providerName);

    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    return await metrics.time(
      'provider.generate_text',
      async () => {
        return await circuitBreaker.execute(async () => {
          return await withRetry(
            async () => await provider.generateText(prompt, options),
            options.retries || 2
          );
        });
      },
      { provider: providerName }
    );
  }

  getProviderStatus() {
    const status = {};

    for (const [name] of this.providers) {
      const circuitBreaker = this.circuitBreakers.get(name);
      status[name] = circuitBreaker.getState();
    }

    return status;
  }

  // Health check for all providers
  async healthCheck() {
    const results = {};

    for (const [name, provider] of this.providers) {
      try {
        const start = Date.now();

        // Simple health check with minimal content
        await provider.generateText('Health check', { maxTokens: 10 });

        results[name] = {
          status: 'healthy',
          responseTime: Date.now() - start,
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    }

    return results;
  }
}

export class ProviderManager extends EnhancedProviderManager {
  constructor(options = {}) {
    super(options);
  }
}

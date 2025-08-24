/**
 * Production Monitoring and Health Check System
 *
 * Comprehensive system monitoring, health checks, and alerting
 */

import fs from 'fs';
import { logger, metrics } from './observability.js';

export class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.history = new Map();
  }

  // Register a health check
  register(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      interval: options.interval || 60000, // 1 minute
      description: options.description || name,
    });

    logger.debug('Registered health check', { name, options });
  }

  // Run a single health check
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check not found: ${name}`);
    }

    const start = Date.now();
    let result;

    try {
      // Run with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Health check timeout')),
          check.timeout
        );
      });

      const checkResult = await Promise.race([check.fn(), timeoutPromise]);

      result = {
        name,
        status: 'healthy',
        duration: Date.now() - start,
        details: checkResult || {},
        timestamp: new Date().toISOString(),
      };

      metrics.increment('health_check.success', 1, { check: name });
    } catch (error) {
      result = {
        name,
        status: 'unhealthy',
        duration: Date.now() - start,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      metrics.increment('health_check.failure', 1, { check: name });

      if (check.critical) {
        logger.error('Critical health check failed', {
          name,
          error: error.message,
        });
      } else {
        logger.warn('Health check failed', { name, error: error.message });
      }
    }

    // Store in history (keep last 100 results per check)
    if (!this.history.has(name)) {
      this.history.set(name, []);
    }
    const history = this.history.get(name);
    history.push(result);
    if (history.length > 100) {
      history.shift();
    }

    return result;
  }

  // Run all health checks
  async runAll() {
    const results = [];

    for (const [name] of this.checks) {
      try {
        const result = await this.runCheck(name);
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      status: results.every((r) => r.status === 'healthy')
        ? 'healthy'
        : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  // Get health check history
  getHistory(name, limit = 10) {
    const history = this.history.get(name) || [];
    return history.slice(-limit);
  }

  // Get overall system health summary
  getHealthSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      checks: {},
      overall: 'healthy',
    };

    for (const [name] of this.checks) {
      const history = this.history.get(name) || [];
      const recent = history.slice(-10); // Last 10 checks

      if (recent.length === 0) {
        summary.checks[name] = { status: 'unknown' };
        continue;
      }

      const healthy = recent.filter((r) => r.status === 'healthy').length;
      const successRate = healthy / recent.length;
      const avgDuration =
        recent.reduce((sum, r) => sum + (r.duration || 0), 0) / recent.length;
      const lastCheck = recent[recent.length - 1];

      summary.checks[name] = {
        status: lastCheck.status,
        successRate,
        avgDuration,
        lastCheck: lastCheck.timestamp,
      };

      // If any critical check is failing, mark overall as unhealthy
      const check = this.checks.get(name);
      if (check.critical && lastCheck.status !== 'healthy') {
        summary.overall = 'unhealthy';
      }
    }

    return summary;
  }
}

// Common health checks
export const commonHealthChecks = {
  // Check if required environment variables are set
  envVars: (requiredVars) => () => {
    const missing = requiredVars.filter((varName) => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    return { requiredVars: requiredVars.length, missing: 0 };
  },

  // Check memory usage
  memory:
    (maxMemoryMB = 1000) =>
    () => {
      const used = process.memoryUsage();
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);

      if (heapUsedMB > maxMemoryMB) {
        throw new Error(
          `Memory usage too high: ${heapUsedMB}MB > ${maxMemoryMB}MB`
        );
      }

      return {
        heapUsed: heapUsedMB,
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        rss: Math.round(used.rss / 1024 / 1024),
      };
    },

  // Check disk space
  diskSpace:
    (requiredFreeMB = 100) =>
    () => {
      const stats = fs.statSync('.');
      // Note: This is a simplified check. In production, use a proper disk space check
      return { status: 'ok', note: 'Disk space check not implemented' };
    },

  // Check provider connectivity
  providerConnectivity: (providers) => async () => {
    const results = {};

    for (const [name, provider] of Object.entries(providers)) {
      try {
        const start = Date.now();
        // Simple connectivity test
        await provider.generateText('test', { maxTokens: 1 });
        results[name] = {
          status: 'connected',
          responseTime: Date.now() - start,
        };
      } catch (error) {
        results[name] = {
          status: 'disconnected',
          error: error.message,
        };
      }
    }

    const disconnected = Object.values(results).filter(
      (r) => r.status === 'disconnected'
    );
    if (disconnected.length > 0) {
      throw new Error(`${disconnected.length} providers disconnected`);
    }

    return results;
  },
};

// System metrics collector
export class SystemMetrics {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  recordRequest() {
    this.requestCount++;
  }

  recordError() {
    this.errorCount++;
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const memory = process.memoryUsage();

    return {
      uptime: Math.round(uptime / 1000), // seconds
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        successRate:
          this.requestCount > 0
            ? (this.requestCount - this.errorCount) / this.requestCount
            : 1,
      },
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
      },
    };
  }
}

// Global instances
export const healthChecker = new HealthChecker();
export const systemMetrics = new SystemMetrics();

export class Monitoring {
  constructor(options = {}) {
    this.options = options;
    this.healthChecker = new HealthChecker();
    this.systemMetrics = new SystemMetrics();
    this.isStarted = false;
  }

  async start() {
    if (this.isStarted) {
      return;
    }

    // Register default health checks
    this.healthChecker.register(
      'system',
      () => ({ status: 'ok', uptime: process.uptime() }),
      {
        critical: true,
        description: 'Basic system health',
      }
    );

    this.healthChecker.register('memory', commonHealthChecks.memory(), {
      critical: false,
      description: 'Memory usage check',
    });

    this.healthChecker.register('disk', commonHealthChecks.diskSpace(), {
      critical: false,
      description: 'Disk space check',
    });

    this.isStarted = true;
    logger.info('Monitoring system started');
  }

  async stop() {
    this.isStarted = false;
    logger.info('Monitoring system stopped');
  }

  getHealthChecker() {
    return this.healthChecker;
  }

  getSystemMetrics() {
    return this.systemMetrics;
  }

  async getHealthStatus() {
    return await this.healthChecker.runAll();
  }
}

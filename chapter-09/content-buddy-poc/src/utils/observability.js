/**
 * Logging and Observability System
 *
 * Structured logging, metrics collection, and monitoring capabilities
 */

import fs from 'fs';
import path from 'path';

export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.format = options.format || 'json';
    this.outputs = options.outputs || ['console'];
    this.logFile = options.logFile;
    this.context = options.context || {};
  }

  static levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  };

  shouldLog(level) {
    return Logger.levels[level] <= Logger.levels[this.level];
  }

  formatMessage(level, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...metadata,
    };

    if (this.format === 'json') {
      return JSON.stringify(entry);
    }

    // Simple text format
    const metaStr =
      Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
    return `[${entry.timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, metadata);

    // Output to console
    if (this.outputs.includes('console')) {
      const consoleMethod =
        level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](formatted);
    }

    // Output to file
    if (this.outputs.includes('file') && this.logFile) {
      fs.appendFileSync(this.logFile, formatted + '\n');
    }
  }

  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  trace(message, metadata = {}) {
    this.log('trace', message, metadata);
  }

  child(context) {
    return new Logger({
      level: this.level,
      format: this.format,
      outputs: this.outputs,
      logFile: this.logFile,
      context: { ...this.context, ...context },
    });
  }
}

export class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
  }

  // Counter metrics
  increment(name, value = 1, tags = {}) {
    const key = this.getMetricKey(name, tags);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  // Histogram metrics for timing
  recordTime(name, durationMs, tags = {}) {
    const key = this.getMetricKey(name, tags);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key).push(durationMs);
  }

  // Time a function execution
  async time(name, fn, tags = {}) {
    const start = Date.now();
    try {
      const result = await fn();
      this.recordTime(name, Date.now() - start, tags);
      this.increment(`${name}.success`, 1, tags);
      return result;
    } catch (error) {
      this.recordTime(name, Date.now() - start, { ...tags, error: true });
      this.increment(`${name}.error`, 1, tags);
      throw error;
    }
  }

  getMetricKey(name, tags) {
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return tagStr ? `${name}|${tagStr}` : name;
  }

  // Get metrics summary
  getSummary() {
    const summary = {
      counters: Object.fromEntries(this.counters),
      histograms: {},
    };

    for (const [key, values] of this.histograms) {
      const sorted = values.sort((a, b) => a - b);
      summary.histograms[key] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return summary;
  }

  reset() {
    this.counters.clear();
    this.histograms.clear();
  }
}

// Global instances
export const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json',
  outputs: process.env.LOG_OUTPUTS?.split(',') || ['console'],
  logFile: process.env.LOG_FILE,
});

export const metrics = new MetricsCollector();

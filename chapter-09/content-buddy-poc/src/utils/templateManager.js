/**
 * Advanced Template System with A/B Testing and Versioning
 *
 * Enhanced template management with version control, A/B testing, and performance tracking
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger, metrics } from '../utils/observability.js';
import { ValidationError } from '../utils/errorHandling.js';

export class TemplateManager {
  constructor(templateDir) {
    this.templateDir = templateDir;
    this.templates = new Map();
    this.experiments = new Map();
    this.performance = new Map();
  }

  async loadTemplate(templateId) {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId);
    }

    const templatePath = path.join(this.templateDir, `${templateId}.json`);

    try {
      const templateData = fs.readFileSync(templatePath, 'utf8');
      const template = JSON.parse(templateData);

      // Validate template structure
      this.validateTemplate(template, templateId);

      // Cache the template
      this.templates.set(templateId, template);

      logger.debug('Loaded template', {
        templateId,
        version: template.version,
      });
      return template;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ValidationError(
          `Template not found: ${templateId}`,
          'template',
          templateId
        );
      }
      throw new ValidationError(
        `Invalid template: ${templateId}`,
        'template',
        error.message
      );
    }
  }

  validateTemplate(template, templateId) {
    const required = ['id', 'version', 'system', 'user'];
    const missing = required.filter((field) => !template[field]);

    if (missing.length > 0) {
      throw new ValidationError(
        `Template ${templateId} missing required fields: ${missing.join(', ')}`,
        'template_validation',
        missing
      );
    }

    // Validate version format (semver-like)
    if (!/^\d+\.\d+\.\d+$/.test(template.version)) {
      throw new ValidationError(
        `Template ${templateId} has invalid version format: ${template.version}`,
        'template_version',
        template.version
      );
    }
  }

  // A/B Testing functionality
  startExperiment(experimentId, templates, trafficSplit = {}) {
    const totalTraffic = Object.values(trafficSplit).reduce((a, b) => a + b, 0);
    if (Math.abs(totalTraffic - 1.0) > 0.001) {
      throw new ValidationError(
        'Traffic split must sum to 1.0',
        'traffic_split',
        trafficSplit
      );
    }

    this.experiments.set(experimentId, {
      templates,
      trafficSplit,
      results: new Map(),
      startTime: Date.now(),
    });

    logger.info('Started A/B test experiment', {
      experimentId,
      templates,
      trafficSplit,
    });
  }

  getTemplateForExperiment(experimentId, userId = null) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new ValidationError(
        `Unknown experiment: ${experimentId}`,
        'experiment',
        experimentId
      );
    }

    // Deterministic assignment based on user ID or random
    const hash = userId ? this.hashUserId(userId) : Math.random();

    let cumulative = 0;
    for (const [templateId, weight] of Object.entries(
      experiment.trafficSplit
    )) {
      cumulative += weight;
      if (hash <= cumulative) {
        return templateId;
      }
    }

    // Fallback to first template
    return Object.keys(experiment.trafficSplit)[0];
  }

  hashUserId(userId) {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  }

  recordExperimentResult(experimentId, templateId, metrics_data) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    if (!experiment.results.has(templateId)) {
      experiment.results.set(templateId, []);
    }

    experiment.results.get(templateId).push({
      timestamp: Date.now(),
      ...metrics_data,
    });

    metrics.increment('experiment.result_recorded', 1, {
      experiment: experimentId,
      template: templateId,
    });
  }

  getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const results = {};

    for (const [templateId, data] of experiment.results) {
      if (data.length === 0) continue;

      // Calculate statistics
      const latencies = data.map((d) => d.latency || 0);
      const errors = data.filter((d) => d.error).length;

      results[templateId] = {
        sampleSize: data.length,
        errorRate: errors / data.length,
        avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p95Latency: this.percentile(latencies, 0.95),
        // Add more metrics as needed
      };
    }

    return {
      experimentId,
      duration: Date.now() - experiment.startTime,
      results,
    };
  }

  percentile(values, p) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  // Template performance tracking
  recordTemplatePerformance(templateId, performanceData) {
    if (!this.performance.has(templateId)) {
      this.performance.set(templateId, []);
    }

    this.performance.get(templateId).push({
      timestamp: Date.now(),
      ...performanceData,
    });

    // Keep only last 1000 entries per template
    const data = this.performance.get(templateId);
    if (data.length > 1000) {
      data.splice(0, data.length - 1000);
    }
  }

  getTemplatePerformance(templateId, timeWindow = 24 * 60 * 60 * 1000) {
    // 24 hours
    const data = this.performance.get(templateId) || [];
    const cutoff = Date.now() - timeWindow;
    const recent = data.filter((d) => d.timestamp > cutoff);

    if (recent.length === 0) return null;

    const latencies = recent.map((d) => d.latency || 0);
    const errors = recent.filter((d) => d.error).length;

    return {
      templateId,
      timeWindow: timeWindow / (60 * 60 * 1000) + 'h',
      sampleSize: recent.length,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: this.percentile(latencies, 0.95),
      errorRate: errors / recent.length,
      successRate: (recent.length - errors) / recent.length,
    };
  }

  // Template recommendation based on performance
  recommendTemplate(category, criteria = {}) {
    const templates = Array.from(this.templates.values()).filter(
      (t) => t.category === category
    );

    if (templates.length === 0) return null;

    // Score templates based on performance
    const scored = templates.map((template) => {
      const perf = this.getTemplatePerformance(template.id);

      let score = 0;
      if (perf) {
        score = perf.successRate * 100 - perf.avgLatency * 0.01; // Simple scoring
      }

      return { template, score, performance: perf };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0];
  }

  // Template health check
  async validateAllTemplates() {
    const results = [];

    const templateFiles = fs
      .readdirSync(this.templateDir)
      .filter((f) => f.endsWith('.json'));

    for (const file of templateFiles) {
      const templateId = path.basename(file, '.json');

      try {
        await this.loadTemplate(templateId);
        results.push({ templateId, status: 'valid' });
      } catch (error) {
        results.push({
          templateId,
          status: 'invalid',
          error: error.message,
        });
      }
    }

    return results;
  }

  clearCache() {
    this.templates.clear();
    logger.info('Template cache cleared');
  }
}

/**
 * Health Check CLI Command
 *
 * Comprehensive system health check and diagnostics
 */

import {
  healthChecker,
  commonHealthChecks,
  systemMetrics,
} from '../utils/monitoring.js';
import { getProvider } from '../providers/provider.js';
import {
  ConfigManager,
  PROVIDER_CONFIG_SCHEMA,
} from '../utils/configManager.js';
import { logger } from '../utils/observability.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runHealthCheck() {
  console.log('🏥 Content Buddy Health Check');
  console.log('==============================\n');

  // Initialize health checks
  await setupHealthChecks();

  // Run all checks
  const results = await healthChecker.runAll();

  // Display results
  displayHealthResults(results);

  // Display system metrics
  displaySystemMetrics();

  // Exit with appropriate code
  const hasFailures = results.checks.some(
    (check) => check.status !== 'healthy'
  );
  process.exit(hasFailures ? 1 : 0);
}

async function setupHealthChecks() {
  try {
    // Environment variables check
    const requiredEnvVars = ['NODE_ENV'];
    healthChecker.register(
      'environment',
      commonHealthChecks.envVars(requiredEnvVars),
      { critical: true, description: 'Required environment variables' }
    );

    // Memory usage check
    healthChecker.register(
      'memory',
      commonHealthChecks.memory(2000), // 2GB limit
      { critical: false, description: 'Memory usage within limits' }
    );

    // Configuration validation
    healthChecker.register(
      'configuration',
      async () => {
        const configManager = new ConfigManager(
          path.join(__dirname, '../../configs')
        );

        try {
          const providerConfig = await configManager.loadConfig(
            'providers',
            PROVIDER_CONFIG_SCHEMA
          );
          return {
            status: 'valid',
            defaultProvider: providerConfig.defaultProvider,
            providersConfigured: Object.keys(providerConfig.providers).length,
          };
        } catch (error) {
          throw new Error(`Configuration validation failed: ${error.message}`);
        }
      },
      { critical: true, description: 'Configuration files valid' }
    );

    // Provider connectivity
    healthChecker.register(
      'providers',
      async () => {
        try {
          const provider = await getProvider();

          // Test with a minimal request
          const start = Date.now();
          await provider.generateText('Health check test', { maxTokens: 5 });
          const responseTime = Date.now() - start;

          return {
            status: 'connected',
            responseTime,
            provider: process.env.PROVIDER || 'default',
          };
        } catch (error) {
          throw new Error(`Provider connectivity failed: ${error.message}`);
        }
      },
      {
        critical: true,
        description: 'AI provider connectivity',
        timeout: 10000,
      }
    );

    // Template validation
    healthChecker.register(
      'templates',
      async () => {
        const { loadTemplate } = await import('../utils/prompting.js');

        const templates = [
          'draft_scaffold@1.0.0',
          'section_expand@1.0.0',
          'rewrite_localize@1.0.0',
          'summarize_grounded@1.0.0',
          'repurpose_pack@1.0.0',
        ];

        const results = {};
        for (const templateId of templates) {
          try {
            await loadTemplate(templateId);
            results[templateId] = 'valid';
          } catch (error) {
            results[templateId] = `invalid: ${error.message}`;
          }
        }

        const invalid = Object.values(results).filter(
          (r) => r !== 'valid'
        ).length;
        if (invalid > 0) {
          throw new Error(`${invalid} templates are invalid`);
        }

        return {
          templatesChecked: templates.length,
          allValid: true,
          details: results,
        };
      },
      { critical: true, description: 'Template files valid' }
    );

    // Style pack validation
    healthChecker.register(
      'stylepack',
      async () => {
        const { loadStylePack } = await import('../utils/prompting.js');

        try {
          const stylePack = await loadStylePack();

          const requiredFields = ['brand_voice', 'reading_level'];
          const missing = requiredFields.filter((field) => !stylePack[field]);

          if (missing.length > 0) {
            throw new Error(`Style pack missing fields: ${missing.join(', ')}`);
          }

          return {
            status: 'valid',
            brandVoice: stylePack.brand_voice,
            readingLevel: stylePack.reading_level,
            mustUseTerms: (stylePack.must_use || []).length,
            mustAvoidTerms: (stylePack.must_avoid || []).length,
          };
        } catch (error) {
          throw new Error(`Style pack validation failed: ${error.message}`);
        }
      },
      { critical: false, description: 'Style pack configuration' }
    );
  } catch (error) {
    logger.error('Failed to setup health checks', { error: error.message });
    throw error;
  }
}

function displayHealthResults(results) {
  console.log(
    `Overall Status: ${getStatusEmoji(
      results.status
    )} ${results.status.toUpperCase()}`
  );
  console.log(`Timestamp: ${results.timestamp}\n`);

  console.log('Individual Checks:');
  console.log('------------------');

  for (const check of results.checks) {
    const emoji = getStatusEmoji(check.status);
    const duration = check.duration ? `(${check.duration}ms)` : '';

    console.log(`${emoji} ${check.name} ${duration}`);

    if (check.details && typeof check.details === 'object') {
      for (const [key, value] of Object.entries(check.details)) {
        console.log(`  ${key}: ${value}`);
      }
    }

    if (check.error) {
      console.log(`  Error: ${check.error}`);
    }
    console.log();
  }
}

function displaySystemMetrics() {
  console.log('System Metrics:');
  console.log('---------------');

  const metrics = systemMetrics.getMetrics();

  console.log(
    `Uptime: ${Math.floor(metrics.uptime / 60)}m ${metrics.uptime % 60}s`
  );
  console.log(
    `Memory Usage: ${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB heap`
  );
  console.log(`RSS: ${metrics.memory.rss}MB`);
  console.log(
    `Requests: ${metrics.requests.total} (${(
      metrics.requests.successRate * 100
    ).toFixed(1)}% success rate)`
  );
  console.log(`Process ID: ${metrics.process.pid}`);
  console.log(`Node Version: ${metrics.process.version}`);
  console.log(`Platform: ${metrics.process.platform}`);
}

function getStatusEmoji(status) {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'unhealthy':
      return '❌';
    case 'error':
      return '⚠️';
    default:
      return '❓';
  }
}

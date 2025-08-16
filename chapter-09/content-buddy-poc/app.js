#!/usr/bin/env node

/**
 * Content Buddy POC Application Entry Point
 * Integrates all production utilities and provides CLI interface
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import process from 'process';
import { ConfigManager } from './src/utils/configManager.js';
import { ErrorHandling } from './src/utils/errorHandling.js';
import { Observability } from './src/utils/observability.js';
import { Monitoring } from './src/utils/monitoring.js';
import { ProviderManager } from './src/utils/providerManager.js';
import { TemplateManager } from './src/utils/templateManager.js';
import { ContentBuddy } from './src/ContentBuddy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Application {
  constructor() {
    this.isShuttingDown = false;
    this.components = {};
  }

  async initialize() {
    try {
      // Initialize configuration
      this.components.config = new ConfigManager();
      await this.components.config.initialize();

      // Initialize observability
      this.components.observability = new Observability(
        this.components.config.get('observability', {})
      );

      // Initialize error handling
      this.components.errorHandling = new ErrorHandling(
        this.components.config.get('errorHandling', {})
      );

      // Initialize monitoring
      this.components.monitoring = new Monitoring(
        this.components.config.get('monitoring', {})
      );
      await this.components.monitoring.start();

      // Initialize provider manager
      this.components.providerManager = new ProviderManager(
        this.components.config.get('providers', {}),
        {
          observability: this.components.observability,
          errorHandling: this.components.errorHandling,
        }
      );

      // Initialize template manager
      this.components.templateManager = new TemplateManager(
        this.components.config.get('templates', {}),
        {
          observability: this.components.observability,
          errorHandling: this.components.errorHandling,
        }
      );

      // Initialize main application
      this.components.contentBuddy = new ContentBuddy({
        providerManager: this.components.providerManager,
        templateManager: this.components.templateManager,
        config: this.components.config,
        observability: this.components.observability,
      });

      this.setupGracefulShutdown();
      this.components.observability.info(
        'Application initialized successfully'
      );
    } catch (error) {
      console.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      this.components.observability?.info(
        `Received ${signal}, shutting down gracefully`
      );

      try {
        // Stop monitoring
        if (this.components.monitoring) {
          await this.components.monitoring.stop();
        }

        // Close any open connections
        if (this.components.providerManager) {
          await this.components.providerManager.cleanup();
        }

        this.components.observability?.info(
          'Application shut down successfully'
        );
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      this.components.observability?.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.components.observability?.error(
        'Unhandled rejection at:',
        promise,
        'reason:',
        reason
      );
      shutdown('unhandledRejection');
    });
  }

  async run(command, args = []) {
    switch (command) {
      case 'health':
        return await this.runHealthCheck();

      case 'generate':
        return await this.runGenerate(args);

      case 'evaluate':
        return await this.runEvaluate(args);

      case 'validate':
        return await this.runValidate();

      case 'help':
      default:
        this.showHelp();
        return;
    }
  }

  async runHealthCheck() {
    try {
      const health = await this.components.monitoring.getHealthStatus();
      console.log(JSON.stringify(health, null, 2));

      if (health.status !== 'healthy') {
        process.exit(1);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  }

  async runGenerate(args) {
    try {
      const [templateName, inputFile, outputFile] = args;

      if (!templateName || !inputFile) {
        console.error('Usage: generate <template> <input-file> [output-file]');
        process.exit(1);
      }

      const result = await this.components.contentBuddy.generate({
        template: templateName,
        inputFile,
        outputFile,
      });

      console.log('Generation completed successfully:', result);
    } catch (error) {
      this.components.observability.error('Generation failed:', error);
      console.error('Generation failed:', error.message);
      process.exit(1);
    }
  }

  async runEvaluate(args) {
    try {
      const [templateName] = args;

      const results = await this.components.contentBuddy.evaluate({
        template: templateName,
      });

      console.log('Evaluation completed:', results);
    } catch (error) {
      this.components.observability.error('Evaluation failed:', error);
      console.error('Evaluation failed:', error.message);
      process.exit(1);
    }
  }

  async runValidate() {
    try {
      const validation =
        await this.components.templateManager.validateAllTemplates();
      console.log('Validation results:', validation);

      if (!validation.valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
Content Buddy POC - AI-Powered Content Generation

Usage: node app.js <command> [args]

Commands:
  health                     Check system health and component status
  generate <template> <input> [output]  Generate content using specified template
  evaluate [template]        Run evaluation tests
  validate                   Validate all templates and configurations
  help                       Show this help message

Examples:
  node app.js health
  node app.js generate repurpose_pack@1.0.0 input.json output.json
  node app.js evaluate
  node app.js validate

Environment Variables:
  NODE_ENV                   Application environment (development/production)
  LOG_LEVEL                  Logging level (debug/info/warn/error)
  PROVIDER                   Default AI provider (openai/anthropic/gemini)
  
For more information, see README.md
        `);
  }
}

// Main execution
async function main() {
  const app = new Application();
  await app.initialize();

  const command = process.argv[2] || 'help';
  const args = process.argv.slice(3);

  await app.run(command, args);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { Application };

/**
 * SPOT Main Application Class
 * Orchestrates content generation using AI providers, templates, and style packs
 */

import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { compilePrompt, loadStylePack } from './utils/prompting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SPOT {
  constructor(options = {}) {
    this.providerManager = options.providerManager;
    this.templateManager = options.templateManager;
    this.config = options.config;
    this.observability = options.observability;

    this.metrics = {
      generationsCount: 0,
      evaluationsCount: 0,
      errors: 0,
      totalLatency: 0,
    };
  }

  /**
   * Generate content using specified template and input
   */
  async generate(options) {
    const startTime = Date.now();
    const { template, inputFile, outputFile, provider, content } = options;

    try {
      this.observability.info('Starting content generation', {
        template,
        inputFile,
        outputFile,
        provider,
      });

      // Load and validate template
      const templateConfig = await this.templateManager.getTemplate(template);

      // Load input data
      let inputData;

      if (content) {
        // Content provided directly (API usage)
        inputData = content;
      } else if (inputFile) {
        // Content from file (CLI usage)
        const inputPath = resolve(inputFile);

        try {
          const rawData = await readFile(inputPath, 'utf-8');

          // Try to parse as JSON first
          if (inputFile.endsWith('.json')) {
            inputData = JSON.parse(rawData);
          } else {
            // For non-JSON files, create a wrapper object with common mappings
            const fileExt = inputFile.split('.').pop();
            inputData = {
              content: rawData,
              file_type: fileExt,
              file_name: inputPath.split('/').pop(),

              // Common template input mappings
              markdown: rawData, // for repurpose_pack
              transcript_text: rawData, // for summarize_grounded
              text: rawData, // general text input
              mode: 'executive', // default mode for summarize templates
              channel_constraints: JSON.stringify({
                // default channel constraints
                twitter: { max_length: 280, tone: 'engaging' },
                linkedin: { max_length: 1300, tone: 'professional' },
                email: { max_length: 2000, tone: 'friendly' },
              }),
            };
          }
        } catch (error) {
          throw new Error(`Failed to load input file: ${error.message}`);
        }
      } else {
        throw new Error('Either content or inputFile must be provided');
      }

      // Validate input against template requirements
      await this.validateInput(inputData, templateConfig);

      // Get AI provider
      const aiProvider = await this.providerManager.getProvider(
        provider ||
          templateConfig.provider ||
          this.config.get('provider', 'openai')
      );

      // Execute generation workflow
      const result = await this.executeGeneration(
        inputData,
        templateConfig,
        aiProvider
      );

      // Save output if specified
      if (outputFile) {
        const outputPath = resolve(outputFile);
        await writeFile(outputPath, JSON.stringify(result, null, 2));
      }

      // Update metrics
      this.metrics.generationsCount++;
      this.metrics.totalLatency += Date.now() - startTime;

      this.observability.info('Content generation completed', {
        template,
        duration: Date.now() - startTime,
        outputLength: JSON.stringify(result).length,
      });

      return {
        success: true,
        result,
        metadata: {
          template,
          provider: aiProvider.name,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.metrics.errors++;
      this.observability.error('Content generation failed', error, {
        template,
        inputFile,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Execute the generation workflow
   */
  async executeGeneration(inputData, templateConfig, provider) {
    // Load style pack
    const stylePack = await loadStylePack();

    // Compile the prompt using the existing prompting utilities
    const compiledPrompt = compilePrompt(templateConfig, inputData, stylePack);

    // Build the full prompt text for the provider
    let promptText;
    if (typeof compiledPrompt === 'string') {
      promptText = compiledPrompt;
    } else {
      // Combine system and user prompts
      promptText = `${compiledPrompt.system}\n\nUser: ${compiledPrompt.user}`;

      // Add style pack information if available
      if (compiledPrompt.stylePack && compiledPrompt.stylePack.brand_voice) {
        promptText += `\n\nBrand voice: ${compiledPrompt.stylePack.brand_voice}`;
      }
      if (compiledPrompt.stylePack && compiledPrompt.stylePack.reading_level) {
        promptText += `\nTarget reading level: ${compiledPrompt.stylePack.reading_level}`;
      }
    }

    // Generate content using the provider
    const response = await provider.generateText(promptText, {
      maxTokens: 2000,
      temperature: 0.7,
    });

    // Return structured result
    return {
      content: response,
      template: templateConfig.id,
      version: templateConfig.version,
      metadata: {
        provider: provider.constructor.name,
        timestamp: new Date().toISOString(),
        inputKeys: Object.keys(inputData),
      },
    };
  }

  /**
   * Validate input data against template requirements
   */
  async validateInput(inputData, templateConfig) {
    const required = templateConfig.inputs || [];

    for (const field of required) {
      if (!(field in inputData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return true;
  }

  /**
   * Run evaluation tests
   */
  async evaluate(options = {}) {
    const startTime = Date.now();

    try {
      this.observability.info('Starting evaluation', options);

      // Load golden set data
      const goldenSetPath = resolve(__dirname, '../golden_set');
      const evaluationResults = {};

      // Run evaluations for each category
      const categories = [
        'briefs',
        'repurposing',
        'transcripts',
        'edge-cases',
        'performance',
        'style-compliance',
        'multi-format',
        'context-preservation',
        'error-handling',
      ];

      for (const category of categories) {
        try {
          const categoryResults = await this.evaluateCategory(
            join(goldenSetPath, category),
            options.template
          );
          evaluationResults[category] = categoryResults;
        } catch (error) {
          this.observability.warn(
            `Failed to evaluate category ${category}`,
            error
          );
          evaluationResults[category] = { error: error.message };
        }
      }

      // Calculate overall metrics
      const summary = this.calculateEvaluationSummary(evaluationResults);

      this.metrics.evaluationsCount++;

      this.observability.info('Evaluation completed', {
        duration: Date.now() - startTime,
        summary,
      });

      return {
        success: true,
        results: evaluationResults,
        summary,
        metadata: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.metrics.errors++;
      this.observability.error('Evaluation failed', error);
      throw error;
    }
  }

  /**
   * Evaluate a specific category
   */
  async evaluateCategory(categoryPath, templateFilter) {
    // This would implement the actual evaluation logic
    // For now, returning a placeholder
    return {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  /**
   * Calculate evaluation summary statistics
   */
  calculateEvaluationSummary(results) {
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    for (const [category, result] of Object.entries(results)) {
      if (result.error) continue;

      totalPassed += result.passed || 0;
      totalFailed += result.failed || 0;
      totalTests += (result.passed || 0) + (result.failed || 0);
    }

    return {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
    };
  }

  /**
   * Get application metrics
   */
  getMetrics() {
    const avgLatency =
      this.metrics.generationsCount > 0
        ? this.metrics.totalLatency / this.metrics.generationsCount
        : 0;

    return {
      ...this.metrics,
      averageLatency: Math.round(avgLatency),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    try {
      // Check provider availability
      const provider = await this.providerManager.getProvider();
      const providerHealth = await provider.healthCheck();

      // Check template system
      const templateHealth = await this.templateManager.validateAllTemplates();

      return {
        status: 'healthy',
        components: {
          provider: providerHealth,
          templates: templateHealth,
          metrics: this.getMetrics(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

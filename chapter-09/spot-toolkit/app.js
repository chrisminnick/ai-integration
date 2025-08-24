#!/usr/bin/env node

/**
 * SPOT Application Entry Point
 * Integrates all production utilities and provides CLI interface
 */

import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import process from 'process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { ConfigManager } from './src/utils/configManager.js';
import { ErrorHandling } from './src/utils/errorHandling.js';
import { Observability } from './src/utils/observability.js';
import { Monitoring } from './src/utils/monitoring.js';
import { ProviderManager } from './src/utils/providerManager.js';
import { TemplateManager } from './src/utils/templateManager.js';
import { SPOT } from './src/SPOT.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class InteractiveMenu {
  constructor(app) {
    this.app = app;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  // Helper method to scan for available input files
  scanInputFiles() {
    const inputFiles = [];
    const contentDirs = [
      'my_content',
      'golden_set/repurposing',
      'golden_set/transcripts',
      'golden_set/performance',
      'golden_set/briefs',
      'golden_set/domain_specific',
      'golden_set/edge_cases',
    ];

    for (const dir of contentDirs) {
      const fullPath = path.resolve(dir);

      try {
        if (fs.existsSync(fullPath)) {
          const files = fs.readdirSync(fullPath);

          for (const file of files) {
            const filePath = path.join(fullPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
              const ext = path.extname(file).toLowerCase();
              // Include common content file types
              if (['.md', '.txt', '.json', '.html'].includes(ext)) {
                inputFiles.push({
                  name: file,
                  path: path.relative(process.cwd(), filePath),
                  directory: dir,
                  size: Math.round(stat.size / 1024), // Size in KB
                });
              }
            }
          }
        }
      } catch (error) {
        // Silently skip directories that can't be read
        continue;
      }
    }

    return inputFiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  async showMainMenu() {
    console.log('\n📝 SPOT - Structured Prompt Output Toolkit');
    console.log('==================================================');
    console.log('1. Health Check');
    console.log('2. Generate Content');
    console.log('3. Scaffold Content');
    console.log('4. Run Evaluations');
    console.log('5. Validate Templates');
    console.log('6. Help & Information');
    console.log('7. Exit');
    console.log('==================================================');

    const choice = await this.prompt('Select an option (1-7): ');
    return choice.trim();
  }

  async handleHealthCheck() {
    console.log('\n🔍 Running Health Check...\n');
    await this.app.runHealthCheck();
    await this.prompt('\nPress Enter to continue...');
  }

  async handleGenerate() {
    console.log('\n🚀 Generate Content');
    console.log('Available templates:');

    // Define templates with their descriptions
    const templates = [
      {
        name: 'draft_scaffold@1.0.0',
        purpose:
          'Brief → Scaffold (JSON) - Create content outlines from briefs',
      },
      {
        name: 'section_expand@1.0.0',
        purpose:
          'Section → Draft prose - Expand scaffolds into detailed content',
      },
      {
        name: 'repurpose_pack@1.0.0',
        purpose:
          'Multi-channel repurposing - Adapt content for different platforms',
      },
      {
        name: 'rewrite_localize@1.0.0',
        purpose:
          'Rewrite/localize text with constraints - Adapt content for different audiences',
      },
      {
        name: 'summarize_grounded@1.0.0',
        purpose:
          'Summarize with timestamped citations - Extract key points from transcripts',
      },
    ];

    // Display numbered list of templates
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   ${template.purpose}`);
    });

    const selection = await this.prompt('\nEnter template number (1-5): ');
    const templateNumber = parseInt(selection.trim());

    if (
      isNaN(templateNumber) ||
      templateNumber < 1 ||
      templateNumber > templates.length
    ) {
      console.log('❌ Please enter a valid template number (1-5)');
      return;
    }

    const templateName = templates[templateNumber - 1].name;

    // Provider selection
    console.log('\nAvailable providers:');
    console.log('1. OpenAI (GPT-4) - Requires OPENAI_API_KEY');
    console.log('2. Anthropic (Claude) - Requires ANTHROPIC_API_KEY');
    console.log('3. Google Gemini - Requires GEMINI_API_KEY');
    console.log('4. Mock Provider (for testing)');

    const providerSelection = await this.prompt(
      '\nEnter provider number (1-4): '
    );
    const providerNumber = parseInt(providerSelection.trim());

    let selectedProvider;
    let requiredApiKey;

    switch (providerNumber) {
      case 1:
        selectedProvider = 'openai';
        requiredApiKey = 'OPENAI_API_KEY';
        break;
      case 2:
        selectedProvider = 'anthropic';
        requiredApiKey = 'ANTHROPIC_API_KEY';
        break;
      case 3:
        selectedProvider = 'gemini';
        requiredApiKey = 'GEMINI_API_KEY';
        break;
      case 4:
        selectedProvider = 'mock';
        requiredApiKey = null;
        break;
      default:
        console.log('❌ Please enter a valid provider number (1-4)');
        return;
    }

    // Check if API key is available (except for mock provider)
    if (selectedProvider !== 'mock' && requiredApiKey) {
      const apiKey = process.env[requiredApiKey];
      if (!apiKey) {
        console.log(`❌ ${requiredApiKey} environment variable not found.`);
        console.log(
          `Please set your API key: export ${requiredApiKey}=your_key_here`
        );
        console.log('Or select Mock Provider (option 4) for testing.');
        return;
      }
      console.log(`✅ Using ${selectedProvider} provider`);
    } else if (selectedProvider === 'mock') {
      console.log('✅ Using mock provider (test mode)');
    }

    // Show available input files
    console.log('\n📁 Available input files:');
    const inputFiles = this.scanInputFiles();

    if (inputFiles.length === 0) {
      console.log(
        'No input files found. Create files in my_content/ or golden_set/'
      );
    } else {
      console.log('─'.repeat(70));
      inputFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.path})`);
      });
      console.log('─'.repeat(70));
    }

    let inputFilePath;

    if (inputFiles.length > 0) {
      const choice = await this.prompt(
        '\nEnter file number (1-' + inputFiles.length + ') or custom path: '
      );
      const choiceNum = parseInt(choice.trim());

      if (choiceNum >= 1 && choiceNum <= inputFiles.length) {
        inputFilePath = inputFiles[choiceNum - 1].path;
      } else {
        inputFilePath = choice.trim();
      }
    } else {
      inputFilePath = await this.prompt('Enter input file path: ');
      if (!inputFilePath.trim()) {
        console.log('❌ Input file path is required');
        return;
      }
      inputFilePath = inputFilePath.trim();
    }

    const outputFile = await this.prompt('Enter output file path (optional): ');

    try {
      // Special handling for section_expand template with JSON input files
      if (
        templateName.trim() === 'section_expand@1.0.0' &&
        inputFilePath.endsWith('.json')
      ) {
        const fs = await import('fs');
        const scaffoldContent = fs.readFileSync(inputFilePath, 'utf8');
        const scaffold = JSON.parse(scaffoldContent);

        // Check if the file has sections
        if (scaffold.sections && Array.isArray(scaffold.sections)) {
          console.log('\n📑 Available sections to expand:');
          console.log('─'.repeat(70));

          scaffold.sections.forEach((section, index) => {
            console.log(`${index + 1}. ${section.heading}`);
          });

          console.log('─'.repeat(70));

          const sectionChoice = await this.prompt(
            `\nSelect section to expand (1-${scaffold.sections.length}): `
          );
          const sectionIndex = parseInt(sectionChoice.trim()) - 1;

          if (sectionIndex >= 0 && sectionIndex < scaffold.sections.length) {
            // Extract the selected section
            const selectedSection = scaffold.sections[sectionIndex];

            // Create section_json parameter
            const sectionJson = JSON.stringify(selectedSection);

            console.log('\n⏳ Expanding section...');

            // Run with the selected section as parameter
            const { spawn } = await import('child_process');
            const args = [
              'src/cli.js',
              'expand',
              '--section_json',
              sectionJson,
            ];

            if (outputFile.trim()) {
              args.push('--output', outputFile.trim());
            }

            const child = spawn('node', args, { stdio: 'inherit' });

            await new Promise((resolve, reject) => {
              child.on('close', (code) => {
                if (code === 0) {
                  if (outputFile.trim()) {
                    console.log(
                      `✅ Expanded content saved to: ${outputFile.trim()}`
                    );
                  }
                  resolve();
                } else {
                  reject(new Error(`Expand command failed with code ${code}`));
                }
              });
              child.on('error', reject);
            });

            await this.prompt('\nPress Enter to continue...');
            return;
          } else {
            console.log('❌ Invalid section selection');
            await this.prompt('\nPress Enter to continue...');
            return;
          }
        }
      }

      // Default behavior for other templates
      console.log('\n⏳ Generating content...');
      await this.app.runGenerate([
        templateName.trim(),
        inputFilePath,
        outputFile.trim(),
        selectedProvider,
      ]);

      if (outputFile.trim()) {
        console.log(`✅ Content saved to: ${outputFile.trim()}`);
      }
    } catch (error) {
      console.log(`❌ Generation failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async handleScaffold() {
    console.log('\n🏗️  Scaffold Content');

    const assetType = await this.prompt(
      'Enter asset type (e.g., "blog post", "article"): '
    );
    if (!assetType.trim()) {
      console.log('❌ Asset type is required');
      return;
    }

    const topic = await this.prompt('Enter topic: ');
    if (!topic.trim()) {
      console.log('❌ Topic is required');
      return;
    }

    const audience = await this.prompt('Enter target audience: ');
    if (!audience.trim()) {
      console.log('❌ Audience is required');
      return;
    }

    const tone = await this.prompt(
      'Enter tone (e.g., "professional", "casual"): '
    );
    if (!tone.trim()) {
      console.log('❌ Tone is required');
      return;
    }

    const wordCount =
      (await this.prompt('Enter word count (default: 600): ')) || '600';
    const outputFile = await this.prompt('Enter output file path (optional): ');

    try {
      console.log('\n⏳ Creating scaffold...');

      // Build the command arguments
      const args = [
        '--asset_type',
        assetType.trim(),
        '--topic',
        topic.trim(),
        '--audience',
        audience.trim(),
        '--tone',
        tone.trim(),
        '--word_count',
        wordCount.trim(),
      ];

      if (outputFile.trim()) {
        args.push('--output', outputFile.trim());
      }

      // Execute scaffold command using child_process
      const { spawn } = await import('child_process');
      const child = spawn('node', ['src/cli.js', 'scaffold', ...args], {
        stdio: 'inherit',
      });

      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            if (outputFile.trim()) {
              console.log(`✅ Scaffold saved to: ${outputFile.trim()}`);
            }
            resolve();
          } else {
            reject(new Error(`Scaffold command failed with code ${code}`));
          }
        });
        child.on('error', reject);
      });
    } catch (error) {
      console.log(`❌ Scaffold failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async handleEvaluate() {
    console.log('\n📊 Run Evaluations');
    console.log('1. Evaluate a generated file');
    console.log('2. Run evaluation suite on templates');
    console.log('3. Back to main menu');

    const choice = await this.prompt('\nSelect an option (1-3): ');

    switch (choice.trim()) {
      case '1':
        // Show available files to evaluate
        console.log('\n📁 Select a file to evaluate:');
        const inputFiles = this.scanInputFiles();

        if (inputFiles.length === 0) {
          console.log('No input files found. Generate content first.');
          await this.prompt('\nPress Enter to continue...');
          return;
        }

        // Display files
        console.log('─'.repeat(70));
        inputFiles.forEach((file, index) => {
          console.log(`${index + 1}. ${file.name} (${file.path})`);
        });
        console.log('─'.repeat(70));

        const fileChoice = await this.prompt(
          '\nEnter file number (1-' + inputFiles.length + ') or path: '
        );

        let filePath;
        const fileChoiceNum = parseInt(fileChoice.trim());
        if (fileChoiceNum >= 1 && fileChoiceNum <= inputFiles.length) {
          filePath = inputFiles[fileChoiceNum - 1].path;
        } else {
          filePath = fileChoice.trim();
        }

        // Determine content type
        console.log('\n📑 Select content type:');
        console.log('1. Scaffold (JSON structure)');
        console.log('2. Expanded section (prose)');
        console.log('3. Rewritten content');
        console.log('4. Summary');
        console.log('5. Repurposed content');

        const typeChoice = await this.prompt('\nSelect content type (1-5): ');

        let operation;
        switch (typeChoice.trim()) {
          case '1':
            operation = 'scaffold';
            break;
          case '2':
            operation = 'expand';
            break;
          case '3':
            operation = 'rewrite';
            break;
          case '4':
            operation = 'summarize';
            break;
          case '5':
            operation = 'repurpose';
            break;
          default:
            operation = 'scaffold';
        }

        try {
          console.log(`\n⏳ Evaluating ${path.basename(filePath)}...`);

          // Using a simpler approach that passes the file directly
          // This avoids issues with flag parsing in runEvaluations.js
          const { spawn } = await import('child_process');

          // Just pass the file as a positional argument and the operation flag
          const args = [
            'src/eval/runEvaluations.js',
            '--operation',
            operation,
            filePath,
          ];

          const child = spawn('node', args, { stdio: 'inherit' });

          await new Promise((resolve, reject) => {
            child.on('close', (code) => {
              if (code === 0) {
                resolve();
              } else {
                reject(new Error(`Evaluation failed with code ${code}`));
              }
            });
            child.on('error', reject);
          });
        } catch (error) {
          console.log(`❌ Evaluation failed: ${error.message}`);
        }
        break;

      case '2':
        // Run standard evaluation suite
        console.log('\nAvailable templates for evaluation:');
        console.log('0. All templates');
        console.log('1. draft_scaffold@1.0.0 - Brief → Scaffold (JSON)');
        console.log('2. section_expand@1.0.0 - Section → Draft prose');
        console.log('3. repurpose_pack@1.0.0 - Multi-channel repurposing');
        console.log('4. rewrite_localize@1.0.0 - Rewrite/localize text');
        console.log('5. summarize_grounded@1.0.0 - Summarize with citations');

        const templateChoice = await this.prompt(
          'Enter template number (0 for all, 1-5 for specific): '
        );

        const templateNumber = parseInt(templateChoice.trim());
        let templateName = '';

        if (templateNumber === 0 || isNaN(templateNumber)) {
          // Run all templates
          templateName = '';
        } else if (templateNumber >= 1 && templateNumber <= 5) {
          const templateNames = [
            'draft_scaffold@1.0.0',
            'section_expand@1.0.0',
            'repurpose_pack@1.0.0',
            'rewrite_localize@1.0.0',
            'summarize_grounded@1.0.0',
          ];
          templateName = templateNames[templateNumber - 1];
        } else {
          console.log('❌ Please enter a valid template number (0-5)');
          break;
        }

        try {
          console.log('\n⏳ Running evaluation suite...');
          await this.app.runEvaluate(
            templateName.trim() ? [templateName.trim()] : []
          );
        } catch (error) {
          console.log(`❌ Evaluation failed: ${error.message}`);
        }
        break;

      case '3':
        return; // Back to main menu

      default:
        console.log('❌ Invalid choice.');
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async handleHelp() {
    console.log('\n📚 Help & Information');
    console.log('====================================');
    console.log('\n🏥 Health Check:');
    console.log(
      '   Runs system health checks including memory, disk, and system status.'
    );

    console.log('\n🚀 Generate Content:');
    console.log('   Uses AI templates to generate content from input files.');
    console.log('   Available templates:');
    console.log('   • draft_scaffold@1.0.0 - Create content scaffolds');
    console.log('   • repurpose_pack@1.0.0 - Repurpose existing content');
    console.log('   • rewrite_localize@1.0.0 - Rewrite and localize content');
    console.log('   • section_expand@1.0.0 - Expand content sections');
    console.log('   • summarize_grounded@1.0.0 - Create grounded summaries');

    console.log('\n🏗️  Scaffold Content:');
    console.log('   Interactively create structured content outlines.');
    console.log(
      '   Specify asset type, topic, audience, tone, and word count.'
    );

    console.log('\n📊 Run Evaluations:');
    console.log(
      '   Test and evaluate template performance and output quality.'
    );

    console.log('\n✅ Validate Templates:');
    console.log('   Check all templates for proper structure and validity.');

    console.log('\n💡 Tips:');
    console.log(
      '   • You can also run commands directly: node app.js <command>'
    );
    console.log('   • Set environment variables like LOG_LEVEL and PROVIDER');
    console.log('   • Check README.md for more detailed information');

    await this.prompt('\nPress Enter to continue...');
  }

  async handleValidate() {
    console.log('\n✅ Validate Templates');
    console.log('\n⏳ Validating all templates...');

    try {
      await this.app.runValidate();
    } catch (error) {
      console.log(`❌ Validation failed: ${error.message}`);
    }

    await this.prompt('\nPress Enter to continue...');
  }

  async run() {
    console.log('Welcome to SPOT Interactive Menu!');

    while (true) {
      try {
        const choice = await this.showMainMenu();

        switch (choice) {
          case '1':
            await this.handleHealthCheck();
            break;
          case '2':
            await this.handleGenerate();
            break;
          case '3':
            await this.handleScaffold();
            break;
          case '4':
            await this.handleEvaluate();
            break;
          case '5':
            await this.handleValidate();
            break;
          case '6':
            await this.handleHelp();
            break;
          case '7':
            console.log('\n👋 Goodbye!');
            this.rl.close();
            return;
          default:
            console.log('❌ Invalid choice. Please select 1-7.');
            await this.prompt('Press Enter to continue...');
        }
      } catch (error) {
        console.error('❌ An error occurred:', error.message);
        await this.prompt('Press Enter to continue...');
      }
    }
  }

  close() {
    this.rl.close();
  }
}

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
        this.components.config.get('templates.directory', './prompts')
      );

      // Initialize main application
      this.components.spot = new SPOT({
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
        this.showHelp();
        return;

      default:
        console.log(`Unknown command: ${command}`);
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
      const [templateName, inputFile, outputFile, provider] = args;

      if (!templateName || !inputFile) {
        console.error(
          'Usage: generate <template> <input-file> [output-file] [provider]'
        );
        process.exit(1);
      }

      const result = await this.components.spot.generate({
        template: templateName,
        inputFile,
        outputFile,
        provider,
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

      const results = await this.components.spot.evaluate({
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

      const hasErrors = validation.some(
        (result) => result.status === 'invalid'
      );
      if (hasErrors) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
SPOT - AI-Powered Content Generation

Usage: node app.js [command] [args]

Interactive Mode:
  node app.js                Run interactive menu (default)

Commands:
  health                     Check system health and component status
  generate <template> <input> [output]  Generate content using specified template
  evaluate [template]        Run evaluation tests
  validate                   Validate all templates and configurations
  help                       Show this help message

Examples:
  node app.js                # Start interactive menu
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

  const command = process.argv[2];
  const args = process.argv.slice(3);

  // If no command provided, show interactive menu
  if (!command) {
    const menu = new InteractiveMenu(app);
    try {
      await menu.run();
    } finally {
      menu.close();
    }
    return;
  }

  // Otherwise run the specified command
  await app.run(command, args);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { Application };

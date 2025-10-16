#!/usr/bin/env node

/**
 * SPOT API Client Examples
 * Demonstrates how to interact with the SPOT Web API
 */

import fetch from 'node-fetch';

class SPOTAPIClient {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  // Health & Info
  async getHealth() {
    return this.request('/health');
  }

  async getInfo() {
    return this.request('/api/v1/info');
  }

  // Templates
  async getTemplates() {
    return this.request('/api/v1/templates');
  }

  async getTemplate(templateId) {
    return this.request(`/api/v1/templates/${templateId}`);
  }

  async validateTemplates() {
    return this.request('/api/v1/templates/validate', { method: 'POST' });
  }

  // Providers
  async getProviders() {
    return this.request('/api/v1/providers');
  }

  async getProviderHealth(providerId) {
    return this.request(`/api/v1/providers/${providerId}/health`);
  }

  // Content Generation
  async generate(template, content, provider = null, options = {}) {
    return this.request('/api/v1/generate', {
      method: 'POST',
      body: { template, content, provider, options },
    });
  }

  async scaffold(assetType, topic, audience, tone, wordCount = 600) {
    return this.request('/api/v1/scaffold', {
      method: 'POST',
      body: {
        asset_type: assetType,
        topic,
        audience,
        tone,
        word_count: wordCount,
      },
    });
  }

  async expand(sectionJson) {
    return this.request('/api/v1/expand', {
      method: 'POST',
      body: { section_json: sectionJson },
    });
  }

  async rewrite(
    text,
    audience,
    tone,
    gradeLevel = null,
    words = null,
    locale = 'en-US'
  ) {
    return this.request('/api/v1/rewrite', {
      method: 'POST',
      body: {
        text,
        audience,
        tone,
        grade_level: gradeLevel,
        words,
        locale,
      },
    });
  }

  async summarize(content, mode = 'standard') {
    return this.request('/api/v1/summarize', {
      method: 'POST',
      body: { content, mode },
    });
  }

  async repurpose(content, channels = ['email', 'social', 'blog']) {
    return this.request('/api/v1/repurpose', {
      method: 'POST',
      body: { content, channels },
    });
  }

  // Evaluation
  async evaluate(template = null, options = {}) {
    return this.request('/api/v1/evaluate', {
      method: 'POST',
      body: { template, options },
    });
  }

  async evaluateFile(filePath, operation) {
    return this.request('/api/v1/evaluate/file', {
      method: 'POST',
      body: { filePath, operation },
    });
  }

  // Style
  async checkStyle(content) {
    return this.request('/api/v1/style/check', {
      method: 'POST',
      body: { content },
    });
  }

  async getStyleRules() {
    return this.request('/api/v1/style/rules');
  }

  // Files
  async getFiles(directory = 'my_content') {
    return this.request(`/api/v1/files?directory=${directory}`);
  }

  async uploadFile(filename, content, directory = 'my_content') {
    return this.request('/api/v1/files/upload', {
      method: 'POST',
      body: { filename, content, directory },
    });
  }
}

// Example usage functions
async function runExamples() {
  const client = new SPOTAPIClient();

  console.log('🔍 SPOT API Client Examples\n');

  try {
    // 1. Health Check
    console.log('1. Health Check');
    const health = await client.getHealth();
    console.log(`   Status: ${health.status}\n`);

    // 2. Get API Info
    console.log('2. API Info');
    const info = await client.getInfo();
    console.log(`   Version: ${info.version}`);
    console.log(`   Provider: ${info.provider}\n`);

    // 3. List Templates
    console.log('3. Available Templates');
    const { templates } = await client.getTemplates();
    templates.forEach((template) => console.log(`   - ${template}`));
    console.log();

    // 4. Create a Scaffold
    console.log('4. Creating Content Scaffold');
    const scaffoldResult = await client.scaffold(
      'blog post',
      'Privacy-first analytics for startups',
      'startup founders',
      'confident',
      800
    );
    console.log('   Scaffold created successfully!');
    console.log(
      `   Sections: ${scaffoldResult.scaffold.sections?.length || 'N/A'}\n`
    );

    // 5. Expand a Section
    if (
      scaffoldResult.scaffold.sections &&
      scaffoldResult.scaffold.sections.length > 0
    ) {
      console.log('5. Expanding Section');
      const section = scaffoldResult.scaffold.sections[0];
      const expandResult = await client.expand(JSON.stringify(section));
      console.log('   Section expanded successfully!');
      console.log(
        `   Word count: ${expandResult.expanded.word_count || 'N/A'}\n`
      );
    }

    // 6. Rewrite Content
    console.log('6. Rewriting Content');
    const rewriteResult = await client.rewrite(
      'This is a simple example of content that needs to be rewritten.',
      'technical professionals',
      'formal',
      10,
      50
    );
    console.log('   Content rewritten successfully!');
    console.log(
      `   New word count: ${rewriteResult.rewritten.word_count || 'N/A'}\n`
    );

    // 7. Style Check
    console.log('7. Style Compliance Check');
    const styleResult = await client.checkStyle(
      'This revolutionary AI solution will disruptively transform your business!'
    );
    console.log(`   Compliant: ${styleResult.compliant}`);
    console.log(`   Violations: ${styleResult.violations.length}\n`);

    // 8. List Files
    console.log('8. Available Files');
    const filesResult = await client.getFiles();
    console.log(`   Files found: ${filesResult.files.length}`);
    filesResult.files.slice(0, 3).forEach((file) => {
      console.log(`   - ${file.name} (${file.size} bytes)`);
    });
    console.log();

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Workflow example: Full content creation pipeline
async function contentWorkflowExample() {
  const client = new SPOTAPIClient();

  console.log('🚀 Content Creation Workflow Example\n');

  try {
    // Step 1: Create scaffold
    console.log('Step 1: Creating content scaffold...');
    const scaffold = await client.scaffold(
      'technical article',
      'Building secure API authentication',
      'backend developers',
      'technical',
      1200
    );
    console.log('✅ Scaffold created\n');

    // Step 2: Expand first section
    if (scaffold.scaffold.sections && scaffold.scaffold.sections.length > 0) {
      console.log('Step 2: Expanding first section...');
      const firstSection = scaffold.scaffold.sections[0];
      const expanded = await client.expand(JSON.stringify(firstSection));
      console.log('✅ Section expanded\n');

      // Step 3: Style check
      console.log('Step 3: Checking style compliance...');
      const styleCheck = await client.checkStyle(expanded.expanded.content);
      console.log(
        `✅ Style check complete (${styleCheck.violations.length} violations)\n`
      );

      // Step 4: Repurpose for different channels
      console.log('Step 4: Repurposing content...');
      const repurposed = await client.repurpose(expanded.expanded.content, [
        'email',
        'social',
        'blog',
      ]);
      console.log('✅ Content repurposed for multiple channels\n');

      console.log('🎉 Complete workflow finished successfully!');
      console.log('Generated:');
      console.log('- Original scaffold');
      console.log('- Expanded section');
      console.log('- Style-checked content');
      console.log('- Multi-channel repurposed versions');
    }
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'examples';

  switch (command) {
    case 'examples':
      await runExamples();
      break;
    case 'workflow':
      await contentWorkflowExample();
      break;
    case 'health':
      const client = new SPOTAPIClient();
      const health = await client.getHealth();
      console.log(JSON.stringify(health, null, 2));
      break;
    default:
      console.log(`
SPOT API Client Examples

Usage: node examples/api-client.js [command]

Commands:
  examples    Run basic API examples (default)
  workflow    Run complete content creation workflow
  health      Check API health

Make sure the SPOT API server is running:
  npm run api
      `);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SPOTAPIClient };

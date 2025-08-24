#!/usr/bin/env node

/**
 * Golden Set Validation Script
 *
 * This script validates that the golden set test files are properly structured
 * and can run the evaluation system to catch issues early.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOLDEN_SET_PATH = path.join(__dirname, '../golden_set');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function validateJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    const issues = [];

    // Check required fields for brief files
    if (filePath.includes('/briefs/')) {
      const requiredFields = [
        'asset_type',
        'topic',
        'audience',
        'tone',
        'word_count',
      ];
      for (const field of requiredFields) {
        if (!data[field]) {
          issues.push(`Missing required field: ${field}`);
        }
      }

      // Check metadata
      if (data.metadata) {
        if (!data.metadata.difficulty) {
          issues.push('Missing metadata.difficulty');
        }
        if (!data.metadata.category) {
          issues.push('Missing metadata.category');
        }
        if (!data.metadata.test_purpose) {
          issues.push('Missing metadata.test_purpose');
        }
      } else {
        issues.push('Missing metadata object');
      }

      // Validate word count
      if (typeof data.word_count !== 'number' || data.word_count <= 0) {
        issues.push('word_count must be a positive number');
      }
    }

    return { valid: issues.length === 0, issues };
  } catch (error) {
    return { valid: false, issues: [`JSON parse error: ${error.message}`] };
  }
}

function validateTextFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Basic checks
    if (content.trim().length === 0) {
      issues.push('File is empty');
    }

    // Check for common issues
    if (content.includes('Lorem ipsum')) {
      issues.push('Contains Lorem ipsum placeholder text');
    }

    // Check encoding
    if (content.includes('\uFFFD')) {
      issues.push('Contains replacement characters (possible encoding issue)');
    }

    return { valid: issues.length === 0, issues };
  } catch (error) {
    return { valid: false, issues: [`Read error: ${error.message}`] };
  }
}

function validateDirectory(dirPath, dirName) {
  console.log(colorize(`\n📁 Validating ${dirName}...`, 'blue'));

  if (!fs.existsSync(dirPath)) {
    console.log(colorize(`  ❌ Directory does not exist: ${dirPath}`, 'red'));
    return { files: 0, valid: 0, issues: 1 };
  }

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => !f.startsWith('.') && f !== 'README.md');

  if (files.length === 0) {
    console.log(colorize(`  ⚠️  Directory is empty`, 'yellow'));
    return { files: 0, valid: 0, issues: 1 };
  }

  let validFiles = 0;
  let totalIssues = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const ext = path.extname(file).toLowerCase();

    let result;
    if (ext === '.json') {
      result = validateJsonFile(filePath);
    } else if (ext === '.txt' || ext === '.md') {
      result = validateTextFile(filePath);
    } else {
      console.log(colorize(`  ⚠️  Unknown file type: ${file}`, 'yellow'));
      continue;
    }

    if (result.valid) {
      console.log(colorize(`  ✅ ${file}`, 'green'));
      validFiles++;
    } else {
      console.log(colorize(`  ❌ ${file}`, 'red'));
      for (const issue of result.issues) {
        console.log(colorize(`     - ${issue}`, 'red'));
      }
      totalIssues += result.issues.length;
    }
  }

  console.log(
    colorize(
      `  📊 ${validFiles}/${files.length} files valid`,
      validFiles === files.length ? 'green' : 'yellow'
    )
  );

  return { files: files.length, valid: validFiles, issues: totalIssues };
}

function checkFileNamingConvention() {
  console.log(colorize('\n📋 Checking file naming conventions...', 'blue'));

  const categories = [
    'briefs',
    'transcripts',
    'repurposing',
    'edge_cases',
    'performance',
    'style_compliance',
    'provider_comparison',
    'domain_specific',
  ];
  const issues = [];

  for (const category of categories) {
    const dirPath = path.join(GOLDEN_SET_PATH, category);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => !f.startsWith('.') && !f.endsWith('.md'));

    for (const file of files) {
      const baseName = path.basename(file, path.extname(file));

      // Expected pattern: {type}_{difficulty}_{description}
      // or just {type}_{description} for some files
      const parts = baseName.split('_');

      if (parts.length < 2) {
        issues.push(
          `${category}/${file}: Filename should follow pattern type_difficulty_description or type_description`
        );
      }

      // Check for descriptive names
      if (baseName.length < 10) {
        issues.push(`${category}/${file}: Filename should be more descriptive`);
      }
    }
  }

  if (issues.length === 0) {
    console.log(colorize('  ✅ All files follow naming conventions', 'green'));
  } else {
    console.log(colorize(`  ❌ Found ${issues.length} naming issues:`, 'red'));
    for (const issue of issues) {
      console.log(colorize(`     - ${issue}`, 'red'));
    }
  }

  return issues.length;
}

function generateCoverageReport() {
  console.log(colorize('\n📈 Generating coverage report...', 'blue'));

  const categories = {
    briefs: 'Brief scaffolding tests',
    transcripts: 'Transcript summarization tests',
    repurposing: 'Content repurposing tests',
    edge_cases: 'Edge case handling tests',
    performance: 'Performance and stress tests',
    style_compliance: 'Style pack compliance tests',
    provider_comparison: 'Cross-provider comparison tests',
    domain_specific: 'Domain expertise tests',
    expected_outputs: 'Reference outputs for validation',
  };

  const coverage = {};
  let totalFiles = 0;

  for (const [dir, description] of Object.entries(categories)) {
    const dirPath = path.join(GOLDEN_SET_PATH, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs
        .readdirSync(dirPath)
        .filter((f) => !f.startsWith('.') && !f.endsWith('.md'));
      coverage[dir] = { count: files.length, description };
      totalFiles += files.length;
    } else {
      coverage[dir] = { count: 0, description };
    }
  }

  console.log(colorize('\n  Test Coverage by Category:', 'magenta'));
  for (const [dir, info] of Object.entries(coverage)) {
    const status = info.count > 0 ? '✅' : '❌';
    console.log(`  ${status} ${info.description}: ${info.count} files`);
  }

  console.log(colorize(`\n  Total test files: ${totalFiles}`, 'blue'));

  return coverage;
}

function main() {
  console.log(colorize('🧪 Golden Set Validation Tool', 'magenta'));
  console.log('=====================================');

  const results = {
    totalFiles: 0,
    validFiles: 0,
    totalIssues: 0,
    categories: {},
  };

  // Validate each category directory
  const categories = [
    'briefs',
    'transcripts',
    'repurposing',
    'edge_cases',
    'performance',
    'style_compliance',
    'provider_comparison',
    'domain_specific',
  ];

  for (const category of categories) {
    const dirPath = path.join(GOLDEN_SET_PATH, category);
    const result = validateDirectory(dirPath, category);

    results.categories[category] = result;
    results.totalFiles += result.files;
    results.validFiles += result.valid;
    results.totalIssues += result.issues;
  }

  // Check naming conventions
  const namingIssues = checkFileNamingConvention();
  results.totalIssues += namingIssues;

  // Generate coverage report
  const coverage = generateCoverageReport();

  // Final summary
  console.log(colorize('\n📊 VALIDATION SUMMARY', 'magenta'));
  console.log('=====================');
  console.log(`Total files: ${results.totalFiles}`);
  console.log(
    `Valid files: ${colorize(
      results.validFiles,
      results.validFiles === results.totalFiles ? 'green' : 'yellow'
    )}`
  );
  console.log(
    `Total issues: ${colorize(
      results.totalIssues,
      results.totalIssues === 0 ? 'green' : 'red'
    )}`
  );

  if (results.totalIssues === 0) {
    console.log(
      colorize(
        '\n🎉 All validations passed! Golden set is ready for evaluation.',
        'green'
      )
    );
    process.exit(0);
  } else {
    console.log(
      colorize(
        '\n⚠️  Please fix the issues above before running evaluations.',
        'yellow'
      )
    );
    process.exit(1);
  }
}

main();

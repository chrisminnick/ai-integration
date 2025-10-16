#!/usr/bin/env node

/**
 * Standalone content linter - no API calls required
 * Usage: node scripts/lint-content.js <file-path>
 * Example: node scripts/lint-content.js my_content/article.txt
 */

import { lintStyle } from '../src/lint/styleLinter.js';
import { loadStylePack } from '../src/utils/prompting.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log('Usage: node scripts/lint-content.js <file-path>');
    console.log('Example: node scripts/lint-content.js my_content/article.txt');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const stylePack = await loadStylePack();
    const content = fs.readFileSync(filePath, 'utf8');
    const result = lintStyle(content, stylePack);

    console.log(`\nStyle Lint Report for: ${path.basename(filePath)}`);
    console.log('='.repeat(50));

    console.log(
      `Reading Level: ${result.readingLevel} (Target: ${stylePack.reading_level})`
    );
    console.log(`Reading Level OK: ${result.readingLevelOk ? '✅' : '❌'}`);

    if (result.banned.length > 0) {
      console.log(`\n❌ Banned terms found: ${result.banned.join(', ')}`);
    } else {
      console.log('\n✅ No banned terms found');
    }

    if (result.missingRequired.length > 0) {
      console.log(
        `❌ Missing required terms: ${result.missingRequired.join(', ')}`
      );
    } else if (stylePack.must_use && stylePack.must_use.length > 0) {
      console.log('✅ All required terms present');
    }

    console.log('\nFull Report (JSON):');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

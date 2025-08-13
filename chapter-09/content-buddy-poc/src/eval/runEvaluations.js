import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { lintStyle } from '../lint/styleLinter.js';
import {
  compilePrompt,
  loadTemplate,
  loadStylePack,
} from '../utils/prompting.js';
import { getProvider } from '../providers/provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const [, , ...args] = process.argv;
  const options = {
    files: [],
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') {
      options.help = true;
    } else if (args[i] === '--files' || args[i] === '-f') {
      // Next arguments until we hit another flag are files
      i++;
      while (i < args.length && !args[i].startsWith('-')) {
        options.files.push(args[i]);
        i++;
      }
      i--; // Back up one since the loop will increment
    } else if (!args[i].startsWith('-')) {
      // If no flag specified, treat as files
      options.files.push(args[i]);
    }
  }

  return options;
}

function showHelp() {
  console.log(`Usage: node src/eval/runEvaluations.js [options] [files...]

Options:
  -f, --files <file1> <file2> ...  Specific brief files to evaluate
  -h, --help                       Show this help message

Examples:
  node src/eval/runEvaluations.js                    # Evaluate all briefs
  node src/eval/runEvaluations.js brief1.json       # Evaluate specific file
  node src/eval/runEvaluations.js -f brief1.json brief2.json  # Multiple files
  
Files should be in the golden_set/briefs directory or provide full paths.`);
}

async function run() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const style = await loadStylePack();
  const provider = await getProvider();

  const briefsDir = path.resolve(__dirname, '../../golden_set/briefs');

  let briefs;
  if (options.files.length > 0) {
    // Use specified files
    briefs = options.files.map((f) => {
      // If it's just a filename, assume it's in the briefs directory
      if (!f.includes('/') && !f.includes('\\')) {
        return f.endsWith('.json') ? f : f + '.json';
      }
      return path.basename(f);
    });

    // Verify files exist
    const missingFiles = briefs.filter(
      (f) => !fs.existsSync(path.join(briefsDir, f))
    );
    if (missingFiles.length > 0) {
      console.error(
        `Error: The following files were not found in ${briefsDir}:`
      );
      missingFiles.forEach((f) => console.error(`  - ${f}`));
      console.error('\nAvailable files:');
      fs.readdirSync(briefsDir)
        .filter((f) => f.endsWith('.json'))
        .forEach((f) => console.error(`  - ${f}`));
      process.exit(1);
    }
  } else {
    // Use all JSON files in the directory (default behavior)
    briefs = fs.readdirSync(briefsDir).filter((f) => f.endsWith('.json'));
  }

  if (briefs.length === 0) {
    console.error('No brief files found to evaluate.');
    process.exit(1);
  }

  console.log(`Evaluating ${briefs.length} brief(s): ${briefs.join(', ')}\n`);

  const results = [];
  for (const f of briefs) {
    const brief = JSON.parse(fs.readFileSync(path.join(briefsDir, f), 'utf8'));
    const t = await loadTemplate('draft_scaffold@1.0.0');
    const compiled = compilePrompt(t, brief, style);

    const start = Date.now();
    const out = await provider.generateText(JSON.stringify(compiled));
    const latencyMs = Date.now() - start;

    // Extract text content for analysis based on the template type
    let textToAnalyze = out;

    // For scaffold templates that return JSON, extract the actual text content
    if (t.id === 'draft_scaffold') {
      try {
        const jsonOutput = JSON.parse(out);
        // Extract text from title and bullets for reading level analysis
        const textParts = [];

        if (jsonOutput.title) {
          textParts.push(jsonOutput.title + '.');
        }

        if (jsonOutput.sections) {
          jsonOutput.sections.forEach((section) => {
            if (section.heading) {
              textParts.push(section.heading + '.');
            }
            if (section.bullets) {
              section.bullets.forEach((bullet) => {
                // Ensure bullets end with periods for proper sentence detection
                const bulletText = bullet.trim();
                textParts.push(
                  bulletText + (bulletText.endsWith('.') ? '' : '.')
                );
              });
            }
          });
        }

        textToAnalyze = textParts.join(' ');
      } catch (e) {
        // If it's not valid JSON, use the raw output
        textToAnalyze = out;
      }
    }

    // Use the extracted text content for style linting
    const lint = lintStyle(textToAnalyze, style);

    results.push({
      brief: f,
      latencyMs: latencyMs,
      style: lint,
    });
  }

  const p50 = percentile(
    results.map((r) => r.latencyMs),
    50
  );
  const p95 = percentile(
    results.map((r) => r.latencyMs),
    95
  );

  console.log(
    JSON.stringify(
      {
        count: results.length,
        latency: { p50, p95 },
        samples: results,
      },
      null,
      2
    )
  );
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

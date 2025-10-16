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
    directory: null,
    operation: 'scaffold', // scaffold, expand, rewrite, summarize, repurpose
    help: false,
    extensions: ['.json', '.txt', '.md'],
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') {
      options.help = true;
    } else if (args[i] === '--directory' || args[i] === '-d') {
      if (i + 1 < args.length) {
        options.directory = args[++i];
      }
    } else if (args[i] === '--operation' || args[i] === '-o') {
      if (i + 1 < args.length) {
        options.operation = args[++i];
      }
    } else if (args[i] === '--extensions' || args[i] === '-e') {
      // Next arguments until we hit another flag are extensions
      options.extensions = [];
      i++;
      while (i < args.length && !args[i].startsWith('-')) {
        options.extensions.push(
          args[i].startsWith('.') ? args[i] : '.' + args[i]
        );
        i++;
      }
      i--; // Back up one since the loop will increment
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
  -d, --directory <path>           Directory to look for files (default: golden_set/briefs for scaffold, current dir for others)
  -o, --operation <op>             Operation type: scaffold, expand, rewrite, summarize, repurpose (default: scaffold)
  -e, --extensions <ext1> <ext2>   File extensions to process (default: .json .txt .md)
  -f, --files <file1> <file2>      Specific files to evaluate
  -h, --help                       Show this help message

Examples:
  # Evaluate all JSON briefs for scaffolding (default)
  node src/eval/runEvaluations.js
  
  # Evaluate text files in a custom directory for expansion
  node src/eval/runEvaluations.js -d ./my-content -o expand -e .txt
  
  # Evaluate specific files for rewriting
  node src/eval/runEvaluations.js -f article1.txt article2.md -o rewrite
  
  # Evaluate markdown files for repurposing
  node src/eval/runEvaluations.js -d ./articles -o repurpose -e .md

Operations:
  scaffold  - Generate content scaffolds from brief JSON files
  expand    - Expand section content from JSON or text files
  rewrite   - Rewrite content from text/markdown files
  summarize - Summarize content from text files
  repurpose - Repurpose content for multiple channels`);
}

async function processFile(filePath, operation, style, provider, template) {
  let inputData;
  let templateParams = {};

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();

  // Parse input based on file type and operation
  if (operation === 'scaffold') {
    // Scaffold expects JSON brief files
    if (ext === '.json') {
      inputData = JSON.parse(fileContent);
      templateParams = inputData;
    } else {
      throw new Error(`Scaffold operation requires JSON files, got ${ext}`);
    }
  } else if (operation === 'expand') {
    // Expand can take JSON section data or generate from text
    if (ext === '.json') {
      inputData = JSON.parse(fileContent);
      templateParams = {
        section_json: JSON.stringify(inputData),
        style_pack_rules: JSON.stringify(style),
        must_use: JSON.stringify(style.must_use || []),
        must_avoid: JSON.stringify(style.must_avoid || []),
      };
    } else {
      // For text files, create a simple section structure
      templateParams = {
        section_json: JSON.stringify({
          heading: path.basename(filePath, ext),
          bullets: fileContent
            .split('\n')
            .filter((line) => line.trim())
            .slice(0, 3),
        }),
        style_pack_rules: JSON.stringify(style),
        must_use: JSON.stringify(style.must_use || []),
        must_avoid: JSON.stringify(style.must_avoid || []),
      };
    }
  } else if (operation === 'rewrite') {
    templateParams = {
      original_text: fileContent,
      audience: 'general audience',
      tone: 'professional',
      grade_level: '8',
      words: '',
      locale: 'en-US',
    };
  } else if (operation === 'summarize') {
    templateParams = {
      mode: 'executive',
      transcript_text: fileContent,
    };
  } else if (operation === 'repurpose') {
    const channels = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../../configs/channels.json'),
        'utf8'
      )
    );
    templateParams = {
      markdown: fileContent,
      channel_constraints: JSON.stringify(channels),
    };
  }

  const compiled = compilePrompt(template, templateParams, style);

  const start = Date.now();
  const out = await provider.generateText(extractPromptText(compiled));
  const latencyMs = Date.now() - start;

  return { out, latencyMs };
}

function extractPromptText(compiled) {
  if (typeof compiled === 'string') {
    return compiled;
  }
  return (
    compiled.prompt ||
    compiled.text ||
    compiled.content ||
    JSON.stringify(compiled)
  );
}

function extractTextForAnalysis(output, operation) {
  let textToAnalyze = output;

  if (operation === 'scaffold') {
    try {
      const jsonOutput = JSON.parse(output);
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
      textToAnalyze = output;
    }
  } else if (operation === 'repurpose') {
    try {
      const jsonOutput = JSON.parse(output);
      const textParts = [];

      // Extract text from all channels
      Object.values(jsonOutput).forEach((channel) => {
        if (typeof channel === 'object') {
          Object.values(channel).forEach((value) => {
            if (typeof value === 'string') {
              textParts.push(value);
            }
          });
        }
      });

      textToAnalyze = textParts.join(' ');
    } catch (e) {
      textToAnalyze = output;
    }
  }
  // For expand, rewrite, and summarize, use output as-is

  return textToAnalyze;
}

async function run() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  const style = await loadStylePack();
  const provider = await getProvider();

  // Determine template based on operation
  const templateMap = {
    scaffold: 'draft_scaffold@1.0.0',
    expand: 'section_expand@1.0.0',
    rewrite: 'rewrite_localize@1.0.0',
    summarize: 'summarize_grounded@1.0.0',
    repurpose: 'repurpose_pack@1.0.0',
  };

  const templateId = templateMap[options.operation];
  if (!templateId) {
    console.error(`Unknown operation: ${options.operation}`);
    console.error(
      `Available operations: ${Object.keys(templateMap).join(', ')}`
    );
    process.exit(1);
  }

  const template = await loadTemplate(templateId);

  // Determine directory
  let targetDir;
  if (options.directory) {
    targetDir = path.resolve(options.directory);
  } else if (options.operation === 'scaffold') {
    targetDir = path.resolve(__dirname, '../../golden_set/briefs');
  } else {
    targetDir = process.cwd();
  }

  let filesToProcess;
  if (options.files.length > 0) {
    // Use specified files
    filesToProcess = options.files.map((f) => {
      if (path.isAbsolute(f)) {
        return f;
      } else {
        // First try resolving relative to current working directory
        const cwdPath = path.resolve(process.cwd(), f);
        if (fs.existsSync(cwdPath)) {
          return cwdPath;
        }
        // Fallback to target directory
        return path.resolve(targetDir, f);
      }
    });

    // Verify files exist
    const missingFiles = filesToProcess.filter((f) => !fs.existsSync(f));
    if (missingFiles.length > 0) {
      console.error('Error: The following files were not found:');
      missingFiles.forEach((f) => console.error(`  - ${f}`));
      process.exit(1);
    }
  } else {
    // Use all files with matching extensions in the directory
    if (!fs.existsSync(targetDir)) {
      console.error(`Error: Directory not found: ${targetDir}`);
      process.exit(1);
    }

    const allFiles = fs.readdirSync(targetDir);
    filesToProcess = allFiles
      .filter((f) => options.extensions.some((ext) => f.endsWith(ext)))
      .map((f) => path.join(targetDir, f));
  }

  if (filesToProcess.length === 0) {
    console.error(
      `No files found with extensions ${options.extensions.join(
        ', '
      )} in ${targetDir}`
    );
    process.exit(1);
  }

  console.log(
    `Evaluating ${filesToProcess.length} file(s) for operation "${options.operation}"`
  );
  console.log(
    `Files: ${filesToProcess.map((f) => path.basename(f)).join(', ')}\n`
  );

  const results = [];
  for (const filePath of filesToProcess) {
    try {
      const { out, latencyMs } = await processFile(
        filePath,
        options.operation,
        style,
        provider,
        template
      );

      const textToAnalyze = extractTextForAnalysis(out, options.operation);
      const lint = lintStyle(textToAnalyze, style);

      results.push({
        file: path.basename(filePath),
        path: filePath,
        operation: options.operation,
        latencyMs: latencyMs,
        style: lint,
        outputLength: out.length,
        textLength: textToAnalyze.length,
      });
    } catch (error) {
      console.error(`Error processing ${filePath}: ${error.message}`);
      results.push({
        file: path.basename(filePath),
        path: filePath,
        operation: options.operation,
        error: error.message,
      });
    }
  }

  const successfulResults = results.filter((r) => !r.error);
  const p50 = percentile(
    successfulResults.map((r) => r.latencyMs),
    50
  );
  const p95 = percentile(
    successfulResults.map((r) => r.latencyMs),
    95
  );

  console.log(
    JSON.stringify(
      {
        operation: options.operation,
        directory: targetDir,
        count: results.length,
        successful: successfulResults.length,
        failed: results.length - successfulResults.length,
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

function countItemsMissingCitations(output) {
  try {
    const data = JSON.parse(output);
    const items = Array.isArray(data.items) ? data.items : [];
    let missing = 0;
    for (const it of items) {
      const refs = it.source_refs || it.sources || [];
      if (!Array.isArray(refs) || refs.length === 0) missing++;
    }
    return missing;
  } catch {
    // Non-JSON outputs treated as missing citations
    return -1;
  }
}

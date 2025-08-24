#!/usr/bin/env node
import 'dotenv/config';
import { getProvider } from './providers/provider.js';
import {
  compilePrompt,
  loadTemplate,
  loadStylePack,
  fillPlaceholders,
} from './utils/prompting.js';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const [, , cmd, ...rest] = process.argv;
  const args = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      const key = rest[i].slice(2);
      const val =
        i + 1 < rest.length && !rest[i + 1].startsWith('--') ? rest[++i] : true;
      args[key] = val;
    }
  }
  return { cmd, args };
}

// Helper function to extract prompt text from compiled prompt object
function extractPromptText(compiled) {
  if (typeof compiled === 'string') {
    return compiled;
  }

  // Format the prompt with style pack information
  if (compiled.system && compiled.user && compiled.stylePack) {
    const styleInstructions = [];

    if (compiled.stylePack.brand_voice) {
      styleInstructions.push(`Brand voice: ${compiled.stylePack.brand_voice}`);
    }

    if (compiled.stylePack.reading_level) {
      styleInstructions.push(
        `Target reading level: ${compiled.stylePack.reading_level}`
      );
    }

    if (compiled.stylePack.must_use && compiled.stylePack.must_use.length > 0) {
      styleInstructions.push(
        `Must use these terms: ${compiled.stylePack.must_use.join(', ')}`
      );
    }

    if (
      compiled.stylePack.must_avoid &&
      compiled.stylePack.must_avoid.length > 0
    ) {
      styleInstructions.push(
        `Avoid these terms: ${compiled.stylePack.must_avoid.join(', ')}`
      );
    }

    const systemPrompt =
      compiled.system +
      (styleInstructions.length > 0
        ? `\n\nStyle requirements:\n${styleInstructions
            .map((s) => `- ${s}`)
            .join('\n')}`
        : '');

    return `${systemPrompt}\n\nUser: ${compiled.user}`;
  }

  // Try common property names for the actual prompt text
  return (
    compiled.prompt ||
    compiled.text ||
    compiled.content ||
    JSON.stringify(compiled)
  );
}

// Helper function to output text to console or file
function outputResult(text, outputFile) {
  if (outputFile) {
    fs.writeFileSync(path.resolve(outputFile), text, 'utf8');
    console.log(`Output written to: ${outputFile}`);
  } else {
    console.log(text);
  }
}

async function main() {
  const { cmd, args } = parseArgs();
  const provider = await getProvider();

  if (cmd === 'scaffold') {
    const t = await loadTemplate('draft_scaffold@1.0.0');
    const style = await loadStylePack();
    const compiled = compilePrompt(
      t,
      {
        asset_type: args.asset_type,
        topic: args.topic,
        audience: args.audience,
        tone: args.tone,
        word_count: args.word_count,
      },
      style
    );
    const promptText = extractPromptText(compiled);
    const out = await provider.generateText(promptText);
    outputResult(out, args.output);
  } else if (cmd === 'expand') {
    const t = await loadTemplate('section_expand@1.0.0');
    const style = await loadStylePack();
    const section_json = args.section_json || '';
    const compiled = compilePrompt(
      t,
      {
        section_json,
        style_pack_rules: JSON.stringify(style),
        must_use: JSON.stringify(style.must_use || []),
        must_avoid: JSON.stringify(style.must_avoid || []),
      },
      style
    );
    const promptText = extractPromptText(compiled);
    const out = await provider.generateText(promptText);
    outputResult(out, args.output);
  } else if (cmd === 'rewrite') {
    const t = await loadTemplate('rewrite_localize@1.0.0');
    const style = await loadStylePack();
    const compiled = compilePrompt(
      t,
      {
        original_text: args.text || '',
        audience: args.audience || '',
        tone: args.tone || '',
        grade_level: args.grade_level || '',
        words: args.words || '',
        locale: args.locale || '',
      },
      style
    );
    const promptText = extractPromptText(compiled);
    const out = await provider.generateText(promptText);
    outputResult(out, args.output);
  } else if (cmd === 'summarize') {
    const t = await loadTemplate('summarize_grounded@1.0.0');
    const style = await loadStylePack();
    const file = args.file;
    const mode = args.mode || 'executive';
    const transcript_text = file
      ? fs.readFileSync(path.resolve(file), 'utf8')
      : '';
    const compiled = compilePrompt(t, { mode, transcript_text }, style);
    const promptText = extractPromptText(compiled);
    const out = await provider.generateText(promptText);
    outputResult(out, args.output);
  } else if (cmd === 'repurpose') {
    const t = await loadTemplate('repurpose_pack@1.0.0');
    const channels = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../configs/channels.json'),
        'utf8'
      )
    );
    const file = args.file;
    const markdown = file ? fs.readFileSync(path.resolve(file), 'utf8') : '';
    const compiled = compilePrompt(
      t,
      { markdown, channel_constraints: JSON.stringify(channels) },
      {}
    );
    const promptText = extractPromptText(compiled);
    const out = await provider.generateText(promptText);
    outputResult(out, args.output);
  } else {
    console.log(`Unknown command: ${cmd}
Usage:
  node src/cli.js scaffold --asset_type ... --topic ... --audience ... --tone ... --word_count 600 [--output file.txt]
  node src/cli.js expand --section_json '<json>' [--output file.txt]
  node src/cli.js rewrite --text '...' --audience '...' --tone '...' --grade_level 8 [--output file.txt]
  node src/cli.js summarize --file path/to/transcript.txt --mode executive [--output file.txt]
  node src/cli.js repurpose --file path/to/article.md [--output file.txt]

Options:
  --output <file>    Write output to file instead of console`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

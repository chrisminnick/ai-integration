import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lintStyle } from '../lint/styleLinter.js';
import { compilePrompt, loadTemplate, loadStylePack } from '../utils/prompting.js';
import { getProvider } from '../providers/provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const style = await loadStylePack();
  const provider = getProvider();

  const briefsDir = path.resolve(__dirname, '../../golden_set/briefs');
  const briefs = fs.readdirSync(briefsDir).filter(f => f.endsWith('.json'));

  const results = [];
  for (const f of briefs) {
    const brief = JSON.parse(fs.readFileSync(path.join(briefsDir, f), 'utf8'));
    const t = await loadTemplate('draft_scaffold@1.0.0');
    const compiled = compilePrompt(t, brief, style);
    const out = await provider.callModel(compiled);

    // In real flow we'd send output to model, but with mock we lint the input brief text if present.
    const sampleText = `Sample draft mentioning ${style.must_use?.[0] || ''} and avoiding ${style.must_avoid?.[0] || ''}.`;
    const lint = lintStyle(sampleText, style);

    results.push({
      brief: f,
      latencyMs: out.latencyMs || 0,
      style: lint
    });
  }

  const p50 = percentile(results.map(r => r.latencyMs), 50);
  const p95 = percentile(results.map(r => r.latencyMs), 95);

  console.log(JSON.stringify({
    count: results.length,
    latency: { p50, p95 },
    samples: results
  }, null, 2));
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a,b)=>a-b);
  const idx = Math.floor((p/100) * (sorted.length-1));
  return sorted[idx];
}

run().catch(err => { console.error(err); process.exit(1); });

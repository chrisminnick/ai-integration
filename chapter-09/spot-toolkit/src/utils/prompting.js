import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadTemplate(idAndVersion) {
  // Example: 'draft_scaffold@1.0.0' maps to 'prompts/draft_scaffold@1.0.0.json'
  const p = path.resolve(__dirname, `../../prompts/${idAndVersion}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export async function loadStylePack() {
  const p = path.resolve(__dirname, '../../style/stylepack.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function fillPlaceholders(text, data) {
  return text.replace(/\{(.*?)\}/g, (_, key) => {
    const v = data[key.trim()];
    return v !== undefined ? String(v) : `{${key}}`;
  });
}

export function compilePrompt(template, data, stylePack) {
  const system = template.system;
  const user = fillPlaceholders(template.user, data);
  return {
    system,
    user,
    stylePack,
    templateMeta: { id: template.id, version: template.version, purpose: template.purpose }
  };
}

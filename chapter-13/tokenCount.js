import { encoding_for_model } from 'tiktoken';

export function countTokens(text, model = 'gpt-4o-mini') {
  const enc = encoding_for_model(model);
  const tokens = enc.encode(text);
  enc.free();
  return tokens.length;
}

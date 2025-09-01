export function cosineSimilarity(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (na * nb);
}
export function addVec(a, b) {
  return a.map((v, i) => v + b[i]);
}
export function scaleVec(a, k) {
  return a.map((v) => v * k);
}

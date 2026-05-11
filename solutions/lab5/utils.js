export function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

export function keywordScore(query, doc) {
  const qTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (qTerms.length === 0) return 0;
  const docText = (doc.name + " " + doc.description).toLowerCase();
  const hits = qTerms.filter((t) => docText.includes(t)).length;
  return hits / qTerms.length;
}

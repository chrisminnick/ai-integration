export function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

export function addVec(a, b) {
  return a.map((v, i) => v + b[i]);
}

export function scaleVec(a, k) {
  return a.map((v) => v * k);
}

export function normalizeVector(vec) {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / norm);
}

// Simple keyword matching for text search
export function keywordSearch(query, items, fields = ['title', 'description']) {
  const queryTerms = query
    .toLowerCase()
    .split(' ')
    .filter((term) => term.length > 0);

  return items
    .map((item) => {
      let score = 0;
      const text = fields
        .map((field) => item[field] || '')
        .join(' ')
        .toLowerCase();

      queryTerms.forEach((term) => {
        const matches = (text.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });

      return { ...item, score };
    })
    .filter((item) => item.score > 0);
}

// Combine keyword and vector search results
export function hybridSearch(
  keywordResults,
  vectorResults,
  keywordWeight = 0.3,
  vectorWeight = 0.7
) {
  const combined = new Map();

  // Normalize scores to 0-1 range
  const maxKeywordScore = Math.max(...keywordResults.map((r) => r.score), 1);
  const maxVectorScore = Math.max(...vectorResults.map((r) => r.score), 1);

  // Add keyword results
  keywordResults.forEach((result) => {
    const normalizedScore = result.score / maxKeywordScore;
    combined.set(result.id, {
      ...result,
      keywordScore: normalizedScore,
      vectorScore: 0,
      hybridScore: normalizedScore * keywordWeight,
    });
  });

  // Add or update with vector results
  vectorResults.forEach((result) => {
    const normalizedScore = result.score / maxVectorScore;
    if (combined.has(result.id)) {
      const existing = combined.get(result.id);
      existing.vectorScore = normalizedScore;
      existing.hybridScore =
        existing.keywordScore * keywordWeight + normalizedScore * vectorWeight;
    } else {
      combined.set(result.id, {
        ...result,
        keywordScore: 0,
        vectorScore: normalizedScore,
        hybridScore: normalizedScore * vectorWeight,
      });
    }
  });

  return Array.from(combined.values()).sort(
    (a, b) => b.hybridScore - a.hybridScore
  );
}

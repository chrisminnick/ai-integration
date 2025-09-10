import fs from 'fs';
import { cosineSimilarity } from './utils.js';

const ITEM_INDEX = JSON.parse(fs.readFileSync('item_index.json', 'utf8'));
const USER_VECS = JSON.parse(fs.readFileSync('user_vectors.json', 'utf8'));

function recommend(userId, k = 5, excludeIds = []) {
  const uvec = USER_VECS[userId];
  if (!uvec) throw new Error('Unknown user: ' + userId);

  const ranked = ITEM_INDEX.filter((x) => !excludeIds.includes(x.id))
    .map((x) => ({
      id: x.id,
      title: x.title,
      score: cosineSimilarity(uvec, x.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return ranked;
}

// Demo
console.log('Recommendations for u_alyssa:');
console.table(recommend('u_alyssa', 5, ['ml1', 'ml2', 'b1']));

console.log('Recommendations for u_ben:');
console.table(recommend('u_ben', 5, ['fe1', 'd1']));

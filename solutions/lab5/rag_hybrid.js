import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import { cosineSimilarity, keywordScore } from "./utils.js";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = JSON.parse(fs.readFileSync("embeddings.json", "utf8"));

const SEM_WEIGHT = 0.7;
const KW_WEIGHT = 0.3;

async function retrieve(query, { k = 3, category = null } = {}) {
  const r = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const q = r.data[0].embedding;

  const pool = category
    ? embeddings.filter((e) => e.category === category)
    : embeddings;

  return pool
    .map((item) => {
      const semScore = cosineSimilarity(q, item.embedding);
      const kwScore = keywordScore(query, item);
      return {
        ...item,
        semScore,
        kwScore,
        score: SEM_WEIGHT * semScore + KW_WEIGHT * kwScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

async function answer(question, category) {
  const docs = await retrieve(question, { k: 3, category });

  const context = docs
    .map((d, i) => `[${i + 1}] ${d.name}: ${d.description}`)
    .join("\n");

  const prompt = `You are a helpful product assistant. Answer the user's question using ONLY the provided products. Cite which product you're referring to using [1], [2], etc. If the products don't contain the answer, say "I don't have information about that."

Products:
${context}

Question: ${question}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  console.log("\nAnswer:", response.choices[0].message.content);
  console.log("\nSources used (hybrid score = 0.7*sem + 0.3*kw):");
  docs.forEach((d, i) =>
    console.log(
      `  [${i + 1}] ${d.name} — total: ${d.score.toFixed(
        3
      )} (sem: ${d.semScore.toFixed(3)}, kw: ${d.kwScore.toFixed(3)})`
    )
  );
}

const args = process.argv.slice(2);
let category = null;
const catIdx = args.indexOf("--category");
if (catIdx !== -1) {
  category = args[catIdx + 1];
  args.splice(catIdx, 2);
}
const question =
  args.join(" ") || "What's a good gift for someone who loves the outdoors?";

answer(question, category).catch((err) => {
  console.error(err);
  process.exit(1);
});

import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import { cosineSimilarity } from "./utils.js";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = JSON.parse(fs.readFileSync("embeddings.json", "utf8"));

async function retrieve(query, k = 3) {
  const r = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const q = r.data[0].embedding;

  return embeddings
    .map((item) => ({ ...item, score: cosineSimilarity(q, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

async function answer(question) {
  const docs = await retrieve(question, 3);

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
  console.log("\nSources used:");
  docs.forEach((d, i) =>
    console.log(`  [${i + 1}] ${d.name} (score: ${d.score.toFixed(3)})`)
  );
}

const question =
  process.argv.slice(2).join(" ") ||
  "What's a good gift for someone who loves the outdoors?";
answer(question).catch((err) => {
  console.error(err);
  process.exit(1);
});

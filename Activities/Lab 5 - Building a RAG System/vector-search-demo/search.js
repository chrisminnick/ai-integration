import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import { cosineSimilarity } from "./utils.js";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddings = JSON.parse(fs.readFileSync("embeddings.json", "utf8"));

async function search(query = "speakers to bring on a picnic") {
  const r = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const q = r.data[0].embedding;

  const ranked = embeddings
    .map(item => ({ ...item, score: cosineSimilarity(q, item.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  console.log("Query:", query);
  for (const it of ranked) {
    console.log(`- ${it.name} (score: ${it.score.toFixed(3)})`);
  }
}

// allow passing a query via CLI: node search.js "my query"
const query = process.argv.slice(2).join(" ") || undefined;
search(query).catch(console.error);

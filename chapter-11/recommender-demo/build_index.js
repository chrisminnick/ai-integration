import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ITEMS_FILE = "items.json";
const INDEX_FILE = "item_index.json";

async function embed(text) {
  const r = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return r.data[0].embedding;
}

async function main() {
  const items = JSON.parse(fs.readFileSync(ITEMS_FILE, "utf8"));
  const out = [];
  for (const it of items) {
    const text = `${it.title}. ${it.desc}`;
    const emb = await embed(text);
    out.push({ ...it, embedding: emb });
    console.log("Embedded:", it.id, "-", it.title);
  }
  fs.writeFileSync(INDEX_FILE, JSON.stringify(out, null, 2));
  console.log("Saved:", INDEX_FILE);
}

main().catch(console.error);

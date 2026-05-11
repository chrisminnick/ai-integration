import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDINGS_FILE = "embeddings.json";

const products = JSON.parse(fs.readFileSync("products.json", "utf8"));

async function buildIndex() {
  const out = [];
  for (const p of products) {
    const r = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: p.description,
    });
    out.push({ ...p, embedding: r.data[0].embedding });
    console.log("Embedded:", p.id, "-", p.name);
  }
  fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(out, null, 2));
  console.log("Embeddings saved to", EMBEDDINGS_FILE);
}

buildIndex().catch(console.error);

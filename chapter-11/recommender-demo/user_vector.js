import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import { addVec, scaleVec } from "./utils.js";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const USERS = JSON.parse(fs.readFileSync("users.json", "utf8"));
const ITEM_INDEX = JSON.parse(fs.readFileSync("item_index.json", "utf8"));
const OUT = "user_vectors.json";

function findItemEmbedding(id) {
  const hit = ITEM_INDEX.find((x) => x.id === id);
  return hit?.embedding || null;
}

async function embed(text) {
  const r = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return r.data[0].embedding;
}

async function buildUserVector(u) {
  const profileVec = await embed(u.profile);
  let acc = profileVec.slice();
  for (const evt of u.interactions || []) {
    const itemVec = findItemEmbedding(evt.itemId);
    if (!itemVec) continue;
    acc = addVec(acc, scaleVec(itemVec, evt.weight));
  }
  return acc;
}

async function main() {
  const out = {};
  for (const u of USERS) {
    console.log("Building vector for", u.id);
    out[u.id] = await buildUserVector(u);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log("Saved:", OUT);
}

main().catch(console.error);

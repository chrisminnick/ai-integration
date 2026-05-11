# Lab 5 — Building a RAG System

**Module:** 5 (Retrieval-Augmented Generation)
**Time:** 60 minutes
**Language:** Node.js
**Prerequisites:** Node.js 18+, an OpenAI API key, a terminal

## Why this lab matters

RAG is the most-deployed pattern in 2026 enterprise AI. It's how you give an LLM access to private data, reduce hallucinations, and ground answers in citable sources. By the end of this lab you will have built a working RAG system end-to-end — embedding, vector search, prompt construction, and grounded generation — using ~100 lines of code.

## Starter code

The starter code is in `ai-integration/chapter-11/vector-search-demo/`. Copy it to a local working folder:

```bash
cp -r ~/code/src/github.com/chrisminnick/ai-integration/chapter-11/vector-search-demo ~/lab5
cd ~/lab5
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

The folder contains:

- `products.json` — a small dataset of products (the corpus)
- `index.js` — builds embeddings from `products.json` → writes `embeddings.json`
- `search.js` — takes a query, returns the top 3 most similar products
- `utils.js` — cosine similarity helper

`embeddings.json` is already pre-built so you can skip the indexing step if you're impatient. Otherwise, regenerate it:

```bash
npm run index
```

## Part 1 — Run the starter search (10 min)

Run the existing search:

```bash
npm run search
# or with a query:
node search.js "something to listen to music on the beach"
```

You should see three products ranked by similarity score.

**Discussion points to think about:**
- What's in `embeddings.json`? Open it. Each product has been converted to a 1536-dimensional vector by `text-embedding-3-small`.
- Why does the model match "speakers" to "beach music"? It's not keyword matching — the embedding space encodes meaning.
- Try a query with no obvious keyword overlap: `"a gift for my dad who likes camping"`. See what comes back.

## Part 2 — Add a RAG layer (20 min)

Right now `search.js` returns matching products but doesn't *answer questions* about them. Let's turn it into a RAG system: given a question, retrieve relevant products and have the LLM answer using them as context.

Create a new file `rag.js`:

```javascript
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
  docs.forEach((d, i) => console.log(`  [${i + 1}] ${d.name} (score: ${d.score.toFixed(3)})`));
}

const question = process.argv.slice(2).join(" ") || "What's a good gift for someone who loves the outdoors?";
answer(question).catch(console.error);
```

Run it:

```bash
node rag.js "What should I bring on a picnic?"
node rag.js "I need something for my dad who fishes."
node rag.js "How do I make sourdough bread?"
```

**Notice:**
- The first two questions get grounded, cited answers.
- The third question (off-topic) makes the model say "I don't have information about that" — because the prompt instructs it to. This is **grounding** in action.

## Part 3 — Compare RAG vs. no-RAG (10 min)

To see what RAG is actually buying you, ask the same question without retrieval. Create `no_rag.js`:

```javascript
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function answer(question) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: `You are a helpful product assistant for our store. Answer: ${question}` }],
    temperature: 0.2,
  });
  console.log(response.choices[0].message.content);
}

const question = process.argv.slice(2).join(" ");
answer(question).catch(console.error);
```

Run both with the same question:

```bash
node rag.js "What's the best portable speaker you sell?"
node no_rag.js "What's the best portable speaker you sell?"
```

The no-RAG version will **hallucinate product details** confidently. The RAG version answers from the actual corpus. This is the entire reason RAG exists.

## Part 4 — Extensions (20 min, pick one or two)

### Extension A: Add hybrid search (recommended)

Pure embedding search misses exact keyword matches (e.g., product codes, names). Add a BM25-style keyword score and blend it with the embedding score:

```javascript
// In rag.js, modify retrieve():
function keywordScore(query, doc) {
  const qTerms = query.toLowerCase().split(/\s+/);
  const docText = (doc.name + " " + doc.description).toLowerCase();
  return qTerms.filter((t) => docText.includes(t)).length / qTerms.length;
}

// blend the scores:
.map((item) => {
  const semScore = cosineSimilarity(q, item.embedding);
  const kwScore = keywordScore(query, item);
  return { ...item, score: 0.7 * semScore + 0.3 * kwScore };
})
```

Test with a query that has both semantic and keyword content. Notice the difference in ranking.

### Extension B: Add a re-ranker

Retrieve top 10, then ask the LLM to re-rank them by relevance to the question. This is the production pattern. Significantly improves precision at the cost of one extra API call.

### Extension C: Swap the dataset

Replace `products.json` with your own data — your team's documentation, a CSV of customer support tickets, etc. Rebuild the index and ask questions of it. This is the actual "Monday morning" use case.

### Extension D: Add metadata filtering

Add a `category` field to each product. Filter the candidate set by category *before* computing similarity. This is how production vector DBs (Pinecone, Weaviate, Chroma) enforce access control and tenancy.

## What you should walk away with

- A working RAG pipeline you fully understand: embed → store → retrieve → augment → generate
- Concrete intuition for why grounding reduces hallucinations
- Code you can adapt for your own corpus by changing two files (`products.json` and a couple of strings)
- Awareness that pure semantic search is rarely enough — hybrid search, re-ranking, and metadata filtering are how production systems get to high recall + high precision

## Common issues

- **"OpenAI API key not set"** — check your `.env` file is in the working directory and has `OPENAI_API_KEY=sk-...`
- **"Cannot find module"** — run `npm install` again
- **Embeddings cost** — running `npm run index` costs ~$0.0001 (text-embedding-3-small is cheap). The chat calls are pennies per dozen queries.
- **Slow first run** — node startup + dotenv + reading embeddings.json takes ~1 second. Subsequent runs are faster.

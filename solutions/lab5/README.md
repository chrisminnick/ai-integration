# Lab 5 — RAG System (Solution)

A working RAG pipeline over a small product catalog: embed → store → retrieve → augment → generate.

## Setup

```bash
cd solutions/lab5
npm install
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

## Build the embedding index

The first time, build the embeddings:

```bash
npm run index
```

This reads `products.json`, embeds each product with `text-embedding-3-small`, and writes `embeddings.json`. Cost is fractions of a cent. Re-run any time you change `products.json`.

## Run the parts

```bash
# Part 1 — plain semantic search
npm run search -- "something to listen to music on the beach"

# Part 2 — RAG (retrieve, then ask gpt-4o-mini to answer with citations)
npm run rag -- "What should I bring on a picnic?"
npm run rag -- "I need something for my dad who fishes."
npm run rag -- "How do I make sourdough bread?"   # should refuse

# Part 3 — no-RAG comparison (will confidently hallucinate)
npm run no-rag -- "What's the best portable speaker you sell?"
npm run rag    -- "What's the best portable speaker you sell?"

# Part 4A — hybrid search (semantic + keyword blend)
npm run hybrid -- "Bluetooth speaker"
npm run hybrid -- --category outdoors "a gift for my dad"
```

## Files

- `products.json` — the corpus (6 products, with a `category` field for Extension D)
- `index.js` — builds `embeddings.json`
- `search.js` — pure semantic top-3 search
- `rag.js` — retrieve + generate with citations (Part 2)
- `no_rag.js` — same model, no retrieval — for the side-by-side comparison
- `rag_hybrid.js` — Extension A (hybrid scoring) + Extension D (`--category` filter)
- `utils.js` — `cosineSimilarity` and `keywordScore`

## What was fixed vs. the lab handout

- `index.js` now embeds `name + description` (not just description). The handout embedded only the description, which made queries that name the product type score worse than they should.
- Added a `category` field to `products.json` so Extension D (metadata filtering) is wired in by default.
- `rag_hybrid.js` exposes both Extension A (hybrid scoring) and Extension D (category filter) as one runnable script — the handout left them as snippets to merge in.

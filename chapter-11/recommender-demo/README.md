# Lab 11.2 — Recommender with Embeddings + User Profiles

## Overview
Build a simple recommender:
1) embed items, 2) compute a user vector (profile + interactions), 3) rank by cosine, 4) optional LLM "why this".

## Setup
```bash
npm install
cp .env.example .env   # add your key
```

## Build item index
```bash
npm run build:index
```

## Build user vectors
```bash
npm run build:uservecs
```

## Get recommendations
```bash
npm run recommend
```

## Optional: "why this" explanation
```bash
npm run why
```

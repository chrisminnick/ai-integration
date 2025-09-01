# FUSE: Find, Understand, Search, Enhance  
**Application Specification**  

## Overview  
FUSE is a teaching demo application for experimenting with search and recommendation techniques.  
It combines traditional keyword indexing with vector-based embeddings and demonstrates semantic, hybrid, and personalized search.  
The goal is to give developers a sandbox to understand how modern search and recommendation systems work in practice.  

## Objectives  
- Provide a minimal but extensible reference app.  
- Demonstrate AI-driven search and hybrid retrieval.  
- Show how personalization changes ranking.  
- Be easy to set up and run locally with minimal dependencies.  
- Serve as a starting point for experiments and labs in Chapter 11.  

## Tech Stack  
- **Frontend**: React + Vite  
- **Backend**: Node.js (Express)  
- **Database/Indexing**:  
  - SQLite (for metadata + keyword search)  
  - Vector store (in-memory with option for persistent backends like SQLite extensions or external stores)  
- **Embeddings**: OpenAI API (e.g., `text-embedding-3-small`)  
- **Environment**: Node.js 18+, npm, dotenv for API keys  

## Core Features  
1. **Keyword Search**  
   - Simple full-text search against metadata.  
   - Demonstrates limitations of keyword-only retrieval.  

2. **Vector Search**  
   - Embedding-based semantic search.  
   - Finds related documents even when keywords differ.  

3. **Hybrid Search**  
   - Combines keyword and vector search with adjustable weights.  
   - Returns a ranked list with similarity scores.  

4. **Personalized Recommendations**  
   - Tracks user interactions (clicks, saves, likes).  
   - Re-ranks results using embeddings of user profile vs. document set.  

5. **Evaluation Tools**  
   - Side-by-side comparison of keyword, vector, and hybrid results.  
   - JSON logging of queries, results, and rankings.  

## Architecture  
- **Frontend (React)**  
  - Search bar, toggle for search mode (keyword, vector, hybrid).  
  - Results list with scores.  
  - User login (mocked, simple session).  
  - Feedback buttons (“like,” “save,” “not relevant”).  

- **Backend (Express API)**  
  - `/search` endpoint: Accepts query + mode. Returns ranked results.  
  - `/recommend` endpoint: Returns items based on user profile embeddings.  
  - `/feedback` endpoint: Logs user interactions. Updates profile vectors.  
  - `/load` endpoint: Loads dataset (JSON/CSV).  

- **Data Layer**  
  - Dataset stored in JSON or SQLite.  
  - Each record has: `id`, `title`, `description`, `tags`, `embedding`.  
  - Embeddings generated at load time if missing.  

## Installation & Setup  
1. Clone repository.  
2. Run `npm install` in root and frontend folders.  
3. Add `.env` file with `OPENAI_API_KEY`.  
4. Run backend: `npm run dev` in `server/`.  
5. Run frontend: `npm run dev` in `client/`.  

## License & Disclaimer  
- Licensed under MIT License.  
- Educational/demo software only.  
- No warranties of suitability for production.  

---  

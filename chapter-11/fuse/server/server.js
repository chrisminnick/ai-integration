import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { cosineSimilarity, keywordSearch, hybridSearch } from './utils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = 'fuse.db';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;
function initDB() {
  db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database');
    }
  });
}

// Helper functions
async function getAllDocuments() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM documents', (err, rows) => {
      if (err) reject(err);
      else {
        const docs = rows.map((row) => ({
          ...row,
          tags: JSON.parse(row.tags || '[]'),
          embedding: JSON.parse(row.embedding || '[]'),
        }));
        resolve(docs);
      }
    });
  });
}

async function generateQueryEmbedding(query) {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  return response.data[0].embedding;
}

async function getUserProfile(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else if (row) {
        resolve({
          ...row,
          profile_embedding: JSON.parse(row.profile_embedding || '[]'),
        });
      } else {
        resolve(null);
      }
    });
  });
}

async function updateUserProfile(userId, interactions) {
  // Simple approach: average embeddings of liked/saved documents
  const likedDocs = interactions.filter((i) =>
    ['like', 'save'].includes(i.action)
  );

  if (likedDocs.length === 0) return;

  try {
    const docs = await getAllDocuments();
    const docMap = new Map(docs.map((d) => [d.id, d]));

    const embeddings = likedDocs
      .map((i) => docMap.get(i.document_id)?.embedding)
      .filter((e) => e && e.length > 0);

    if (embeddings.length === 0) return;

    // Calculate average embedding
    const avgEmbedding = embeddings[0].map(
      (_, i) =>
        embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
    );

    // Update user profile
    db.run('UPDATE users SET profile_embedding = ? WHERE id = ?', [
      JSON.stringify(avgEmbedding),
      userId,
    ]);
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

// API Routes

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, mode = 'hybrid', userId = 'demo_user' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const documents = await getAllDocuments();
    let results = [];

    switch (mode) {
      case 'keyword':
        results = keywordSearch(query, documents, ['title', 'description'])
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        break;

      case 'vector':
        const queryEmbedding = await generateQueryEmbedding(query);
        results = documents
          .map((doc) => ({
            ...doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        break;

      case 'hybrid':
        const queryEmb = await generateQueryEmbedding(query);
        const keywordResults = keywordSearch(query, documents, [
          'title',
          'description',
        ]);
        const vectorResults = documents.map((doc) => ({
          ...doc,
          score: cosineSimilarity(queryEmb, doc.embedding),
        }));

        results = hybridSearch(keywordResults, vectorResults, 0.3, 0.7).slice(
          0,
          10
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid search mode' });
    }

    // Remove embeddings from response to reduce payload size
    const cleanResults = results.map(({ embedding, ...rest }) => rest);

    res.json({
      query,
      mode,
      results: cleanResults,
      count: cleanResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Personalized recommendations endpoint
app.post('/api/recommend', async (req, res) => {
  try {
    const { userId = 'demo_user', limit = 5 } = req.body;

    const user = await getUserProfile(userId);
    if (!user || !user.profile_embedding.length) {
      return res.json({
        message:
          'No user profile available. Interact with documents to get personalized recommendations.',
        results: [],
      });
    }

    const documents = await getAllDocuments();
    const recommendations = documents
      .map((doc) => ({
        ...doc,
        score: cosineSimilarity(user.profile_embedding, doc.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Remove embeddings from response
    const cleanResults = recommendations.map(({ embedding, ...rest }) => rest);

    res.json({
      userId,
      results: cleanResults,
      count: cleanResults.length,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId = 'demo_user', documentId, action } = req.body;

    if (!documentId || !action) {
      return res
        .status(400)
        .json({ error: 'Document ID and action are required' });
    }

    if (!['click', 'like', 'save', 'not_relevant'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Record the interaction
    db.run(
      'INSERT INTO interactions (user_id, document_id, action) VALUES (?, ?, ?)',
      [userId, documentId, action],
      function (err) {
        if (err) {
          console.error('Error recording interaction:', err);
          return res
            .status(500)
            .json({ error: 'Failed to record interaction' });
        }
      }
    );

    // Update user profile based on recent interactions
    db.all(
      'SELECT * FROM interactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20',
      [userId],
      async (err, interactions) => {
        if (!err && interactions.length > 0) {
          await updateUserProfile(userId, interactions);
        }
      }
    );

    res.json({ message: 'Feedback recorded successfully' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user interactions
app.get('/api/interactions/:userId', (req, res) => {
  const { userId } = req.params;

  db.all(
    'SELECT * FROM interactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching interactions:', err);
        return res.status(500).json({ error: 'Failed to fetch interactions' });
      }

      res.json({ interactions: rows });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
initDB();

app.listen(PORT, () => {
  console.log(`FUSE server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

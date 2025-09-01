import fs from 'fs';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DB_FILE = 'fuse.db';
const DATASET_FILE = 'dataset.json';

async function createDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

async function initTables(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Documents table
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          tags TEXT,
          embedding TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          profile_embedding TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User interactions table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          document_id TEXT,
          action TEXT CHECK(action IN ('click', 'like', 'save', 'not_relevant')),
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (document_id) REFERENCES documents (id)
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
}

async function generateEmbedding(text) {
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function loadDataset(db) {
  const dataset = JSON.parse(fs.readFileSync(DATASET_FILE, 'utf8'));

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO documents (id, title, description, tags, embedding)
        VALUES (?, ?, ?, ?, ?)
      `);

      try {
        for (const doc of dataset) {
          console.log(`Processing document: ${doc.id} - ${doc.title}`);

          const text = `${doc.title}. ${doc.description}`;
          const embedding = await generateEmbedding(text);
          const embeddingJson = JSON.stringify(embedding);
          const tagsJson = JSON.stringify(doc.tags);

          stmt.run(doc.id, doc.title, doc.description, tagsJson, embeddingJson);
        }

        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function createDefaultUser(db) {
  return new Promise((resolve, reject) => {
    // Create a default demo user
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, profile_embedding)
      VALUES (?, ?, ?)
    `);

    stmt.run('demo_user', 'Demo User', '[]', (err) => {
      if (err) reject(err);
      else {
        stmt.finalize();
        resolve();
      }
    });
  });
}

async function main() {
  try {
    console.log('Creating database...');
    const db = await createDatabase();

    console.log('Initializing tables...');
    await initTables(db);

    console.log('Loading dataset and generating embeddings...');
    await loadDataset(db);

    console.log('Creating default user...');
    await createDefaultUser(db);

    console.log('Database setup complete!');

    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      else console.log('Database connection closed.');
    });
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

main();

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

// Clean DATABASE_URL to prevent sslmode=require from forcing strict CA verification
const rawUrl = process.env.DATABASE_URL || "";
const connectionString = rawUrl.replace(/(\?|&)sslmode=[^&]*/g, "");

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Safely handles cloud DB self-signed certificates
  },
});

export const initDb = async () => {
  try {
    // 1. Enable vector extension if supported
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`).catch(() => {
      console.log(
        "pgvector extension not available, using JSONB vector fallback.",
      );
    });

    // 2. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Documents Meta Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        file_path TEXT,
        file_type VARCHAR(50),
        uploaded_by INT REFERENCES users(id) ON DELETE CASCADE,
        chunk_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Document Chunks (for Vector & Semantic Search)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_id INT REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ RAG Database tables initialized successfully.");
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
};

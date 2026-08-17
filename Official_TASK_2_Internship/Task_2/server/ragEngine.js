import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Text Chunking Helper (splits long text into overlapping chunks)
export const splitTextIntoChunks = (text, chunkSize = 500, overlap = 100) => {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const chunk = text.slice(startIndex, startIndex + chunkSize);
    chunks.push(chunk);
    startIndex += chunkSize - overlap;
  }
  return chunks;
};

// 2. Generate Vector Embedding via Gemini API
export const generateEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values; // Returns array of floats
  } catch (err) {
    console.error("Error generating embedding:", err.message);
    throw err;
  }
};

// 3. Cosine Similarity Calculation (with automatic string/array safety)
export const cosineSimilarity = (vecA, vecB) => {
  // Parse string if stored as JSON in PostgreSQL
  const a = typeof vecA === "string" ? JSON.parse(vecA) : vecA;
  const b = typeof vecB === "string" ? JSON.parse(vecB) : vecB;

  if (!a || !b || !a.length || !b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

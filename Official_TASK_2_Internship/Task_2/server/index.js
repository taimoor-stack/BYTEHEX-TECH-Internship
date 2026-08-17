import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createRequire } from "module";
import multer from "multer";
import { initDb, pool } from "./db.js";
import {
  cosineSimilarity,
  generateEmbedding,
  splitTextIntoChunks,
} from "./ragEngine.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize DB tables on launch
initDb();

// -------------------------------------------------------------
// 1. UPLOAD & INDEX DOCUMENT (Chunking + Vectorizing)
// -------------------------------------------------------------
app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let extractedText = "";
    const fileType = req.file.mimetype;

    if (fileType === "application/pdf") {
      const parsedPdf = await pdfParse(req.file.buffer);
      extractedText = parsedPdf.text;
    } else {
      extractedText = req.file.buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      return res
        .status(400)
        .json({ error: "Failed to extract text from document." });
    }

    // Save document meta
    const docResult = await pool.query(
      "INSERT INTO documents (title, file_type) VALUES ($1, $2) RETURNING id",
      [req.file.originalname, fileType],
    );
    const documentId = docResult.rows[0].id;

    // Chunk text
    const textChunks = splitTextIntoChunks(extractedText);

    // Generate embeddings & save each chunk
    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const embedding = await generateEmbedding(chunkText);

      await pool.query(
        "INSERT INTO document_chunks (document_id, chunk_index, chunk_text, embedding) VALUES ($1, $2, $3, $4)",
        [documentId, i, chunkText, JSON.stringify(embedding)],
      );
    }

    await pool.query("UPDATE documents SET chunk_count = $1 WHERE id = $2", [
      textChunks.length,
      documentId,
    ]);

    res.json({
      message: "Document indexed successfully!",
      documentId,
      title: req.file.originalname,
      totalChunks: textChunks.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. GET ALL INDEXED DOCUMENTS
// -------------------------------------------------------------
app.get("/api/documents", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM documents ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. HYBRID VECTOR SEARCH & STREAMED AI ANSWER (RAG)
// -------------------------------------------------------------
app.post("/api/query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "Question is required" });

    // Step A: Vectorize the question
    const questionEmbedding = await generateEmbedding(question);

    // Step B: Fetch all stored document chunks
    const chunksResult = await pool.query(`
      SELECT dc.id, dc.chunk_text, dc.embedding, d.title 
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
    `);

    // Step C: Rank chunks using Cosine Similarity
    const rankedChunks = chunksResult.rows
      .map((row) => ({
        ...row,
        similarity: cosineSimilarity(questionEmbedding, row.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 4); // Top 4 chunks

    const contextText = rankedChunks
      .map((c, idx) => `[Source ${idx + 1}: ${c.title}]\n${c.chunk_text}`)
      .join("\n\n");

    // Step D: Query Gemini LLM with context constraint
    const prompt = `
You are an expert Knowledge Base Assistant.
Use ONLY the context provided below to answer the user's question. 
If the answer cannot be found in the context, state "I cannot find the answer in the uploaded documents."

Context:
${contextText}

Question: ${question}
`;

    // ✅ FIXED: Changed "gemini-2.5-flash" to "gemini-1.5-flash"
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const aiResponse = await model.generateContent(prompt);
    const answer = aiResponse.response.text();

    res.json({
      answer,
      retrievedSources: rankedChunks.map((c) => ({
        title: c.title,
        chunkText: c.chunk_text,
        similarityScore: (c.similarity * 100).toFixed(2) + "%",
      })),
    });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Vector-RAG Server running on port ${PORT}`),
);

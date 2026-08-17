import axios from 'axios';
import { Bot, Database, FileText, Search, Sparkles, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Helper function for manual re-fetching (used after document upload)
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/documents`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  // ✅ Async data fetching declared inside useEffect to satisfy React compiler rules
  useEffect(() => {
    let isMounted = true;

    const loadInitialDocuments = async () => {
      try {
        const res = await axios.get(`${API_BASE}/documents`);
        if (isMounted) {
          setDocuments(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch documents', err);
      }
    };

    loadInitialDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Document Upload & Vector Indexing
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadMessage('Extracting text and generating vector embeddings...');

    try {
      const res = await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage(`Success! Indexed ${res.data.totalChunks} text chunks.`);
      setFile(null);
      fetchDocuments();
    } catch (err) {
      setUploadMessage(`Error: ${err.response?.data?.error || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle RAG Search & LLM Query
  const handleQuery = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.post(`${API_BASE}/query`, { question });
      setResponse(res.data);
    } catch (err) {
      console.error(err);
      setResponse({
        answer: 'Failed to query the knowledge engine. Ensure server is running.',
        retrievedSources: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rag-container">
      {/* Header */}
      <header className="rag-header">
        <div className="logo-group">
          <Database className="icon-main" />
          <div>
            <h1>Hybrid Vector-RAG Engine</h1>
            <p>Knowledge Base Search & Context-Augmented Generation Portal</p>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="rag-grid">
        {/* Left Sidebar: Knowledge Base & Upload */}
        <aside className="rag-sidebar">
          <section className="card upload-card">
            <h2><Upload size={18} /> Upload Knowledge Document</h2>
            <form onSubmit={handleFileUpload}>
              <input
                type="file"
                accept=".pdf,.txt,.md,.json"
                onChange={(e) => setFile(e.target.files[0])}
                id="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                {file ? file.name : 'Choose PDF or TXT File'}
              </label>

              <button type="submit" disabled={!file || uploading} className="btn-primary">
                {uploading ? 'Vectorizing...' : 'Upload & Index'}
              </button>
            </form>

            {uploadMessage && (
              <p className={`status-msg ${uploadMessage.startsWith('Error') ? 'err' : 'success'}`}>
                {uploadMessage}
              </p>
            )}
          </section>

          <section className="card docs-card">
            <h2><FileText size={18} /> Indexed Documents ({documents.length})</h2>
            <ul className="doc-list">
              {documents.length === 0 ? (
                <li className="empty-state">No documents indexed yet.</li>
              ) : (
                documents.map((doc) => (
                  <li key={doc.id} className="doc-item">
                    <div className="doc-info">
                      <span className="doc-title">{doc.title}</span>
                      <span className="doc-chunks">{doc.chunk_count} vector chunks</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>

        {/* Right Panel: Hybrid Search & AI Query */}
        <main className="rag-main">
          <section className="card query-card">
            <h2><Search size={18} /> Query Knowledge Portal</h2>
            <form onSubmit={handleQuery} className="query-form">
              <input
                type="text"
                placeholder="Ask a question about your indexed documents..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button type="submit" disabled={loading} className="btn-search">
                {loading ? 'Searching...' : 'Search Engine'}
              </button>
            </form>
          </section>

          {/* AI Response & Retrieved Context Sources */}
          {response && (
            <section className="results-container">
              {/* Generated Answer */}
              <div className="card answer-card">
                <h3><Sparkles size={18} className="icon-sparkle" /> AI Response</h3>
                <div className="answer-body">{response.answer}</div>
              </div>

              {/* Vector Context Sources */}
              {response.retrievedSources && response.retrievedSources.length > 0 && (
                <div className="card sources-card">
                  <h3><Bot size={18} /> Retrieved Vector Context</h3>
                  <div className="sources-grid">
                    {response.retrievedSources.map((src, i) => (
                      <div key={i} className="source-item">
                        <div className="source-meta">
                          <span className="source-doc">{src.title}</span>
                          <span className="source-score">Match: {src.similarityScore}</span>
                        </div>
                        <p className="source-text">"{src.chunkText}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import io from 'socket.io-client';
import API from './api';

const SOCKET_URL = 'http://localhost:5000';

const USER_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'
];

const getUserColor = (id) => {
  if (!id) return USER_COLORS[0];
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'blockquote', 'code-block',
  'link',
];

export default function Workspace({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [content, setContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Track live cursors: { [socketId]: { name, color, bounds, range } }
  const [remoteCursors, setRemoteCursors] = useState({});

  const socketRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const quillRef = useRef(null);

  // Safely normalize user ID
  const normalizedUserId = user?.id || user?._id || user?.userId || user?.user_id;

  // Calculate cursor bounds relative to editor
  const calculateCursorBounds = useCallback((cursorData) => {
    if (!quillRef.current || !cursorData?.range) return null;
    try {
      const quill = quillRef.current.getEditor();
      return quill.getBounds(cursorData.range.index, cursorData.range.length);
    } catch {
      return null;
    }
  }, []);

  // Initialize Socket Connection & Listeners
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('receive-content-change', (incomingContent) => {
      setContent(incomingContent);
    });

    socket.on('workspace-users-updated', (users) => {
      setActiveUsers(users);
      const activeSocketIds = new Set(users.map((u) => u.socketId));
      setRemoteCursors((prev) => {
        const updated = {};
        Object.keys(prev).forEach((sId) => {
          if (activeSocketIds.has(sId)) updated[sId] = prev[sId];
        });
        return updated;
      });
    });

    socket.on('receive-cursor-position', ({ socketId, cursor }) => {
      if (!cursor || !cursor.range) return;

      const bounds = calculateCursorBounds(cursor);
      if (bounds) {
        setRemoteCursors((prev) => ({
          ...prev,
          [socketId]: {
            name: cursor.name || 'User',
            color: cursor.color || '#6366f1',
            bounds,
            range: cursor.range,
          },
        }));
      }
    });

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      socket.disconnect();
    };
  }, [calculateCursorBounds]);

  // Fetch workspaces list on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await API.get('/workspaces');
        if (Array.isArray(res.data)) {
          setWorkspaces(res.data);
        }
      } catch (err) {
        console.error('Error loading workspaces:', err);
      }
    };

    fetchWorkspaces();
  }, []);

  const openWorkspace = (ws) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setActiveWorkspace(ws);
    setContent(ws.content || '');
    setIsEditingTitle(false);
    setEditTitleText(ws.title);
    setIsMobileSidebarOpen(false);
    setSaveStatus('saved');
    setRemoteCursors({});

    if (socketRef.current) {
      socketRef.current.emit('join-workspace', { workspaceId: ws.id, user });
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await API.post('/workspaces', {
        title: newTitle.trim(),
        ownerId: normalizedUserId || null,
      });

      setWorkspaces((prev) => [res.data, ...prev]);
      setNewTitle('');
      openWorkspace(res.data);
    } catch (err) {
      console.error('Error creating workspace:', err);
      alert('Failed to create workspace. Check server connection.');
    }
  };

  const handleRenameWorkspace = async (e) => {
    e.preventDefault();
    if (!editTitleText.trim() || !activeWorkspace) return;
    try {
      const res = await API.put(`/workspaces/${activeWorkspace.id}`, { title: editTitleText.trim() });
      setActiveWorkspace(res.data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === activeWorkspace.id ? { ...ws, title: res.data.title } : ws))
      );
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Error renaming workspace:', err);
    }
  };

  const handleDeleteWorkspace = async (workspaceId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this document permanently?')) return;

    try {
      await API.delete(`/workspaces/${workspaceId}`);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));

      if (activeWorkspace?.id === workspaceId) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setActiveWorkspace(null);
        setContent('');
        setActiveUsers([]);
        setRemoteCursors({});
      }
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  const handleQuillChange = (value, _delta, source) => {
    setContent(value);

    if (source === 'user' && activeWorkspace) {
      setSaveStatus('saving');

      if (socketRef.current && isConnected) {
        socketRef.current.emit('send-content-change', {
          workspaceId: activeWorkspace.id,
          content: value,
        });
      }

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('save-document', {
            workspaceId: activeWorkspace.id,
            content: value,
          });
        }
        setSaveStatus('saved');
      }, 1000);
    }
  };

  const handleSelectionChange = (range, source) => {
    if (source === 'user' && range && activeWorkspace && socketRef.current) {
      socketRef.current.emit('send-cursor-position', {
        workspaceId: activeWorkspace.id,
        cursor: {
          range,
          name: user?.name || 'Anonymous',
          color: getUserColor(normalizedUserId || user?.email),
        },
      });
    }
  };

  const getCleanText = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const cleanText = getCleanText(content);
  const wordCount = cleanText.trim() ? cleanText.trim().split(/\s+/).length : 0;
  const charCount = cleanText.length;

  const exportAsTxt = () => {
    if (!activeWorkspace) return;
    const element = document.createElement('a');
    const file = new Blob([cleanText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeWorkspace.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportAsHtml = () => {
    if (!activeWorkspace) return;
    const element = document.createElement('a');
    const fullHtml = `<!DOCTYPE html><html><head><title>${activeWorkspace.title}</title></head><body>${content}</body></html>`;
    const file = new Blob([fullHtml], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeWorkspace.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={styles.container} className="workspace-responsive-container">
      <style>{`
        .quill-editor-custom .ql-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          overflow: hidden;
        }
        .quill-editor-custom .ql-editor {
          flex: 1;
          min-height: 250px;
          font-size: 0.95rem;
          line-height: 1.6;
        }
      `}</style>

      <button 
        style={styles.mobileMenuToggle}
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <span>{isMobileSidebarOpen ? 'Hide Workspaces' : 'View Workspaces'}</span>
      </button>

      <aside 
        style={{
          ...styles.sidebar,
          ...(isMobileSidebarOpen ? styles.sidebarMobileOpen : {})
        }}
        className="workspace-sidebar"
      >
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Workspaces</span>
          <span style={styles.docCount}>{workspaces.length}</span>
        </div>

        <form onSubmit={handleCreateWorkspace} style={styles.form}>
          <div style={styles.inputWrapper}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <input
              type="text"
              placeholder="New Document Title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={styles.input}
            />
          </div>
        </form>

        <div style={styles.list}>
          <AnimatePresence>
            {workspaces.map((ws) => {
              const isActive = activeWorkspace?.id === ws.id;
              return (
                <motion.div
                  key={ws.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ x: 3 }}
                  onClick={() => openWorkspace(ws)}
                  style={{
                    ...styles.item,
                    backgroundColor: isActive ? '#eef2ff' : 'transparent',
                    borderColor: isActive ? '#c7d2fe' : 'transparent',
                  }}
                >
                  <div style={styles.docTitleGroup}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#4f46e5" : "#64748b"} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span style={{ ...styles.docTitle, color: isActive ? '#4338ca' : '#334155' }}>
                      {ws.title}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.2, color: '#ef4444' }}
                    onClick={(e) => handleDeleteWorkspace(ws.id, e)}
                    style={styles.deleteIconBtn}
                    title="Delete document"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </aside>

      <main style={styles.editorArea}>
        <AnimatePresence mode="wait">
          {activeWorkspace ? (
            <motion.div 
              key={activeWorkspace.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={styles.editorContainer}
            >
              <div style={styles.editorHeader}>
                {isEditingTitle ? (
                  <form onSubmit={handleRenameWorkspace} style={styles.renameForm}>
                    <input
                      type="text"
                      value={editTitleText}
                      onChange={(e) => setEditTitleText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setIsEditingTitle(false)}
                      style={styles.renameInput}
                      autoFocus
                    />
                    <button type="submit" style={styles.saveBtn}>Save</button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div style={styles.titleWrapper}>
                    <h2 style={styles.docHeading}>{activeWorkspace.title}</h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsEditingTitle(true);
                        setEditTitleText(activeWorkspace.title);
                      }}
                      style={styles.actionBtn}
                    >
                      Rename
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteWorkspace(activeWorkspace.id)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </motion.button>

                    <div style={styles.exportDivider} />
                    <button onClick={exportAsTxt} style={styles.exportBtn} title="Download plain text file">
                      📥 .TXT
                    </button>
                    <button onClick={exportAsHtml} style={styles.exportBtn} title="Download formatted HTML document">
                      🌐 .HTML
                    </button>
                  </div>
                )}

                <div style={styles.presenceContainer}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: saveStatus === 'saving' ? '#fffbe1' : '#ecfdf5',
                    borderColor: saveStatus === 'saving' ? '#fde047' : '#a7f3d0',
                    color: saveStatus === 'saving' ? '#854d0e' : '#047857',
                  }}>
                    {saveStatus === 'saving' ? '⏳ Saving...' : '☁️ Saved'}
                  </span>

                  <span style={{
                    ...styles.badge,
                    backgroundColor: isConnected ? '#ecfdf5' : '#fef2f2',
                    borderColor: isConnected ? '#a7f3d0' : '#fca5a5',
                    color: isConnected ? '#047857' : '#991b1b',
                  }}>
                    <span style={{
                      ...styles.greenDot,
                      backgroundColor: isConnected ? '#10b981' : '#ef4444',
                    }} />
                    {isConnected ? 'Sync Connected' : 'Reconnecting...'}
                  </span>

                  <div style={styles.avatarGroup}>
                    {activeUsers.map((u, idx) => {
                      const uColor = getUserColor(u.userId || u.email);
                      return (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          key={u.socketId || idx}
                          title={`${u.name || 'User'} (${u.email || ''})`}
                          style={{
                            ...styles.avatar,
                            backgroundColor: uColor,
                          }}
                        >
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.quillWrapper} className="quill-editor-custom">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={handleQuillChange}
                  onChangeSelection={handleSelectionChange}
                  modules={modules}
                  formats={formats}
                  placeholder="Start typing your rich-text document... Syncs live in real-time."
                />

                {Object.entries(remoteCursors).map(([sId, cursor]) => {
                  if (!cursor.bounds) return null;
                  const isSelection = cursor.range && cursor.range.length > 0;

                  return (
                    <div key={sId}>
                      <div
                        style={{
                          position: 'absolute',
                          top: cursor.bounds.top + 42,
                          left: cursor.bounds.left + 15,
                          height: cursor.bounds.height || 20,
                          width: '2px',
                          backgroundColor: cursor.color,
                          pointerEvents: 'none',
                          zIndex: 20,
                          transition: 'all 0.1s ease',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: cursor.bounds.top + 24,
                          left: cursor.bounds.left + 15,
                          backgroundColor: cursor.color,
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 21,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        {cursor.name}
                      </div>

                      {isSelection && (
                        <div
                          style={{
                            position: 'absolute',
                            top: cursor.bounds.top + 42,
                            left: cursor.bounds.left + 15,
                            width: cursor.bounds.width,
                            height: cursor.bounds.height,
                            backgroundColor: `${cursor.color}33`,
                            border: `1px solid ${cursor.color}66`,
                            pointerEvents: 'none',
                            zIndex: 19,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={styles.editorFooter}>
                <span>Words: {wordCount} &nbsp;•&nbsp; Characters: {charCount}</span>
                <span style={styles.syncText}>PostgreSQL Rich Text Sync Active</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={styles.placeholder}
            >
              <div style={styles.placeholderIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.75">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h3 style={styles.placeholderTitle}>No Document Selected</h3>
              <p style={styles.placeholderSub}>Select an existing workspace from the sidebar or type a title above to create one.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '1.25rem',
    height: 'calc(100vh - 120px)',
    position: 'relative',
  },
  mobileMenuToggle: {
    display: 'none',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.825rem',
    fontWeight: '700',
    color: '#334155',
    cursor: 'pointer',
    marginBottom: '0.75rem',
  },
  sidebar: {
    width: '280px',
    minWidth: '280px',
    backgroundColor: '#ffffff',
    padding: '1.25rem',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
  },
  sidebarMobileOpen: {
    display: 'flex !important',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  sidebarTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  docCount: {
    fontSize: '0.725rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.15rem 0.55rem',
    borderRadius: '999px',
    fontWeight: '700',
  },
  form: { marginBottom: '1.25rem' },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
  },
  input: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0f172a',
    fontSize: '0.85rem',
    outline: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    overflowY: 'auto',
    flex: 1,
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.7rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  docTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    overflow: 'hidden',
  },
  docTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '150px',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  deleteIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.8,
  },
  editorArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '450px',
  },
  editorContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: 1,
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  docHeading: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  titleWrapper: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  renameForm: { display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' },
  renameInput: {
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #6366f1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '0.95rem',
  },
  saveBtn: {
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    padding: '0.4rem 0.85rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#94a3b8',
    color: '#fff',
    border: 'none',
    padding: '0.4rem 0.85rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  actionBtn: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  exportDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#cbd5e1',
    margin: '0 0.2rem',
  },
  exportBtn: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  presenceContainer: { display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' },
  badge: {
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.725rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    border: '1px solid',
    transition: 'all 0.2s ease',
  },
  greenDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  avatarGroup: { display: 'flex', gap: '-0.2rem' },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
    border: '2px solid #ffffff',
  },
  quillWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '320px',
    position: 'relative',
  },
  editorFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '0.85rem',
    color: '#64748b',
    fontSize: '0.775rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  syncText: {
    color: '#64748b',
    fontWeight: '500',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '380px',
    color: '#64748b',
    gap: '0.35rem',
    textAlign: 'center',
  },
  placeholderIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '14px',
    backgroundColor: '#eef2ff',
    border: '1px solid #c7d2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  placeholderTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  placeholderSub: {
    fontSize: '0.85rem',
    color: '#64748b',
    maxWidth: '340px',
  },
};
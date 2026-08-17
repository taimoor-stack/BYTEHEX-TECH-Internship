import { useEffect, useState } from 'react';
import API from './api';

export default function VersionHistoryModal({ workspaceId, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await API.get(`/workspaces/${workspaceId}/versions`);
        setVersions(res.data);
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [workspaceId]);

  const handleRestore = async (versionId) => {
    if (!window.confirm('Restore this snapshot? Current unsaved changes will be overwritten.')) return;
    try {
      const res = await API.post(`/workspaces/${workspaceId}/restore/${versionId}`);
      onRestore(res.data.content);
      onClose();
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>📜 Version History</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <p style={styles.loadingText}>Loading saved snapshots...</p>
        ) : versions.length === 0 ? (
          <p style={styles.emptyText}>No previous versions recorded yet.</p>
        ) : (
          <div style={styles.versionList}>
            {versions.map((ver) => (
              <div key={ver.id} style={styles.versionCard}>
                <div>
                  <div style={styles.versionTime}>
                    {new Date(ver.created_at).toLocaleString()}
                  </div>
                  <div style={styles.versionAuthor}>
                    Edited by: {ver.author || 'Collaborator'}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(ver.id)}
                  style={styles.restoreBtn}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '16px',
    width: '460px',
    maxWidth: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    color: '#64748b',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '0.85rem',
    textAlign: 'center',
    margin: '2rem 0',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '0.85rem',
    textAlign: 'center',
    margin: '2rem 0',
  },
  versionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '0.25rem',
  },
  versionCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  versionTime: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  versionAuthor: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.15rem',
  },
  restoreBtn: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
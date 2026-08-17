import { useState } from 'react';
import API from './api';

export default function ShareModal({ workspace, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await API.post(`/workspaces/${workspace.id}/share`, { email, role });
      setStatusMsg(`Granted ${role} access to ${email}`);
      setEmail('');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to share document.');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/workspace?id=${workspace.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Share "{workspace.title}"</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {statusMsg && <div style={styles.alert}>{statusMsg}</div>}

        <form onSubmit={handleShare} style={styles.form}>
          <input
            type="email"
            placeholder="User email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
            <option value="editor">Can Edit</option>
            <option value="viewer">Read Only</option>
          </select>
          <button type="submit" style={styles.inviteBtn}>
            Invite
          </button>
        </form>

        <div style={styles.footer}>
          <button onClick={copyShareLink} style={styles.copyBtn}>
            {copied ? '✓ Link Copied!' : '🔗 Copy Shareable Link'}
          </button>
        </div>
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
    width: '420px',
    maxWidth: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
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
  alert: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  input: {
    flex: 1,
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    outline: 'none',
  },
  select: {
    padding: '0.55rem 0.5rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    backgroundColor: '#f8fafc',
  },
  inviteBtn: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.55rem 1rem',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1rem',
  },
  copyBtn: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
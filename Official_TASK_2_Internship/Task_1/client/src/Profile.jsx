import { useState } from 'react';
import API from './api';

export default function Profile({ user, onUserUpdate }) {
  const [name, setName] = useState(user?.name || '');
  const [preview, setPreview] = useState(user?.avatar || user?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Convert uploaded image file to Base64 string
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMsg({ type: 'error', text: 'Image size should be less than 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const payload = {
        name,
        avatar: preview, // Base64 image string or existing avatar URL
      };

      const res = await API.put('/users/profile', payload);
      const updatedUser = res.data.user || res.data;

      // 1. Sync local storage so profile remains updated on refresh
      const existingStored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...existingStored, ...updatedUser }));

      // 2. Notify parent component (App.jsx)
      if (onUserUpdate) onUserUpdate(updatedUser);

      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Profile Update Error:', err);
      const errorText = err.response?.data?.message || 'Failed to update profile.';
      setMsg({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Account Profile</h2>
        <p style={styles.subtitle}>Manage your display name and avatar photo</p>

        {msg && (
          <div
            style={{
              ...styles.alert,
              backgroundColor: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: msg.type === 'success' ? '#047857' : '#991b1b',
              borderColor: msg.type === 'success' ? '#a7f3d0' : '#fca5a5',
            }}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} style={styles.form}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarPreview}>
              {preview ? (
                <img src={preview} alt="Avatar Preview" style={styles.avatarImg} />
              ) : (
                <span style={styles.avatarInitial}>
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            <label style={styles.uploadBtn}>
              📷 Upload New Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address (Read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{ ...styles.input, backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 1.5rem 0',
  },
  alert: {
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.825rem',
    fontWeight: '600',
    border: '1px solid',
    marginBottom: '1.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '0.5rem',
  },
  avatarPreview: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: '2.25rem',
    fontWeight: '700',
  },
  uploadBtn: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid #c7d2fe',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    outline: 'none',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
};
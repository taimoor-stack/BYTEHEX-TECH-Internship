import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import API from './api';

export default function Auth({ onLoginSuccess, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Handle prop name mismatch cleanly
  const handleAuthSuccess = onLoginSuccess || onLogin;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (alert.message) setAlert({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setAlert({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (formData.password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const response = await API.post(endpoint, formData);

      const user = response.data?.user || response.data;
      const token = response.data?.token;

      // 1. Immediately store credentials
      if (token) localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      setAlert({
        type: 'success',
        message: isLogin ? 'Welcome back! Redirecting...' : 'Account created! Redirecting...',
      });

      // 2. Trigger parent callback or refresh state after short delay
      setTimeout(() => {
        if (typeof handleAuthSuccess === 'function') {
          handleAuthSuccess(user);
        } else {
          window.location.reload();
        }
      }, 500);

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setAlert({ type: 'error', message: errorMsg });
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setAlert({ type: '', message: '' });
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div style={styles.pageBackground}>
      {/* Background glow circle */}
      <div style={styles.glow} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={styles.card}
      >
        {/* Brand Logo & Header */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <img src="/Logo.png" alt="Workspace Hub Logo" style={styles.logoImg} />
          </div>
          <h1 style={styles.title}>{isLogin ? 'Sign in to Workspace' : 'Create an account'}</h1>
          <p style={styles.subtitle}>
            {isLogin ? 'Welcome back! Enter your details to continue.' : 'Start collaborating in real-time with your team.'}
          </p>
        </div>

        {/* Alert Feedback Banner */}
        <AnimatePresence mode="wait">
          {alert.message && (
            <motion.div
              key={alert.message}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                ...styles.alertBanner,
                backgroundColor: alert.type === 'error' ? '#fef2f2' : '#ecfdf5',
                borderColor: alert.type === 'error' ? '#fca5a5' : '#6ee7b7',
                color: alert.type === 'error' ? '#991b1b' : '#065f46',
              }}
            >
              <span style={styles.alertIcon}>{alert.type === 'error' ? '✕' : '✓'}</span>
              <span>{alert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.inputGroup}
              >
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Taimoor Shaikh"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Authenticating...'
              : isLogin
              ? 'Sign In'
              : 'Create Account'}
          </motion.button>
        </form>

        {/* Form Toggle Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            {isLogin ? "Don't have an account?" : 'Already registered?'}
          </span>
          <button onClick={toggleMode} style={styles.toggleBtn}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  pageBackground: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, rgba(255, 255, 255, 0) 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)',
    padding: '2.5rem 2rem',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem auto',
    padding: '8px',
    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.025em',
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.4,
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
    fontWeight: '600',
  },
  alertIcon: {
    fontWeight: '800',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.85rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  primaryBtn: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '10px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.925rem',
    marginTop: '0.5rem',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: 0,
  },
};
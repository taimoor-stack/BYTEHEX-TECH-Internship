import { useEffect, useState } from 'react';
import logoImg from '../Logo.png';
import Auth from './Auth.jsx';
import Profile from './Profile.jsx';
import Workspace from './Workspace.jsx';
import API from './api.js';

// Team Users View Component
function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let token = localStorage.getItem('token');
        if (!token) {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              token = parsed.token || parsed.jwt || parsed.accessToken;
            } catch (err) {
              console.error('Error parsing user token:', err);
            }
          }
        }

        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        let res;
        try {
          res = await API.get('/users', config);
        } catch {
          try {
            res = await API.get('/api/users', config);
          } catch {
            res = await API.get('/users');
          }
        }

        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.users)
          ? res.data.users
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        setUsers(data);
        setError('');
      } catch (err) {
        console.error('Error fetching team users:', err);
        setError('Could not load team members from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={teamStyles.container}>
      <div style={teamStyles.header}>
        <div>
          <h2 style={teamStyles.title}>Team Members</h2>
          <p style={teamStyles.subtitle}>View and manage workspace collaborators</p>
        </div>
        <span style={teamStyles.badge}>{users.length} Registered Users</span>
      </div>

      {loading ? (
        <div style={teamStyles.stateBox}>Loading team members...</div>
      ) : error ? (
        <div style={{ ...teamStyles.stateBox, color: '#ef4444' }}>{error}</div>
      ) : users.length === 0 ? (
        <div style={teamStyles.stateBox}>No team members found.</div>
      ) : (
        <div style={teamStyles.grid}>
          {users.map((u) => (
            <div key={u.id || u._id || u.email} style={teamStyles.card}>
              <div style={teamStyles.avatar}>
                {u.avatar || u.avatar_url ? (
                  <img
                    src={u.avatar || u.avatar_url}
                    alt={u.name || 'User'}
                    style={teamStyles.avatarImg}
                  />
                ) : u.name ? (
                  u.name.charAt(0).toUpperCase()
                ) : u.email ? (
                  u.email.charAt(0).toUpperCase()
                ) : (
                  'U'
                )}
              </div>
              <div style={teamStyles.userInfo}>
                <h4 style={teamStyles.userName}>{u.name || 'Anonymous User'}</h4>
                <p style={teamStyles.userEmail}>{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App({ currentUser: initialUser, onLogout }) {
  // Initialize user state safely from props or localStorage
  const [user, setUser] = useState(() => {
    if (initialUser) return initialUser;
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse saved user:', err);
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('workspace');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (onLogout) onLogout();
  };

  const handleUserUpdate = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const handleLoginSuccess = (incomingUser) => {
    let resolvedUser = incomingUser?.user || incomingUser;

    // Fallback: If incoming payload is empty, read directly from localStorage
    if (!resolvedUser || typeof resolvedUser !== 'object') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          resolvedUser = JSON.parse(storedUser);
        } catch (err) {
          console.error('Error parsing stored user:', err);
        }
      }
    }

    // Default object if payload & storage are empty
    if (!resolvedUser || typeof resolvedUser !== 'object') {
      resolvedUser = { name: 'User', email: 'user@workspace.com' };
    }

    setUser(resolvedUser);
    localStorage.setItem('user', JSON.stringify(resolvedUser));
  };

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  // Render Auth component if user is not authenticated
  if (!user) {
    return <Auth onLogin={handleLoginSuccess} />;
  }

  return (
    <div style={styles.appShell}>
      {/* 1. Header Navigation */}
      <header style={styles.topBar}>
        <div style={styles.brand} onClick={() => setActiveTab('workspace')}>
          <img src={logoImg} alt="CollabSpace Logo" style={styles.logoImg} />
          <span style={styles.logoText}>CollabSpace</span>
        </div>

        <nav style={styles.navLinks}>
          <button
            onClick={() => setActiveTab('workspace')}
            style={{
              ...styles.navBtn,
              ...(activeTab === 'workspace' ? styles.activeNavBtn : {}),
            }}
          >
            📄 Workspaces
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              ...styles.navBtn,
              ...(activeTab === 'users' ? styles.activeNavBtn : {}),
            }}
          >
            👥 Team Users
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              ...styles.navBtn,
              ...(activeTab === 'profile' ? styles.activeNavBtn : {}),
            }}
          >
            👤 My Profile
          </button>
        </nav>

        <div style={styles.userSection}>
          <div
            style={{
              ...styles.userBadge,
              ...(activeTab === 'profile' ? styles.activeUserBadge : {}),
            }}
            onClick={() => setActiveTab('profile')}
            title="View Profile"
          >
            <div style={styles.avatar}>
              {user?.avatar || user?.avatar_url ? (
                <img
                  src={user.avatar || user.avatar_url}
                  alt={user.name || 'User'}
                  style={styles.avatarImg}
                />
              ) : (
                getUserInitial()
              )}
            </div>
            <span style={styles.userName}>{user?.name || user?.email || 'User'}</span>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            🚪 Sign Out
          </button>
        </div>
      </header>

      {/* 2. Content Area */}
      <main style={styles.contentArea}>
        {activeTab === 'workspace' && <Workspace user={user} />}

        {activeTab === 'profile' && (
          <Profile user={user} onUserUpdate={handleUserUpdate} />
        )}

        {activeTab === 'users' && <UserManagementView />}
      </main>
    </div>
  );
}

const teamStyles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  badge: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    padding: '0.35rem 0.85rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '1rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1rem',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userInfo: {
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '0.775rem',
    color: '#64748b',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  stateBox: {
    padding: '3rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.9rem',
  },
};

const styles = {
  appShell: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  topBar: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontWeight: '800',
    fontSize: '1.15rem',
    color: '#0f172a',
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoImg: {
    height: '32px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoText: {
    letterSpacing: '-0.02em',
  },
  navLinks: {
    display: 'flex',
    gap: '0.35rem',
    backgroundColor: '#f1f5f9',
    padding: '0.3rem',
    borderRadius: '10px',
  },
  navBtn: {
    padding: '0.45rem 0.95rem',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '7px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  activeNavBtn: {
    backgroundColor: '#ffffff',
    color: '#4338ca',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
    padding: '0.35rem 0.65rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    transition: 'all 0.15s ease',
  },
  activeUserBadge: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#334155',
  },
  logoutBtn: {
    background: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0.45rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    transition: 'all 0.15s ease',
  },
  contentArea: {
    flex: 1,
    padding: '1.25rem',
    maxWidth: '1600px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
};
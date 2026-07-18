import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenPayload, clearToken } from '../lib/auth';
import Logo from './Logo';

export default function Navbar() {
  const navigate = useNavigate();
  const user = tokenPayload();
  const initial = user?.name?.[0]?.toUpperCase() || (user ? 'U' : null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function signOut() {
    clearToken();
    setOpen(false);
    navigate('/');
    window.location.reload();
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
    <nav className="navbar">
      <Logo />

      <div className="navbar-actions">
        {!user ? (
          <button className="btn-track" onClick={() => navigate('/signin')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="16" height="16">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            <span>Sign in</span>
          </button>
        ) : (
          <button className="btn-track" onClick={() => navigate('/bookings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            <span>My bookings</span>
          </button>
        )}

        {initial && (
          <div style={{ position: 'relative' }} ref={dropRef}>
            <div className="avatar" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>{initial}</div>
            {open && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                minWidth: 210, zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#C8845A,#7D4A2F)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{initial}</span>
                  </div>
                  <div>
                    {user?.name && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{user.name}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.phone}</div>
                  </div>
                </div>
                <button onClick={() => { setOpen(false); navigate('/profile'); }} style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  fontSize: 14, color: 'var(--text)', borderBottom: '1px solid var(--border)',
                  background: 'none', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="16" height="16">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  Profile
                </button>
                <button onClick={() => { setOpen(false); navigate('/bookings'); }} style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  fontSize: 14, color: 'var(--text)', borderBottom: '1px solid var(--border)',
                  background: 'none', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="16" height="16">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                  </svg>
                  My bookings
                </button>
                <button onClick={signOut} style={{
                  width: '100%', textAlign: 'left', padding: '13px 16px',
                  fontSize: 14, color: '#C0392B', background: 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="16" height="16">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
    </div>
  );
}

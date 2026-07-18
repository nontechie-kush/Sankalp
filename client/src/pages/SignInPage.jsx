import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { api } from '../lib/api';
import { setStoredUser, setToken, tokenPayload } from '../lib/auth';
import { trackEvent } from '../lib/analytics';

const S = {
  page: {
    '--bg': '#F7F5F1', '--card': '#FFFFFF', '--ink': '#191919',
    '--ink-2': '#5C574D', '--ink-3': '#8A8378', '--accent': '#B5654A',
    '--border': '#E4E0D5',
    minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    display: 'flex', flexDirection: 'column',
  },
  nav: {
    height: 52, display: 'flex', alignItems: 'center', padding: '0 20px',
    borderBottom: '1px solid var(--border)',
    maxWidth: 520, margin: '0 auto', width: '100%',
  },
  wordmark: { fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', color: 'var(--ink)' },
  main: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 20px 60px',
  },
  card: {
    width: '100%', maxWidth: 400,
  },
  iconWrap: {
    width: 56, height: 56,
    background: 'linear-gradient(135deg,#F2B79A,#BE6A43)',
    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  heading: {
    fontSize: 24, fontWeight: 700, letterSpacing: '-.01em',
    textAlign: 'center', margin: '0 0 8px', color: 'var(--ink)',
  },
  sub: {
    fontSize: 14, color: 'var(--ink-3)', textAlign: 'center',
    margin: '0 auto 32px', maxWidth: 280, lineHeight: 1.5,
  },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
    textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 8,
  },
  fieldWrap: { marginBottom: 20 },
  phoneRow: {
    display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)',
    borderRadius: 12, background: '#fff', overflow: 'hidden',
    transition: 'border-color .15s',
  },
  phoneCC: {
    padding: '0 12px', fontSize: 18, color: 'var(--ink-3)',
    borderRight: '1px solid var(--border)', height: 48,
    display: 'flex', alignItems: 'center',
  },
  phoneInput: {
    flex: 1, border: 'none', outline: 'none', padding: '0 14px',
    fontSize: 15, color: 'var(--ink)', background: 'transparent', height: 48,
  },
  input: {
    width: '100%', border: '1.5px solid var(--border)', borderRadius: 12,
    padding: '12px 14px', fontSize: 15, color: 'var(--ink)', background: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color .15s',
  },
  hint: { fontSize: 12, color: 'var(--ink-3)', marginTop: 6 },
  error: {
    fontSize: 13, color: '#C0392B', marginTop: 8, fontWeight: 500,
  },
  btn: (disabled) => ({
    width: '100%', padding: '14px', border: 'none', borderRadius: 12,
    background: disabled ? 'var(--border)' : 'var(--accent)',
    color: disabled ? 'var(--ink-3)' : '#fff',
    fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background .15s', marginTop: 4,
  }),
  otpRow: {
    display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20,
  },
  otpBox: (filled) => ({
    width: 44, height: 52, border: `1.5px solid ${filled ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 10, fontSize: 22, fontWeight: 700, textAlign: 'center',
    color: 'var(--ink)', background: '#fff', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color .15s',
  }),
  resendRow: {
    textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', marginBottom: 20,
  },
  resendBtn: {
    background: 'none', border: 'none', color: 'var(--accent)',
    fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0,
  },
};

export default function SignInPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [gotra, setGotra] = useState('');
  const [place, setPlace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const boxRefs = useRef([]);

  function phoneIsValid(value) {
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, '');
    if (trimmed.startsWith('+')) return /^\+\d{8,15}$/.test(trimmed.replace(/\s/g, ''));
    return digits.length === 10 || (digits.length >= 11 && digits.length <= 15);
  }

  useEffect(() => {
    if (tokenPayload()) navigate('/bookings');
  }, []);

  function startTimer() {
    setTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  }

  async function sendOtp() {
    if (!phoneIsValid(phone)) { setError('Enter a valid phone number with country code'); return; }
    trackEvent('signin_otp_send_started');
    setLoading(true); setError('');
    const d = await api.sendOtp(phone);
    setLoading(false);
    if (!d.success) { trackEvent('signin_otp_send_failed'); setError(d.error || 'Failed to send OTP'); return; }
    trackEvent('signin_otp_sent');
    setNormalizedPhone(d.phone);
    setPhase('otp');
    startTimer();
    setTimeout(() => boxRefs.current[0]?.focus(), 100);
  }

  async function verifyOtp() {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    trackEvent('signin_otp_verify_started');
    setLoading(true); setError('');
    const d = await api.verifyOtp(normalizedPhone, code);
    setLoading(false);
    if (!d.success) {
      trackEvent('signin_otp_verify_failed');
      setError(d.error || 'Invalid OTP');
      setOtp(['','','','','','']);
      boxRefs.current[0]?.focus();
      return;
    }
    trackEvent('signin_otp_verified', { user_type: d.isNew ? 'new' : 'returning' });
    setToken(d.token);
    setStoredUser(d.user);
    if (d.isNew) setPhase('profile');
    else navigate('/bookings');
  }

  async function saveProfile() {
    if (name.trim().length < 2) { setError('Enter your full name'); return; }
    trackEvent('signin_profile_save_started');
    setLoading(true); setError('');
    const d = await api.saveProfile(name.trim(), gotra.trim(), { sankalpLocation: place.trim() });
    setLoading(false);
    if (!d.success) { trackEvent('signin_profile_save_failed'); setError(d.error || 'Could not save. Try again.'); return; }
    trackEvent('signin_profile_saved', { gotra_provided: Boolean(gotra.trim()) });
    if (d.user) setStoredUser(d.user);
    navigate('/bookings');
  }

  function handleOtpInput(val, idx) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit;
    setOtp(next);
    setError('');
    if (digit && idx < 5) boxRefs.current[idx + 1]?.focus();
  }

  function handleOtpKey(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const next = [...otp]; next[idx - 1] = '';
      setOtp(next);
      boxRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    text.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    boxRefs.current[Math.min(text.length, 5)]?.focus();
  }

  const otpFull = otp.every(d => d !== '');

  const icon = phase === 'profile'
    ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="26"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="26"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>;

  const heading = phase === 'phone' ? 'Sign in / Sign up' : phase === 'otp' ? 'Enter the code' : 'Your details';
  const subtext = phase === 'phone'
    ? "We'll send a 6-digit code to verify your number."
    : phase === 'otp'
    ? <span>Sent to <strong style={{ color: 'var(--ink)' }}>{normalizedPhone}</strong></span>
    : 'Your name lets the pandit address the sankalp correctly.';

  return (
    <div style={S.page}>
      {/* Minimal nav */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={S.nav}>
          <Logo />
        </div>
      </div>

      <main style={S.main}>
        <div style={S.card}>
          {/* Icon */}
          <div style={S.iconWrap}>{icon}</div>

          {/* Heading */}
          <h2 style={S.heading}>{heading}</h2>
          <p style={S.sub}>{subtext}</p>

          {/* Phone phase */}
          {phase === 'phone' && (
            <div>
              <div style={S.fieldWrap}>
                <label style={S.label} htmlFor="signin-phone">Mobile number</label>
                <div style={S.phoneRow}>
                  <div style={S.phoneCC}>🌐</div>
                  <input
                    id="signin-phone"
                    style={S.phoneInput}
                    type="tel"
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    autoFocus
                  />
                </div>
                {error && <div style={S.error}>{error}</div>}
              </div>
              <button style={S.btn(loading || !phoneIsValid(phone))} onClick={sendOtp} disabled={loading || !phoneIsValid(phone)}>
                {loading ? 'Sending…' : 'Send OTP →'}
              </button>
            </div>
          )}

          {/* OTP phase */}
          {phase === 'otp' && (
            <div>
              <div style={S.otpRow} onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => boxRefs.current[i] = el}
                    style={S.otpBox(!!d)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpInput(e.target.value, i)}
                    onKeyDown={e => handleOtpKey(e, i)}
                  />
                ))}
              </div>
              {error && <div style={{ ...S.error, textAlign: 'center', marginBottom: 12 }}>{error}</div>}
              <div style={S.resendRow}>
                {timer > 0
                  ? <>Resend in <strong>{timer}s</strong></>
                  : <button style={S.resendBtn} onClick={() => { setPhase('phone'); setOtp(['','','','','','']); setError(''); }}>Change number or resend</button>
                }
              </div>
              <button style={S.btn(loading || !otpFull)} onClick={verifyOtp} disabled={loading || !otpFull}>
                {loading ? 'Verifying…' : 'Verify →'}
              </button>
            </div>
          )}

          {/* Profile phase */}
          {phase === 'profile' && (
            <div>
              <div style={S.fieldWrap}>
                <label style={S.label} htmlFor="signin-name">Your name <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input id="signin-name" style={S.input} type="text" placeholder="e.g. Aarav Sharma" value={name} onChange={e => { setName(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && saveProfile()} autoFocus />
                {error && <div style={S.error}>{error}</div>}
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label} htmlFor="signin-gotra">Gotra <span style={{ fontWeight: 400, color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input id="signin-gotra" style={S.input} type="text" placeholder="e.g. Kashyap" value={gotra} onChange={e => setGotra(e.target.value)} />
                <div style={S.hint}>The pandit will mention your gotra in the sankalp.</div>
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label} htmlFor="signin-location">City / location <span style={{ fontWeight: 400, color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0 }}>(recommended)</span></label>
                <input id="signin-location" style={S.input} type="text" autoComplete="address-level2" placeholder="e.g. Gurugram, Delhi" value={place} onChange={e => setPlace(e.target.value)} />
                <div style={S.hint}>Used only for the ritual sankalp.</div>
              </div>
              <button style={S.btn(loading || name.trim().length < 2)} onClick={saveProfile} disabled={loading || name.trim().length < 2}>
                {loading ? 'Saving…' : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

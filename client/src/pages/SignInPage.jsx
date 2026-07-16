import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { setStoredUser, setToken, tokenPayload } from '../lib/auth';
import { trackEvent } from '../lib/analytics';

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
    if (!d.success) {
      trackEvent('signin_otp_send_failed');
      setError(d.error || 'Failed to send OTP');
      return;
    }
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
    const d = await api.saveProfile(name.trim(), gotra.trim(), {
      sankalpLocation: place.trim(),
    });
    setLoading(false);
    if (!d.success) {
      trackEvent('signin_profile_save_failed');
      setError(d.error || 'Could not save. Try again.');
      return;
    }
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

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 40, paddingBottom: 60 }}>
        <div className="checkout-wrap">

          {/* Icon + heading */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#F2B79A,#BE6A43)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {phase === 'profile'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="28"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="28"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
              }
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
              {phase === 'phone' ? 'Sign in / Sign up' : phase === 'otp' ? 'Enter the code' : 'Your details'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 320, margin: '0 auto' }}>
              {phase === 'phone' && "We'll send a 6-digit code to verify your number."}
              {phase === 'otp' && <>Sent to <strong style={{ color: 'var(--text)' }}>{normalizedPhone}</strong></>}
              {phase === 'profile' && 'Your name lets the pandit address the sankalp correctly.'}
            </p>
          </div>

          {phase === 'phone' && (
            <div>
              <div className="field">
                <label className="field-label">Mobile number</label>
                <div className="phone-row">
                  <div className="phone-cc">🌐</div>
                  <input
                    className="phone-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    autoFocus
                  />
                </div>
                {error && <div className="field-error">{error}</div>}
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '14px' }} onClick={sendOtp} disabled={loading || !phoneIsValid(phone)}>
                {loading ? 'Sending…' : 'Send OTP →'}
              </button>
            </div>
          )}

          {phase === 'otp' && (
            <div>
              <div className="otp-box-row" onPaste={handlePaste} style={{ marginBottom: 16 }}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => boxRefs.current[i] = el}
                    className={`otp-box${d ? ' filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpInput(e.target.value, i)}
                    onKeyDown={e => handleOtpKey(e, i)}
                  />
                ))}
              </div>
              {error && <div className="field-error" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</div>}
              <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 14, color: 'var(--text-3)' }}>
                {timer > 0
                  ? <>Resend in <strong>{timer}s</strong></>
                  : <button style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => { setPhase('phone'); setOtp(['','','','','','']); setError(''); }}>Change number or resend</button>
                }
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '14px' }} onClick={verifyOtp} disabled={loading || !otpFull}>
                {loading ? 'Verifying…' : 'Verify →'}
              </button>
            </div>
          )}

          {phase === 'profile' && (
            <div>
              <div className="field">
                <label className="field-label">Your name <span style={{ color: 'var(--primary)' }}>*</span></label>
                <input className="field-input" type="text" placeholder="e.g. Aarav Sharma" value={name} onChange={e => { setName(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && saveProfile()} autoFocus />
                {error && <div className="field-error">{error}</div>}
              </div>
              <div className="field">
                <label className="field-label">Gotra <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="field-input" type="text" placeholder="e.g. Kashyap" value={gotra} onChange={e => setGotra(e.target.value)} />
                <div className="field-hint">The pandit will mention your gotra in the sankalp.</div>
              </div>
              <div className="field">
                <label className="field-label">Current city / location <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(recommended)</span></label>
                <input className="field-input" type="text" autoComplete="address-level2" placeholder="e.g. Gurugram, Delhi" value={place} onChange={e => setPlace(e.target.value)} />
                <div className="field-hint">This is used only for the ritual sankalp.</div>
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '14px' }} onClick={saveProfile} disabled={loading || name.trim().length < 2}>
                {loading ? 'Saving…' : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

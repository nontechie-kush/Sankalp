import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { setStoredUser, setToken, tokenPayload } from '../lib/auth';
import { useBooking } from '../context/BookingContext';

function StepBar({ onBack }) {
  return (
    <div>
      <div className="step-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button className="step-bar-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span className="step-label">Verify</span>
        <span className="step-count">3/4</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 28 }}>
        {[true, true, true, false].map((a, i) => <span key={i} className={a ? 'active' : ''} />)}
      </div>
      <p className="step-meta">Step 3 of 4</p>
    </div>
  );
}

export default function CheckoutVerifyPage() {
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const [phase, setPhase] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

  // If already logged in skip to payment
  useEffect(() => {
    const p = tokenPayload();
    if (p?.phone) { update({ phone: p.phone }); navigate('/checkout/payment'); }
  }, []);

  // Redirect if no booking
  if (!booking.momentId) {
    navigate('/');
    return null;
  }

  function startTimer() {
    setTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  }

  async function sendOtp() {
    if (!phoneIsValid(phone)) { setError('Enter a valid phone number with country code'); return; }
    setLoading(true); setError('');
    const d = await api.sendOtp(phone);
    setLoading(false);
    if (!d.success) { setError(d.error || 'Failed to send OTP'); return; }
    setNormalizedPhone(d.phone);
    setPhase('otp');
    startTimer();
    setTimeout(() => boxRefs.current[0]?.focus(), 100);
  }

  async function verifyOtp() {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true); setError('');
    const d = await api.verifyOtp(normalizedPhone, code);
    setLoading(false);
    if (!d.success) { setError(d.error || 'Invalid OTP'); setOtp(['','','','','','']); boxRefs.current[0]?.focus(); return; }
    setToken(d.token);
    setStoredUser(d.user);
    update({ phone: d.user.phone, userName: d.user.name || '' });
    if (d.isNew) navigate('/checkout/signup');
    else navigate('/checkout/payment');
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
      <main style={{ flex: 1, paddingTop: 24, paddingBottom: 100 }}>
        <div className="checkout-wrap">
          <StepBar onBack={() => navigate('/checkout/slot')} />

          {/* Icon + heading */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#F2B79A,#BE6A43)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="26">
                <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, marginBottom: 8 }}>
              {phase === 'phone' ? "What's your number?" : 'Enter the code'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 340, margin: '0 auto' }}>
              {phase === 'phone'
                ? "We'll send a code to verify. Your booking confirmation will come here."
                : <>Sent to <strong style={{ color: 'var(--text)' }}>{normalizedPhone}</strong></>
              }
            </p>
          </div>

          {phase === 'phone' ? (
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
            </div>
          ) : (
            <div>
              <div className="otp-box-row" onPaste={handlePaste}>
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
              <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 14, color: 'var(--text-3)' }}>
                {timer > 0
                  ? <>Resend code in <strong>{timer}s</strong></>
                  : <button style={{ color: 'var(--primary-light)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => { setPhase('phone'); setOtp(['','','','','','']); setError(''); }}>Change number or resend</button>
                }
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="bottom-bar">
        <div className="bottom-bar-info">
          <div className="bottom-bar-label">{booking.ritualName}</div>
          <div className="bottom-bar-price">Rs {booking.price}</div>
        </div>
        <button
          className="btn-primary"
          onClick={phase === 'phone' ? sendOtp : verifyOtp}
          disabled={loading || (phase === 'phone' ? !phoneIsValid(phone) : !otpFull)}
        >
          {loading ? 'Please wait…' : phase === 'phone' ? 'Send code →' : 'Verify →'}
        </button>
      </div>
    </div>
  );
}

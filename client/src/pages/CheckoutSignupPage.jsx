import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { setStoredUser } from '../lib/auth';
import { useBooking } from '../context/BookingContext';

export default function CheckoutSignupPage() {
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const [name, setName] = useState('');
  const [gotra, setGotra] = useState('');
  const [place, setPlace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!booking.phone) { navigate('/checkout/verify'); return null; }

  async function submit() {
    if (name.trim().length < 2) { setError('Please enter your full name'); return; }
    setLoading(true); setError('');
    const d = await api.saveProfile(name.trim(), gotra.trim());
    setLoading(false);
    if (!d.success) { setError(d.error || 'Could not save. Try again.'); return; }
    if (d.user) setStoredUser(d.user);
    update({ userName: name.trim(), place: place.trim() });
    navigate('/checkout/payment');
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 24, paddingBottom: 100 }}>
        <div className="checkout-wrap">
          <div>
            <div className="step-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button className="step-bar-back" onClick={() => navigate('/checkout/verify')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back
              </button>
              <span className="step-label">Your details</span>
              <span className="step-count">2/3</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 28 }}>
              {[true, true, false].map((a, i) => <span key={i} className={a ? 'active' : ''} />)}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#F2B79A,#BE6A43)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="26">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, marginBottom: 8 }}>One last step</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 340, margin: '0 auto' }}>
              The pandit needs these details to perform the sankalp in your name.
            </p>
          </div>

          <div className="field">
            <label className="field-label">Your name <span style={{ color: 'var(--primary-light)' }}>*</span></label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
            {error && <div className="field-error">{error}</div>}
          </div>

          <div className="field">
            <label className="field-label">
              Gotra <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Kashyap"
              value={gotra}
              onChange={e => setGotra(e.target.value)}
            />
            <div className="field-hint">The pandit will mention your gotra in the sankalp.</div>
          </div>

          <div className="field">
            <label className="field-label">
              Place <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Delhi, Mumbai"
              value={place}
              onChange={e => setPlace(e.target.value)}
            />
            <div className="field-hint">Your city or location, included in the sankalp.</div>
          </div>
        </div>
      </main>

      <div className="bottom-bar">
        <div className="bottom-bar-info">
          <div className="bottom-bar-label">{booking.ritualName} · {booking.momentName}</div>
          <div className="bottom-bar-price">Rs {booking.price}</div>
        </div>
        <button className="btn-primary" onClick={submit} disabled={loading || name.trim().length < 2}>
          {loading ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { getStoredUser, setStoredUser, tokenPayload } from '../lib/auth';
import { useBooking } from '../context/BookingContext';

export default function CheckoutSignupPage() {
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const [bookingFor, setBookingFor] = useState('self');
  const [name, setName] = useState('');
  const [gotra, setGotra] = useState('');
  const [place, setPlace] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.name) setName(user.name);
    if (user?.gotra) setGotra(user.gotra);
    if (user?.sankalpLocation) setPlace(user.sankalpLocation);

    api.me().then((d) => {
      if (!d.success || !d.user) return;
      if (d.user.name) setName(d.user.name);
      if (d.user.gotra) setGotra(d.user.gotra);
      if (d.user.sankalpLocation) setPlace(d.user.sankalpLocation);
      update({
        phone: d.user.phone || booking.phone,
        userName: d.user.name || booking.userName,
        gotra: d.user.gotra || booking.gotra,
        place: d.user.sankalpLocation || booking.place,
      });
    }).catch(() => {});
  }, []);

  if (!booking.phone && !tokenPayload()?.phone) { navigate('/checkout/verify'); return null; }

  const isOther = bookingFor === 'other';

  async function submit() {
    if (name.trim().length < 2) {
      setError(isOther ? 'Please enter their full name' : 'Please enter your full name');
      return;
    }
    setLoading(true); setError('');

    if (!isOther) {
      const d = await api.saveProfile(name.trim(), gotra.trim(), { sankalpLocation: place.trim() });
      setLoading(false);
      if (!d.success) { setError(d.error || 'Could not save. Try again.'); return; }
      if (d.user) setStoredUser(d.user);
      update({
        phone: d.user?.phone || booking.phone || tokenPayload()?.phone || '',
        userName: name.trim(),
        gotra: gotra.trim(),
        place: place.trim(),
        bookingFor,
        beneficiaryRelation: '',
      });
    } else {
      setLoading(false);
      update({
        userName: name.trim(),
        place: place.trim(),
        bookingFor,
        beneficiaryRelation: relation.trim(),
      });
    }

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

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#F2B79A,#BE6A43)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" width="26">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, marginBottom: 8 }}>One last step</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 340, margin: '0 auto' }}>
              These details help the pandit take the sankalp correctly. We save them so you do not have to refill them next time.
            </p>
          </div>

          {/* Who is this for? */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Who is this booking for?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { key: 'self', icon: '🙏', label: 'For myself', sub: 'Ritual in my name' },
                { key: 'other', icon: '❤️', label: 'For someone else', sub: 'Gift it to a loved one' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setBookingFor(opt.key); setError(''); }}
                  style={{
                    padding: '14px 12px', borderRadius: 12, border: '1.5px solid',
                    borderColor: bookingFor === opt.key ? 'var(--primary)' : 'var(--border)',
                    background: bookingFor === opt.key ? '#FFF8F4' : 'var(--bg-card)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: bookingFor === opt.key ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {isOther && (
            <div className="field">
              <label className="field-label" htmlFor="checkout-relation">
                Your relation to them <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="checkout-relation"
                className="field-input"
                type="text"
                placeholder="e.g. Mother, Father, Spouse, Friend"
                value={relation}
                onChange={e => setRelation(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="checkout-name">
              {isOther ? 'Their name' : 'Your name'} <span style={{ color: 'var(--primary-light)' }}>*</span>
            </label>
            <input
              id="checkout-name"
              className="field-input"
              type="text"
              placeholder={isOther ? 'e.g. Sunita Sharma' : 'e.g. Aarav Sharma'}
              autoComplete="name"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
            {error && <div className="field-error">{error}</div>}
            <div className="field-hint">
              {isOther ? 'The pandit will perform the sankalp in their name.' : 'The pandit will perform the sankalp in your name.'}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="checkout-gotra">
              {isOther ? 'Their gotra' : 'Gotra'} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(recommended)</span>
            </label>
            <input
              id="checkout-gotra"
              className="field-input"
              type="text"
              placeholder="e.g. Kashyap"
              value={gotra}
              onChange={e => setGotra(e.target.value)}
            />
            <div className="field-hint">If you do not know it, you can leave this blank.</div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="checkout-location">
              {isOther ? 'Their city' : 'Current city / location'} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(recommended)</span>
            </label>
            <input
              id="checkout-location"
              className="field-input"
              type="text"
              autoComplete="address-level2"
              placeholder={isOther ? 'e.g. Delhi, Mumbai' : 'e.g. Gurugram, Delhi'}
              value={place}
              onChange={e => setPlace(e.target.value)}
            />
            <div className="field-hint">
              {isOther ? 'Their city or location, included in the sankalp.' : 'This is used only for the ritual sankalp, not pandit matching.'}
            </div>
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

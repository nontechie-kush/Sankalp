import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { getStoredUser, setStoredUser, tokenPayload } from '../lib/auth';
import { newClientRequestId, useBooking } from '../context/BookingContext';
import { bookingEventParams, trackEvent } from '../lib/analytics';

function clean(value) {
  return String(value || '').trim();
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
      <path d="M20 12v8H4v-8" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H8.5A2.5 2.5 0 1 1 12 3.5V7Z" />
      <path d="M12 7h3.5A2.5 2.5 0 1 0 12 3.5V7Z" />
    </svg>
  );
}

export default function CheckoutSignupPage() {
  const navigate = useNavigate();
  const { booking, update } = useBooking();
  const storedUser = getStoredUser() || {};
  const initialFor = booking.bookingFor || 'self';
  const [userProfile, setUserProfile] = useState(storedUser);
  const [bookingFor, setBookingFor] = useState(initialFor);
  const [name, setName] = useState(
    initialFor === 'other'
      ? booking.beneficiaryName || booking.userName || ''
      : booking.beneficiaryName || booking.userName || storedUser.name || ''
  );
  const [gotra, setGotra] = useState(
    initialFor === 'other'
      ? booking.beneficiaryGotra || booking.gotra || ''
      : booking.beneficiaryGotra || booking.gotra || storedUser.gotra || ''
  );
  const [place, setPlace] = useState(
    initialFor === 'other'
      ? booking.beneficiaryLocation || booking.place || ''
      : booking.beneficiaryLocation || booking.place || storedUser.sankalpLocation || ''
  );
  const [relation, setRelation] = useState(booking.beneficiaryRelation || '');
  const [showOptional, setShowOptional] = useState(Boolean(
    booking.beneficiaryRelation || booking.beneficiaryGotra || booking.beneficiaryLocation
  ));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOther = bookingFor === 'other';

  useEffect(() => {
    let cancelled = false;
    api.me().then((d) => {
      if (cancelled || !d.success || !d.user) return;
      setUserProfile(d.user);
      update({ phone: d.user.phone || booking.phone });
      if (initialFor !== 'other' && !booking.beneficiaryName) {
        setName(d.user.name || '');
        setGotra(d.user.gotra || '');
        setPlace(d.user.sankalpLocation || '');
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!booking.phone && !tokenPayload()?.phone) {
    navigate('/checkout/verify');
    return null;
  }

  function chooseBookingFor(next) {
    if (next === bookingFor) return;
    setBookingFor(next);
    setError('');
    trackEvent('booking_for_selected', {
      ...bookingEventParams(booking),
      booking_for: next,
    });

    if (next === 'self') {
      const profile = userProfile || getStoredUser() || {};
      setName(profile.name || '');
      setGotra(profile.gotra || '');
      setPlace(profile.sankalpLocation || '');
      setRelation('');
      setShowOptional(false);
      return;
    }

    setName('');
    setGotra('');
    setPlace('');
    setRelation('');
    setShowOptional(false);
  }

  async function submit() {
    const beneficiaryName = clean(name);
    const beneficiaryGotra = clean(gotra);
    const beneficiaryLocation = clean(place);
    const beneficiaryRelation = isOther ? clean(relation) : '';

    if (beneficiaryName.length < 2) {
      setError(isOther ? 'Enter their full name.' : 'Enter your full name.');
      return;
    }

    trackEvent('checkout_details_continue_clicked', {
      ...bookingEventParams(booking),
      booking_for: bookingFor,
      gotra_provided: Boolean(beneficiaryGotra),
      location_provided: Boolean(beneficiaryLocation),
      relation_provided: Boolean(beneficiaryRelation),
    });

    setLoading(true);
    setError('');

    let savedUser = userProfile;
    if (!isOther) {
      const d = await api.saveProfile(beneficiaryName, beneficiaryGotra, { sankalpLocation: beneficiaryLocation });
      setLoading(false);
      if (!d.success) {
        setError(d.error || 'Could not save. Try again.');
        return;
      }
      if (d.user) {
        savedUser = d.user;
        setUserProfile(d.user);
        setStoredUser(d.user);
      }
    } else {
      setLoading(false);
    }

    update({
      phone: savedUser?.phone || booking.phone || tokenPayload()?.phone || '',
      userName: beneficiaryName,
      gotra: beneficiaryGotra,
      place: beneficiaryLocation,
      bookingFor,
      beneficiaryName,
      beneficiaryRelation,
      beneficiaryGotra,
      beneficiaryLocation,
      bookingId: null,
      bookingRef: '',
      paymentId: null,
      clientRequestId: newClientRequestId(),
    });

    navigate('/checkout/payment');
  }

  const options = [
    { key: 'self', label: 'For myself', sub: 'Use my saved details', icon: <PersonIcon /> },
    { key: 'other', label: 'For someone else', sub: 'Parent, partner, child, friend', icon: <GiftIcon /> },
  ];

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
              <span className="step-label">Sankalp for</span>
              <span className="step-count">2/3</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 28 }}>
              {[true, true, false].map((a, i) => <span key={i} className={a ? 'active' : ''} />)}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#F2B79A,#BE6A43)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}>
              {isOther ? <GiftIcon /> : <PersonIcon />}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, marginBottom: 8 }}>
              Who is this sankalp for?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 340, margin: '0 auto' }}>
              {isOther
                ? 'Only their name is required. Add gotra or city if you know it.'
                : 'Confirm your details once. The pandit will use them in the sankalp.'}
            </p>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {options.map((opt) => {
                const active = bookingFor === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => chooseBookingFor(opt.key)}
                    style={{
                      padding: '14px 12px',
                      borderRadius: 12,
                      border: '1.5px solid',
                      borderColor: active ? 'var(--primary)' : 'var(--border)',
                      background: active ? '#FFF8F4' : 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all .15s',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span style={{ color: active ? 'var(--primary)' : 'var(--text-3)', display: 'inline-flex', marginBottom: 7 }}>
                      {opt.icon}
                    </span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>{opt.label}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.35 }}>{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="checkout-name">
              {isOther ? 'Their full name' : 'Your full name'} <span style={{ color: 'var(--primary-light)' }}>*</span>
            </label>
            <input
              id="checkout-name"
              className="field-input"
              type="text"
              placeholder={isOther ? 'e.g. Sunita Sharma' : 'e.g. Aarav Sharma'}
              autoComplete={isOther ? 'off' : 'name'}
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
            {error && <div className="field-error">{error}</div>}
            <div className="field-hint">
              {isOther ? 'The pandit will perform the sankalp in their name.' : 'This can be updated before payment.'}
            </div>
          </div>

          {!showOptional ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginTop: 2, marginBottom: 20 }}
              onClick={() => setShowOptional(true)}
            >
              {isOther ? 'Add relation, gotra or city' : 'Add gotra or city'}
            </button>
          ) : (
            <div style={{ marginBottom: 18 }}>
              {isOther && (
                <div className="field">
                  <label className="field-label" htmlFor="checkout-relation">
                    Relation <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
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
                <label className="field-label" htmlFor="checkout-gotra">
                  {isOther ? 'Their gotra' : 'Gotra'} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="checkout-gotra"
                  className="field-input"
                  type="text"
                  placeholder="e.g. Kashyap"
                  value={gotra}
                  onChange={e => setGotra(e.target.value)}
                />
                <div className="field-hint">Leave this blank if you do not know it.</div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="checkout-location">
                  {isOther ? 'Their city' : 'Current city'} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
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
                  Used only for the sankalp details, not for pandit matching.
                </div>
              </div>
            </div>
          )}

          {isOther && (
            <div className="timeline-card" style={{ marginBottom: 18 }}>
              <div className="timeline-icon">
                <GiftIcon />
              </div>
              <div>
                <div className="timeline-label">Booking on behalf</div>
                <div className="timeline-title">You pay and receive updates</div>
                <div className="timeline-sub">Their phone number is not needed. The ritual is performed using the details you enter here.</div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="bottom-bar">
        <div className="bottom-bar-info">
          <div className="bottom-bar-label">{booking.ritualName} · {booking.momentName}</div>
          <div className="bottom-bar-price">Rs {booking.price}</div>
        </div>
        <button className="btn-primary" onClick={submit} disabled={loading || clean(name).length < 2}>
          {loading ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RITUAL_ICONS = {
  rk: <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z"/>,
  da: <><circle cx="12" cy="12" r="8"/><path d="M12 9v6M10 12h4"/></>,
  ps: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>,
  nb: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.3"/></>,
};
import Navbar from '../components/Navbar';
import { RITUALS } from '../data/rituals';
import { useBooking } from '../context/BookingContext';
import { trackEvent } from '../lib/analytics';
import { applyBackendPrices, loadBackendPriceMap } from '../lib/catalogPrices';

const RITUAL_DETAIL_COPY = {
  rk: {
    why: [
      'For moments where you want to feel protected, steady, and less affected by negativity.',
      'People usually choose it before interviews, exams, travel, health procedures, or a major first day.',
    ],
    pandit: [
      'Takes your name in the sankalp and sets the intention for your selected moment.',
      'Recites protective mantras and performs the Raksha Kavach vidhi on your behalf.',
      'Shares completion status and ritual proof once the puja is done.',
    ],
  },
  da: {
    why: [
      'For money, business, career, and new-venture moments where you want an auspicious start.',
      'People usually choose it before pitches, salary conversations, launches, purchases, or property decisions.',
    ],
    pandit: [
      'Takes your name in the sankalp and invokes Lakshmi-Kuber blessings for prosperity.',
      'Performs mantra japa, offerings, and aarti for your selected wealth intention.',
      'Shares completion status and ritual proof once the puja is done.',
    ],
  },
  ps: {
    why: [
      'For relationship moments where you want courage, softness, harmony, or emotional clarity.',
      'People usually choose it before proposing, reconnecting, resolving a fight, or strengthening a bond.',
    ],
    pandit: [
      'Takes your name in the sankalp and sets the intention for harmony in the relationship.',
      'Performs mantras and offerings dedicated to love, peace, and emotional alignment.',
      'Shares completion status and ritual proof once the puja is done.',
    ],
  },
  nb: {
    why: [
      'For phases where things feel heavy, blocked, or affected by nazar after a good run.',
      'People usually choose it for home, business, vehicle, family, health, or repeated bad-luck situations.',
    ],
    pandit: [
      'Takes your name in the sankalp and performs the nazar utaarna vidhi.',
      'Uses traditional mantras and remedies to clear drishti dosha and heavy energy.',
      'Shares completion status and ritual proof once the puja is done.',
    ],
  },
};

function getIstParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);

  return {
    hour: Number(parts.find(part => part.type === 'hour')?.value || 0),
    minute: Number(parts.find(part => part.type === 'minute')?.value || 0),
  };
}

function formatDeliveryLabel(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getFulfilmentPreview(now = new Date()) {
  const { hour, minute } = getIstParts(now);
  const isBeforeCutoff = hour < 14 || (hour === 14 && minute === 0);
  const hours = isBeforeCutoff ? 12 : 24;
  const byDate = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return {
    hours,
    title: `Video within ${hours} hours`,
    dateLabel: formatDeliveryLabel(byDate),
    sub: isBeforeCutoff
      ? 'Bookings made by 2 PM IST are usually completed and shared within 12 hours, unless the day is inauspicious.'
      : 'Bookings after 2 PM IST are usually completed and shared within 24 hours, unless the day is inauspicious.',
  };
}

function getSankalpCopy(ritual, moment) {
  const fallback = {
    why: [
      'For a meaningful moment where you want to enter with a clear intention.',
      'People choose it to feel more prepared, supported, and grounded before the event.',
    ],
    pandit: [
      'Takes your name in the sankalp and sets the intention for your selected moment.',
      'Performs the relevant mantras and offerings on your behalf.',
      'Shares completion status and ritual proof once the puja is done.',
    ],
  };

  const copy = RITUAL_DETAIL_COPY[ritual.id] || fallback;
  return {
    why: [
      moment.why,
      ...copy.why,
    ],
    pandit: copy.pandit,
  };
}

function BulletList({ items }) {
  return (
    <ul style={{ display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, index) => (
        <li key={index} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.55 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(186,98,55,.12)', color: 'var(--primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', marginTop: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailBack({ onBack }) {
  return (
    <button
      className="step-bar-back"
      onClick={onBack}
      style={{ marginBottom: 18, padding: '4px 0' }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      Back
    </button>
  );
}

export default function RitualPage() {
  const { ritualId, momentId } = useParams();
  const navigate = useNavigate();
  const { update } = useBooking();
  const [rituals, setRituals] = useState(RITUALS);

  useEffect(() => {
    let cancelled = false;
    loadBackendPriceMap()
      .then((priceMap) => {
        if (!cancelled) setRituals(applyBackendPrices(RITUALS, priceMap));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const ritual = rituals.find(r => r.id === ritualId);
  if (!ritual) return <div style={{ padding: 40, textAlign: 'center' }}>Ritual not found. <button onClick={() => navigate('/')}>Go home</button></div>;

  // If a specific moment was pre-selected
  let selectedMoment = null;
  if (momentId) {
    for (const g of ritual.groups) {
      const m = g.moments.find(m => m.id === momentId);
      if (m) { selectedMoment = m; break; }
    }
  }

  function pickMoment(moment) {
    const fulfilment = getFulfilmentPreview();
    trackEvent('moment_selected', {
      source: 'ritual_category_page',
      ritual_id: ritual.id,
      ritual_name: ritual.name,
      moment_id: moment.id,
      moment_name: moment.name,
      value: moment.price,
      currency: 'INR',
      delivery_window_hours: fulfilment.hours,
    });
    update({
      ritualId: ritual.id,
      ritualName: ritual.name,
      momentId: moment.id,
      momentName: moment.name,
      price: moment.price,
      deliveryDate: fulfilment.dateLabel,
      deliveryWindowHours: fulfilment.hours,
    });
    navigate(`/ritual/${ritual.id}/${moment.id}`);
  }

  const fulfilment = getFulfilmentPreview();
  const sankalpCopy = selectedMoment ? getSankalpCopy(ritual, selectedMoment) : null;

  function continueBooking() {
    if (!selectedMoment) return;
    trackEvent('booking_flow_started', {
      ritual_id: ritual.id,
      ritual_name: ritual.name,
      moment_id: selectedMoment.id,
      moment_name: selectedMoment.name,
      value: selectedMoment.price,
      currency: 'INR',
      delivery_window_hours: fulfilment.hours,
    });
    update({
      ritualId: ritual.id,
      ritualName: ritual.name,
      momentId: selectedMoment.id,
      momentName: selectedMoment.name,
      price: selectedMoment.price,
      deliveryDate: fulfilment.dateLabel,
      deliveryWindowHours: fulfilment.hours,
    });
    navigate('/checkout/verify');
  }

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 24, paddingBottom: 100 }}>
        <div className="checkout-wrap">
          <DetailBack onBack={() => navigate('/')} />

          {selectedMoment && (
            <>
              <div className="card" style={{ padding: 24, marginBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" width="25" height="25" style={{ color: 'var(--primary-light)' }}>
                      {RITUAL_ICONS[ritual.id]}
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 8 }}>Selected Sankalp</div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 31, lineHeight: 1.08, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{selectedMoment.name}</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
                      Part of {ritual.name}
                    </p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15, lineHeight: 1.45 }}>{selectedMoment.why}</p>
                  <div style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: 18, whiteSpace: 'nowrap' }}>Rs {selectedMoment.price}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 8 }}>Why people do this</div>
                  <BulletList items={sankalpCopy.why} />
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 8 }}>What the pandit may do</div>
                  <BulletList items={sankalpCopy.pandit} />
                </div>
              </div>

              <div className="timeline-card">
                <div className="timeline-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="20" height="20">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="timeline-label">Ritual video timeline</div>
                  <div className="timeline-title">{fulfilment.title}</div>
                  <div className="timeline-sub">{fulfilment.sub}</div>
                </div>
                <div className="timeline-date">By {fulfilment.dateLabel}</div>
              </div>
            </>
          )}

          {/* Ritual banner */}
          {!selectedMoment && (
            <div className="ritual-banner" style={{ background: ritual.bg, marginBottom: 16 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(92,58,30,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width="120" height="120" style={{ position: 'absolute', right: -12, bottom: -12 }}>
                {RITUAL_ICONS[ritual.id]}
              </svg>
              <div style={{ position: 'absolute', top: 16, left: 16 }}>
                <span className="badge">{ritual.tag}</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: 'rgba(28,16,7,.85)', position: 'relative', zIndex: 1 }}>{ritual.name}</h1>
              <p style={{ fontSize: 13, color: 'rgba(28,16,7,.6)', marginTop: 6, maxWidth: 320, position: 'relative', zIndex: 1 }}>{ritual.why.slice(0, 100)}…</p>
            </div>
          )}

          {/* Browse moments if none selected */}
          {!selectedMoment && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-sans)',fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Choose your moment</h2>
              {ritual.groups.map((g, gi) => (
                <div key={gi} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>{g.name}</div>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {g.moments.map(m => (
                      <div key={m.id} className="moment-row" onClick={() => pickMoment(m)}>
                        <div className="moment-icon" style={{ background: 'var(--bg)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="20" height="20" style={{ color: 'var(--primary-light)' }}>
                            <path d="M5 12h14M13 6l6 6-6 6"/>
                          </svg>
                        </div>
                        <div className="moment-info">
                          <div className="moment-name">
                            {m.name}
                            {m.pop && <span style={{ marginLeft: 8, background: '#E8F0E8', color: '#2D6B2D', fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100 }}>Popular</span>}
                          </div>
                          <div className="moment-why">{m.why}</div>
                        </div>
                        <div className="moment-price">Rs {m.price}</div>
                        <div className="moment-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom bar */}
      {selectedMoment && (
        <div className="bottom-bar">
          <div className="bottom-bar-info">
            <div className="bottom-bar-label">{fulfilment.title}</div>
            <div className="bottom-bar-price">Rs {selectedMoment.price}</div>
          </div>
          <button className="btn-primary" onClick={continueBooking}>Continue booking →</button>
        </div>
      )}
    </div>
  );
}

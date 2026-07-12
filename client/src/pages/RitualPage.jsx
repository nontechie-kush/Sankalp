import { useNavigate, useParams } from 'react-router-dom';

const RITUAL_ICONS = {
  rk: <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z"/>,
  da: <><circle cx="12" cy="12" r="8"/><path d="M12 9v6M10 12h4"/></>,
  ps: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>,
  nb: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.3"/></>,
};
import Navbar from '../components/Navbar';
import { RITUALS, getDeliveryDate } from '../data/rituals';
import { useBooking } from '../context/BookingContext';

function StepBar({ step, total, title, onBack }) {
  return (
    <div>
      <div className="step-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button className="step-bar-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span className="step-label">{title}</span>
        <span className="step-count">{step}/{total}</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 28 }}>
        {Array.from({ length: total }).map((_, i) => <span key={i} className={i < step ? 'active' : ''} />)}
      </div>
      <p className="step-meta">Step {step} of {total}</p>
    </div>
  );
}

export default function RitualPage() {
  const { ritualId, momentId } = useParams();
  const navigate = useNavigate();
  const { update } = useBooking();

  const ritual = RITUALS.find(r => r.id === ritualId);
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
    update({
      ritualId: ritual.id,
      ritualName: ritual.name,
      momentId: moment.id,
      momentName: moment.name,
      price: moment.price,
      deliveryDate: getDeliveryDate(),
    });
    navigate(`/ritual/${ritual.id}/${moment.id}`);
  }

  function continueBooking() {
    if (!selectedMoment) return;
    update({
      ritualId: ritual.id,
      ritualName: ritual.name,
      momentId: selectedMoment.id,
      momentName: selectedMoment.name,
      price: selectedMoment.price,
      deliveryDate: getDeliveryDate(),
    });
    navigate('/checkout/slot');
  }

  const delivery = getDeliveryDate();

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 24, paddingBottom: 100 }}>
        <div className="checkout-wrap">
          <StepBar step={1} total={4} title="Ritual details" onBack={() => navigate('/')} />

          {/* Ritual banner */}
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

          {/* Selected moment */}
          {selectedMoment && (
            <div className="card" style={{ padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="20" height="20" style={{ color: 'var(--primary-light)' }}>
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 2 }}>Selected Sankalp</div>
                <div style={{ fontFamily: 'var(--font-sans)',fontSize: 20, fontWeight: 600 }}>{selectedMoment.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{selectedMoment.why}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: 16, flexShrink: 0 }}>Rs {selectedMoment.price}</div>
            </div>
          )}

          {/* Timeline */}
          {selectedMoment && (
            <div className="timeline-card">
              <div className="timeline-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="20" height="20">
                  <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="timeline-label">Performance Timeline</div>
                <div className="timeline-title">Performed by tomorrow</div>
                <div className="timeline-sub">Bookings placed at or after 2 PM are performed by the end of the next day.</div>
              </div>
              <div className="timeline-date">By {delivery}</div>
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
            <div className="bottom-bar-label">Performed by tomorrow</div>
            <div className="bottom-bar-price">Rs {selectedMoment.price}</div>
          </div>
          <button className="btn-primary" onClick={continueBooking}>Continue booking →</button>
        </div>
      )}
    </div>
  );
}

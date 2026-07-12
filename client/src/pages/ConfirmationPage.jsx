import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBooking } from '../context/BookingContext';

export default function ConfirmationPage() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const { booking, reset } = useBooking();

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div className="conf-icon" style={{ marginBottom: 24 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="30" height="30" style={{ color: '#2D6B2D' }}>
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>Booking confirmed</h1>
          <p style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 32, lineHeight: 1.6 }}>
            Your ritual has been scheduled. We'll update you once a pandit is assigned and again when it's complete.
          </p>

          {ref && (
            <div className="card" style={{ padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 12 }}>Booking details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: 'Reference', value: ref },
                    booking.ritualName && { label: 'Ritual', value: booking.ritualName },
                    booking.momentName && { label: 'Intent', value: booking.momentName },
                    booking.deliveryDate && { label: 'Expected by', value: booking.deliveryDate },
                    booking.price && { label: 'Paid', value: `Rs ${booking.price}` },
                  ].filter(Boolean).map(r => (
                    <tr key={r.label}>
                      <td style={{ padding: '10px 0', fontSize: 13, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Video placeholder */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: 10, textAlign: 'left' }}>Ritual video</div>
            <div style={{
              background: 'linear-gradient(160deg, #2C1A0E 0%, #1a0f07 100%)',
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '16/9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Flame shimmer bg */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(190,106,67,.25) 0%, transparent 70%)' }} />
              {/* Play button */}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.6)" width="22" height="22" style={{ marginLeft: 3 }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600, margin: 0, position: 'relative' }}>Your ritual video</p>
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginTop: 4, position: 'relative' }}>Delivered after the pandit completes the ritual</p>
            </div>
          </div>

          <div className="timeline-card" style={{ textAlign: 'left', marginBottom: 28 }}>
            <div className="timeline-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="20" height="20">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
              </svg>
            </div>
            <div>
              <div className="timeline-label">What happens next</div>
              <div className="timeline-title">Ritual performed by tomorrow</div>
              <div className="timeline-sub">You'll receive a confirmation once the pandit completes the ritual.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => { reset(); navigate('/'); }}>Book another ritual →</button>
            <button className="btn-secondary" onClick={() => navigate('/bookings')}>View my bookings</button>
          </div>
        </div>
      </main>
    </div>
  );
}

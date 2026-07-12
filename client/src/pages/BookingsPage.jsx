import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { tokenPayload } from '../lib/auth';

function BookingCard({ booking }) {
  const date = booking.booking_date
    ? new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const isPast = booking.status === 'completed' || new Date(booking.booking_date) < new Date();
  const price = booking.price_display || (booking.price_paise > 0 ? `Rs ${Math.round(booking.price_paise / 100)}` : '—');

  return (
    <div className="card" style={{ padding: '20px', marginBottom: 12 }}>
      {/* Header row: ritual name + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: isPast ? 'var(--text-3)' : 'var(--primary-light)', marginBottom: 4 }}>
            {booking.ritual_name || 'Ritual'}
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, marginBottom: 2 }}>
            {booking.moment || '—'}
          </div>
        </div>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 100,
          fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', flexShrink: 0,
          background: booking.status === 'completed' ? '#E8F0E8' : booking.status === 'cancelled' ? '#FEE' : '#FFF3E0',
          color: booking.status === 'completed' ? '#2D6B2D' : booking.status === 'cancelled' ? '#C0392B' : '#7D4A2F',
        }}>
          {booking.status || 'confirmed'}
        </span>
      </div>

      {/* Detail rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <DetailRow icon={<CalIcon />} label="Date" value={date} />
        <DetailRow icon={<RupeeIcon />} label="Amount paid" value={price} />
        {booking.pandit_name && (
          <DetailRow icon={<PanditIcon />} label="Performed by" value={`${booking.pandit_name}${booking.pandit_location ? ` · ${booking.pandit_location}` : ''}`} />
        )}
        {booking.booking_ref && (
          <DetailRow icon={<RefIcon />} label="Booking ref" value={booking.booking_ref} mono />
        )}
      </div>

      {/* Certificate link */}
      {booking.certificate_url ? (
        <a
          href={booking.certificate_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
            padding: '12px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#FFF8EE,#FFF3DC)',
            border: '1px solid #E8C97A', textDecoration: 'none', color: '#7D4A2F',
          }}
        >
          <CertIcon />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Ritual Certificate</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Tap to view & download</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="16" height="16" style={{ marginLeft: 'auto', color: '#C8845A' }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
          </svg>
        </a>
      ) : isPast ? (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CertIcon muted />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Certificate will be shared here once ready</span>
        </div>
      ) : null}

      {/* Video section */}
      {booking.video_url ? (
        <a
          href={booking.video_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', marginTop: 10, textDecoration: 'none' }}
        >
          <div style={{ background: 'linear-gradient(160deg,#2C1A0E,#1a0f07)', borderRadius: 12, position: 'relative', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(190,106,67,.25) 0%, transparent 70%)' }} />
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.9)" width="20" height="20" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, fontWeight: 600, margin: 0, position: 'relative' }}>Watch ritual video</p>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, margin: '3px 0 0', position: 'relative' }}>Tap to open</p>
          </div>
        </a>
      ) : (
        <div style={{ marginTop: 10, background: 'linear-gradient(160deg,#2C1A0E,#1a0f07)', borderRadius: 12, position: 'relative', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(190,106,67,.15) 0%, transparent 70%)' }} />
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
            <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.35)" width="16" height="16" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
          </div>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, margin: 0, position: 'relative' }}>
            {booking.status === 'completed' ? 'Video will be added soon' : 'Video coming after ritual'}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--text-3)', flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="15" height="15">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
function RupeeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="15" height="15">
      <path d="M6 3h12M6 8h12M6 13l8 8M6 8a4 4 0 0 0 0 8"/>
    </svg>
  );
}
function PanditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="15" height="15">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function RefIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="15" height="15">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
    </svg>
  );
}
function CertIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="18" height="18" style={{ color: muted ? 'var(--text-3)' : '#C8845A', flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>
    </svg>
  );
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const user = tokenPayload();
  const [bookings, setBookings] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    if (!tokenPayload()) { navigate('/signin'); return; }
    api.getBookings().then(d => {
      if (d.success) setBookings(d.bookings || { upcoming: [], past: [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const shown = tab === 'upcoming' ? bookings.upcoming : bookings.past;

  return (
    <div className="page-wrap">
      <Navbar />
      <main style={{ flex: 1, paddingTop: 32, paddingBottom: 60 }}>
        <div className="checkout-wrap">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, marginBottom: 8 }}>My bookings</h1>
          {user?.name && <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{user.name}</p>}
          {user?.phone && <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>{user.phone}</p>}

          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['upcoming', 'past'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 18px', borderRadius: 100, border: '1.5px solid',
                  borderColor: tab === t ? 'var(--primary)' : 'var(--border)',
                  background: tab === t ? 'var(--primary)' : 'var(--bg-card)',
                  color: tab === t ? '#fff' : 'var(--text)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>Loading…</div>
          ) : shown.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
              </svg>
              <h3>No {tab} bookings</h3>
              <p>{tab === 'upcoming' ? "You don't have any upcoming rituals." : "Your completed rituals will appear here."}</p>
              <button className="btn-primary" onClick={() => navigate('/')}>Book a ritual →</button>
            </div>
          ) : (
            shown.map((b, i) => <BookingCard key={b.id || i} booking={b} />)
          )}
        </div>
      </main>
    </div>
  );
}

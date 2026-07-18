import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Logo from '../components/Logo';
import { tokenPayload } from '../lib/auth';

const S = {
  page: {
    '--bg': '#F7F5F1',
    '--card': '#FFFFFF',
    '--ink': '#191919',
    '--ink-2': '#5C574D',
    '--ink-3': '#8A8378',
    '--accent': '#B5654A',
    '--border': '#E4E0D5',
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    lineHeight: 1.5,
    paddingBottom: 40,
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    height: 52,
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px',
    maxWidth: 520, margin: '0 auto',
  },
  wordmark: { fontSize: 15, fontWeight: 600, letterSpacing: '-.01em' },
  backBtn: {
    background: 'none', border: 0, padding: 0,
    fontSize: 13, fontWeight: 600, color: 'var(--ink)',
    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
  },
  wrap: { maxWidth: 520, margin: '0 auto', padding: '0 16px' },
  header: { padding: '20px 0 16px' },
  eyebrow: {
    fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
    textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 4px',
  },
  h1: {
    fontSize: 22, fontWeight: 700, letterSpacing: '-.01em',
    lineHeight: 1.2, margin: '0 0 2px', color: 'var(--ink)',
  },
  subtext: { fontSize: 13, color: 'var(--ink-2)', margin: 0 },
  tabs: { display: 'flex', gap: 6, margin: '16px 0' },
  tab: (active) => ({
    padding: '7px 16px', borderRadius: 100, border: '1px solid',
    borderColor: active ? 'var(--ink)' : 'var(--border)',
    background: active ? 'var(--ink)' : 'var(--card)',
    color: active ? '#fff' : 'var(--ink-2)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', textTransform: 'capitalize',
  }),
  card: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 14, overflow: 'hidden', marginBottom: 10,
  },
  cardHead: {
    padding: '14px 16px 12px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
  },
  ritualLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '.12em',
    textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3,
  },
  momentName: { fontSize: 16, fontWeight: 700, lineHeight: 1.25, color: 'var(--ink)' },
  badge: (status) => ({
    display: 'inline-block', padding: '3px 9px', borderRadius: 100, flexShrink: 0,
    fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
    background: status === 'completed' ? '#EDF4ED' : status === 'cancelled' ? '#FEE' : '#FEF3E2',
    color: status === 'completed' ? '#2A5C2A' : status === 'cancelled' ? '#C0392B' : '#7D4A2F',
  }),
  details: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  detailRow: { display: 'flex', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 11, color: 'var(--ink-3)', minWidth: 84, flexShrink: 0 },
  detailValue: { fontSize: 12, fontWeight: 600, color: 'var(--ink)' },
  certLink: {
    margin: '0 16px 14px',
    padding: '11px 14px',
    borderRadius: 10,
    background: 'linear-gradient(135deg,#FDF8F0,#FEF3DC)',
    border: '1px solid #E8C97A',
    textDecoration: 'none', color: '#7D4A2F',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  certPlaceholder: {
    margin: '0 16px 14px',
    padding: '10px 14px', borderRadius: 10,
    background: 'var(--bg)', border: '1px dashed var(--border)',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  videoWrap: { margin: '0 16px 14px', borderRadius: 10, overflow: 'hidden' },
  videoBox: (clickable) => ({
    background: 'linear-gradient(160deg,#2C1A0E,#1a0f07)',
    aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    textDecoration: 'none', cursor: clickable ? 'pointer' : 'default',
  }),
  empty: {
    textAlign: 'center', padding: '60px 24px',
    color: 'var(--ink-2)',
  },
};

function Icon({ d, size = 14, stroke = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" width={size} height={size}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

function DetailRow({ icon, label, value, mono }) {
  return (
    <div style={S.detailRow}>
      <span style={{ color: 'var(--ink-3)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={S.detailLabel}>{label}</span>
      <span style={{ ...S.detailValue, fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

function BookingCard({ booking }) {
  const date = booking.booking_date
    ? new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const isPast = booking.status === 'completed' || new Date(booking.booking_date) < new Date();
  const price = booking.price_display || (booking.price_paise > 0 ? `₹${Math.round(booking.price_paise / 100)}` : '₹149');

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={S.cardHead}>
        <div>
          <div style={S.ritualLabel}>{booking.ritual_name || 'Ritual'}</div>
          <div style={S.momentName}>{booking.moment || '—'}</div>
        </div>
        <span style={S.badge(booking.status)}>{booking.status || 'confirmed'}</span>
      </div>

      {/* Details */}
      <div style={S.details}>
        <DetailRow
          icon={<Icon d="M3 4h18v2H3zM16 2v4M8 2v4M3 10h18M5 14h.01M9 14h.01M13 14h.01M17 14h.01M5 18h.01M9 18h.01M13 18h.01" />}
          label="Date" value={date}
        />
        <DetailRow
          icon={<Icon d={['M6 3h12', 'M6 8h12', 'M6 13l8 8', 'M6 8a4 4 0 0 0 0 8']} />}
          label="Amount paid" value={price}
        />
        {booking.pandit_name && (
          <DetailRow
            icon={<Icon d={['circle cx=12 cy=8 r=4', 'M4 20c0-4 3.6-7 8-7s8 3 8 7']} />}
            label="Performed by" value={`${booking.pandit_name}${booking.pandit_location ? ` · ${booking.pandit_location}` : ''}`}
          />
        )}
        {booking.booking_ref && (
          <DetailRow
            icon={<Icon d={['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2', 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2']} />}
            label="Ref" value={booking.booking_ref} mono
          />
        )}
      </div>

      {/* Certificate */}
      {booking.certificate_url ? (
        <a href={booking.certificate_url} target="_blank" rel="noopener noreferrer" style={S.certLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C8845A" strokeWidth="1.8" strokeLinecap="round" width="18" height="18" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Ritual Certificate</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>Tap to view & download</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C8845A" strokeWidth="1.8" strokeLinecap="round" width="14" height="14" style={{ marginLeft: 'auto' }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
          </svg>
        </a>
      ) : isPast ? (
        <div style={S.certPlaceholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round" width="16" height="16">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Certificate will be shared here once ready</span>
        </div>
      ) : null}

      {/* Video */}
      <div style={S.videoWrap}>
        {booking.video_url ? (
          <a href={booking.video_url} target="_blank" rel="noopener noreferrer" style={{ ...S.videoBox(true), display: 'flex' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%,rgba(181,101,74,.25) 0%,transparent 70%)' }} />
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 7, position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.9)" width="18" height="18" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, fontWeight: 600, margin: 0, position: 'relative' }}>Watch ritual video</p>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, margin: '3px 0 0', position: 'relative' }}>Tap to open</p>
          </a>
        ) : (
          <div style={{ ...S.videoBox(false), display: 'flex' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%,rgba(181,101,74,.12) 0%,transparent 70%)' }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.3)" width="14" height="14" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z"/></svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, margin: 0, position: 'relative' }}>
              {booking.status === 'completed' ? 'Video will be added soon' : 'Video coming after ritual'}
            </p>
          </div>
        )}
      </div>
    </div>
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
    <div style={S.page}>
      {/* Nav */}
      <div style={S.nav}>
        <button style={S.backBtn} onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Home
        </button>
        <Logo noLink />
        <div style={{ width: 52 }} />
      </div>

      <div style={S.wrap}>
        {/* Header */}
        <div style={S.header}>
          <p style={S.eyebrow}>MY BOOKINGS</p>
          <h1 style={S.h1}>Your rituals</h1>
          {user?.name && <p style={S.subtext}>{user.name}{user.phone ? ` · ${user.phone}` : ''}</p>}
          {!user?.name && user?.phone && <p style={S.subtext}>{user.phone}</p>}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {['upcoming', 'past'].map(t => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
        ) : shown.length === 0 ? (
          <div style={S.empty}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" width="48" height="48" style={{ marginBottom: 14 }}>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
            </svg>
            <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: 'var(--ink)' }}>No {tab} bookings</p>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 20px' }}>
              {tab === 'upcoming' ? "You don't have any upcoming rituals." : 'Your completed rituals will appear here.'}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 8, padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Book a ritual →
            </button>
          </div>
        ) : (
          shown.map((b, i) => <BookingCard key={b.id || i} booking={b} />)
        )}
      </div>
    </div>
  );
}

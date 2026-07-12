import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { RITUALS, getDeliveryDate } from '../data/rituals';
import { useBooking } from '../context/BookingContext';
import StoryAnimation from '../components/StoryAnimation';
import { trackEvent } from '../lib/analytics';

const FAQS = [
  { q: 'So, how does this actually work?', a: 'You choose your moment, we find a verified pandit and schedule the ritual at an auspicious muhurat. You receive a confirmation when the ritual is done.' },
  { q: 'What do I have to do?', a: 'Nothing except place the booking. We handle the pandit, the timing, the ritual, and send you the confirmation. No calls, no coordination needed.' },
  { q: 'When will I receive the ritual video?', a: 'If you book by 2 PM IST, the video is usually shared within 12 hours. Later bookings are usually shared within 24 hours. Inauspicious days may delay the ritual, and we will show the reason clearly.' },
  { q: 'Can I use a number from outside India?', a: 'Yes. We verify via OTP — any mobile number that can receive SMS works. The booking is performed by a pandit in India on your behalf.' },
];

function avatarImage({ bg, skin, hair, shirt, accent = '#BE6A43', bindi = false, beard = false }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="${bg}"/>
      <path d="M25 89c4-20 14-31 23-31s19 11 23 31" fill="${shirt}"/>
      <circle cx="48" cy="42" r="20" fill="${skin}"/>
      <path d="M27 42c1-19 11-29 25-29 12 0 22 9 23 26-10-11-26-14-48 3Z" fill="${hair}"/>
      <path d="M28 46c-4-13 2-28 18-33 9-3 22 1 28 14-13-5-32-2-46 19Z" fill="${hair}" opacity=".92"/>
      <circle cx="40" cy="43" r="2.2" fill="#2C2620"/>
      <circle cx="56" cy="43" r="2.2" fill="#2C2620"/>
      <path d="M40 56c5 4 11 4 16 0" fill="none" stroke="#7A3A2A" stroke-width="2.2" stroke-linecap="round"/>
      ${bindi ? `<circle cx="48" cy="35" r="2" fill="${accent}"/>` : ''}
      ${beard ? `<path d="M34 53c5 12 23 12 28 0 0 17-28 17-28 0Z" fill="${hair}" opacity=".85"/>` : ''}
      <path d="M29 69c11 10 27 10 38 0" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FEED_ITEMS = [
  { av: 'R', color: '#FAD7C0', photo: avatarImage({ bg: '#FAD7C0', skin: '#B8754E', hair: '#241511', shirt: '#F4A261', bindi: true }), name: 'Riya', ritual: 'Nazar Badha', loc: 'Haldwani', meta: 'Video delivered' },
  { av: 'V', color: '#F5D9CC', photo: avatarImage({ bg: '#F5D9CC', skin: '#A9653E', hair: '#17100D', shirt: '#5A6C8A', beard: true }), name: 'Vikram', ritual: 'Raksha Kavach', loc: 'Jaipur', meta: 'Video proof ready' },
  { av: 'S', color: '#FADDC0', photo: avatarImage({ bg: '#FADDC0', skin: '#C98255', hair: '#21120E', shirt: '#A65F46', bindi: true }), name: 'Sneha', ritual: 'Dhan Aagman', loc: 'Pune', meta: 'Ritual completed' },
  { av: 'A', color: '#F5E5D0', photo: avatarImage({ bg: '#F5E5D0', skin: '#B66F45', hair: '#1B120F', shirt: '#2F6F62', beard: true }), name: 'Aman', ritual: 'Prem Setu', loc: 'Lucknow', meta: 'Video delivered' },
  { av: 'P', color: '#F0D5CC', photo: avatarImage({ bg: '#F0D5CC', skin: '#A85F3D', hair: '#160D0B', shirt: '#C06C84', bindi: true }), name: 'Priya', ritual: 'Raksha Kavach', loc: 'Mumbai', meta: 'Video proof ready' },
  { av: 'K', color: '#FADCC0', photo: avatarImage({ bg: '#FADCC0', skin: '#BC7448', hair: '#1A100D', shirt: '#355C7D', beard: true }), name: 'Karan', ritual: 'Nazar Badha', loc: 'Delhi', meta: 'Ritual completed' },
];

const TRUST_POINTS = [
  '✅ Verified pandits',
  '🎥 Video proof',
  '🔒 Secure payment',
  '📍 Live status tracking',
];

const REELS = [
  { bg: 'linear-gradient(180deg,#D4A882 0%,#6e3c20 100%)', name: 'Meera, 34', after: 'after Nazar Badha', dur: '0:30' },
  { bg: 'linear-gradient(180deg,#C4B890 0%,#6a5a30 100%)', name: 'Rohan, 29', after: 'after Dhan Aagman', dur: '0:28' },
  { bg: 'linear-gradient(180deg,#C8A09A 0%,#6a3030 100%)', name: 'Priya, 26', after: 'after Prem Setu', dur: '0:31' },
];

const SCENE_SVGS = {
  rk: (
    <svg viewBox="0 0 360 100" width="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="100" fill="#F5EDE0"/>
      <line x1="40" y1="86" x2="320" y2="86" stroke="#d4c4b0" strokeWidth="1.2"/>
      <circle cx="268" cy="38" r="15" fill="#F5EDE0" stroke="#BE6A43" strokeWidth="1.6"/>
      <path d="M268 38 V28 M268 38 H260" stroke="#BE6A43" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M150 84 L150 62 Q170 56 188 62 L188 84 Z" fill="#F3EADD"/>
      <path d="M188 84 L188 62 Q206 56 224 62 L224 84 Z" fill="#EDE3D4"/>
      <g stroke="#C9B79C" strokeWidth="1" opacity=".9"><line x1="158" y1="68" x2="180" y2="66"/><line x1="158" y1="74" x2="180" y2="72"/><line x1="196" y1="66" x2="218" y2="68"/><line x1="196" y1="72" x2="218" y2="74"/></g>
      <g transform="rotate(34 118 66)"><rect x="97" y="62" width="30" height="5" rx="2" fill="#BE6A43"/><path d="M127 62 l7 2.5 -7 2.5Z" fill="#F3EADD"/></g>
      <path d="M122 86 A66 52 0 0 1 246 86" fill="none" stroke="#BE6A43" strokeWidth="1.2" strokeDasharray="2 5" opacity=".5"/>
    </svg>
  ),
  da: (
    <svg viewBox="0 0 360 100" width="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="100" fill="#F5EDE0"/>
      <rect x="132" y="28" width="96" height="50" rx="4" fill="#2C2620" opacity=".85"/>
      <path d="M122 88 h116 l-8 -6 H130 Z" fill="#BE6A43" opacity=".7"/>
      <rect x="148" y="62" width="10" height="14" fill="#DCC290"/><rect x="166" y="54" width="10" height="22" fill="#DCC290"/><rect x="184" y="44" width="10" height="32" fill="#F0D87A"/>
      <path d="M152 64 L170 50 L188 40" fill="none" stroke="#F5EDE0" strokeWidth="1.8"/>
      <g fill="#DCC290" stroke="#A8824E" strokeWidth=".5"><ellipse cx="272" cy="78" rx="12" ry="4.5"/><ellipse cx="272" cy="72" rx="12" ry="4.5"/><ellipse cx="272" cy="66" rx="12" ry="4.5"/></g>
    </svg>
  ),
  ps: (
    <svg viewBox="0 0 360 100" width="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="100" fill="#F5EDE0"/>
      <path d="M88 30 h76 a9 9 0 0 1 9 9 v18 a9 9 0 0 1 -9 9 h-56 l-12 10 v-10 a9 9 0 0 1 -8 -9 v-18 a9 9 0 0 1 8 -18Z" fill="#EDE3D4" stroke="#BE6A43" strokeWidth="1.2"/>
      <g fill="#BE6A43" opacity=".6"><circle cx="112" cy="49" r="2.8"/><circle cx="124" cy="49" r="2.8"/><circle cx="136" cy="49" r="2.8"/></g>
      <path d="M192 44 h68 a9 9 0 0 1 9 9 v16 a9 9 0 0 1 -9 9 h-44 l-12 10 v-10 a9 9 0 0 1 -9 -9 v-16 a9 9 0 0 1 9 -9Z" fill="#F0E8E0" stroke="#BE6A43" strokeWidth="1.2"/>
      <path d="M232 72c-5-4-9-8-9-12a4.5 4.5 0 0 1 9-2.4A4.5 4.5 0 0 1 241 60c0 4-4 8-9 12Z" fill="#D87B5E"/>
    </svg>
  ),
  nb: (
    <svg viewBox="0 0 360 100" width="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="100" fill="#F5EDE0"/>
      <line x1="40" y1="90" x2="320" y2="90" stroke="#d4c4b0" strokeWidth="1"/>
      <polyline points="50,82 90,68 130,54 168,36 198,26" fill="none" stroke="#DCC290" strokeWidth="2.2"/>
      <polyline points="198,26 222,50 248,78 282,86" fill="none" stroke="#BE6A43" strokeWidth="2.2"/>
      <path d="M198 26 l3 5 5 .5 -4 3.5 1.2 5.5 -5.2-2.8 -5.2 2.8 1.2-5.5 -4-3.5 5-.5Z" fill="#F0D87A"/>
      <ellipse cx="282" cy="74" rx="13" ry="8.5" fill="none" stroke="#9a8FB0" strokeWidth="1.4" opacity=".7"/>
      <circle cx="282" cy="74" r="4.5" fill="#2C2620" opacity=".7" stroke="#BE6A43" strokeWidth="1.2"/>
    </svg>
  ),
};

function BookingFeed() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % FEED_ITEMS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const item = FEED_ITEMS[idx];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 100, padding: '8px 14px 8px 8px', width: '100%' }}>
      <AvatarCircle item={item} size={32} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name} booked {item.ritual}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1, fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ color: '#5C8A57', fontWeight: 700 }}>{item.meta}</span>
          <span>•</span>
          <span>{item.loc}</span>
        </div>
      </div>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5C8A57', boxShadow: '0 0 0 3px rgba(92,138,87,.12)', flexShrink: 0 }} />
    </div>
  );
}

function AvatarCircle({ item, size = 30 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: Math.max(10, size * 0.34), color: '#5C3A1E', flexShrink: 0, border: '2px solid #fff', overflow: 'hidden', boxShadow: '0 4px 10px rgba(92,58,30,.08)' }}>
      <span>{item.av}</span>
      <img
        src={item.photo}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(event) => { event.currentTarget.style.display = 'none'; }}
        style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    </div>
  );
}

function RitualBannerCard({ ritual, onClick }) {
  return (
    <div className="ritual-feature-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
        {SCENE_SVGS[ritual.id]}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span className="badge">{ritual.tag}</span>
        </div>
      </div>
      <div className="ritual-feature-card-body">
        <h3>{ritual.tagline}</h3>
        <p style={{ marginBottom: 10 }}>{ritual.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: '#BE6A43', fontWeight: 700 }}>★ {ritual.rating}</span>
          <span style={{ color: 'var(--text-3)' }}>·</span>
          <span style={{ color: 'var(--text-3)' }}>{ritual.count} booked</span>
          <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>Starting at ₹{ritual.from}/-</span>
        </div>
      </div>
    </div>
  );
}

const MOMENT_ICONS = {
  shield:    <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z"/>,
  coin:      <><circle cx="12" cy="12" r="8"/><path d="M12 9v6M10 12h4"/></>,
  heart:     <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>,
  eye:       <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.3"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  door:      <><path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="11" cy="12" r=".5" fill="currentColor"/></>,
  meeting:   <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></>,
  chat:      <><path d="M4 5h16v11H8l-4 4Z"/><path d="M9 10h6"/></>,
  pencil:    <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/>,
  trophy:    <><path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M12 12v4M9 20h6"/></>,
  plane:     <path d="M22 16.2l-3.5 3.6-8.5-3.8L6 21l-2-2 4.3-4.1L5 6 7 4l5.2 4.2 4.1-4.3 3.5 1.7"/>,
  health:    <><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z"/><path d="M9 11h2v-2h2v2h2"/></>,
  home:      <path d="M3 11l9-7 9 7M5 10v10h14V10"/>,
  rocket:    <path d="M12 3c3 1 5 4 5 8l-3 3H10l-3-3c0-4 2-7 5-8Z"/>,
  building:  <><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h.01M15 7h.01"/></>,
  car:       <><path d="M5 16l1.5-5h11L19 16M3 16h18v3h-2v-2H5v2H3Z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></>,
  cash:      <><rect x="2" y="7" width="20" height="12" rx="2"/><path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 13h.01M18 13h.01"/></>,
  shop:      <><path d="M4 9h16l-1 11H5Z"/><path d="M4 9l1.5-4h13L20 9"/></>,
  tag:       <><path d="M3 12V4h8l9 9-8 8-9-9Z"/><circle cx="7.5" cy="7.5" r="1.5"/></>,
  diamond:   <path d="M6 3h12l4 6-10 12L2 9Z"/>,
  star:      <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.5-.5Z"/>,
  ring:      <><circle cx="12" cy="14" r="5"/><path d="M9 9l1.5-4h3L15 9"/></>,
  bandage:   <path d="M14 5l5 5-9 9-5-5Z"/>,
  users:     <path d="M16 11c1.7 0 3 1.3 3 3v1h-4M8 11c-1.7 0-3 1.3-3 3v1h4M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>,
  eyeoff:    <><path d="M9.9 4.2A9 9 0 0 1 12 4c5 0 8 5 8 5a15 15 0 0 1-1.7 2.3M6.5 6.5C4.9 7.9 4 10 4 10s3 5 8 5c1.5 0 2.9-.4 4.1-1.1M3 3l18 18"/></>,
  mood:      <><circle cx="12" cy="12" r="9"/><path d="M8 15s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01"/></>,
  baby:      <><circle cx="12" cy="8" r="3"/><path d="M6 21c0-4 3-7 6-7s6 3 6 7"/></>,
  invest:    <><path d="M4 16l5-5 3 3 7-7"/><path d="M16 7h4v4"/></>,
  homeheart: <><path d="M3 11l9-7 9 7M5 10v10h14V10"/><path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></>,
  trenddown: <><path d="M4 4l6 6 4-4 6 6"/><path d="M14 16h6v-6"/></>,
};

function MomentRow({ moment, ritualId, onSelect }) {
  const iconContent = MOMENT_ICONS[moment.ic] || <path d="M5 12h14M13 6l6 6-6 6"/>;
  return (
    <div className="moment-row" onClick={() => onSelect(ritualId, moment)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onSelect(ritualId, moment)}>
      <div className="moment-icon" style={{ background: '#F5EDE0' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          {iconContent}
        </svg>
      </div>
      <div className="moment-info">
        <div className="moment-name">{moment.name} {moment.pop && <span className="badge-popular" style={{ display:'inline-block', background:'#E8F0E8', color:'#2D6B2D', fontSize:10, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', padding:'2px 8px', borderRadius:100, marginLeft:6 }}>Popular</span>}</div>
        <div className="moment-why">{moment.why}</div>
      </div>
      <div className="moment-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </div>
    </div>
  );
}

function BrowseByMoment({ onSelect }) {
  const [activeTab, setActiveTab] = useState(0);
  const ritual = RITUALS[activeTab];

  return (
    <div>
      {/* Ritual tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 20 }}>
        {RITUALS.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setActiveTab(i)}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 100,
              border: '1.5px solid',
              borderColor: activeTab === i ? 'var(--primary)' : 'var(--border)',
              background: activeTab === i ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === i ? '#fff' : 'var(--text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
            }}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Moments for active ritual */}
      {ritual.groups.map((g, gi) => {
        const sorted = [...g.moments].sort((a, b) => (b.pop ? 1 : 0) - (a.pop ? 1 : 0));
        return (
          <div key={gi} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>{g.name}</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {sorted.map(m => (
                <MomentRow key={m.id} moment={m} ritualId={ritual.id} onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Nodes are equally spaced (72° apart) so the 10s animateMotion orbit
// stays in sync with the 2s React step interval (5 × 2s = 10s).
const HIW_NODES = [
  { cx: 190, cy:  47, label: 'Pick',   sub: 'your moment', desc: 'Choose the ritual and the moment that matters — exam, interview, wedding, travel or anything else.' },
  { cx: 290, cy: 120, label: 'Time',   sub: 'choose date',  desc: 'Pick your date. The pandit selects the most auspicious muhurat within that day to perform the ritual.' },
  { cx: 252, cy: 237, label: 'Pandit', sub: 'assigned',     desc: 'A verified, experienced pandit is assigned to your booking and confirms the sankalp details.' },
  { cx: 128, cy: 237, label: 'Ritual', sub: 'performed',    desc: 'The pandit performs the ritual in your name and gotra at the chosen muhurat — you don\'t need to do anything.' },
  { cx:  90, cy: 120, label: 'Video',  sub: 'to you',       desc: 'A recording of the ritual is sent to you on the app and WhatsApp so you can watch it any time.' },
];

function HowItWorks() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 5), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 16px 20px', maxWidth: 480, margin: '0 auto' }}>
      <svg viewBox="0 0 380 300" width="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="hiwGrad" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#DCC290"/>
            <stop offset="55%" stopColor="#BE6A43"/>
            <stop offset="100%" stopColor="#7a4026"/>
          </radialGradient>
          <filter id="hiwGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Clockwise orbit path starting from Node 1 (top) */}
          <path id="hiwOrbit" d="M 190 47 A 105 105 0 1 1 189.99 47"/>
        </defs>

        {/* Slowly rotating dashed orbit ring */}
        <circle cx="190" cy="152" r="105" fill="none" stroke="#BE6A43" strokeWidth="1" strokeDasharray="3 8" strokeLinecap="round" opacity=".3">
          <animateTransform attributeName="transform" type="rotate" from="0 190 152" to="360 190 152" dur="40s" repeatCount="indefinite"/>
        </circle>

        {/* Glow halo behind traveling dot */}
        <circle r="18" fill="#F2B79A" opacity="0.18" filter="url(#hiwGlow)">
          <animateMotion dur="10s" repeatCount="indefinite">
            <mpath href="#hiwOrbit"/>
          </animateMotion>
        </circle>

        {/* Traveling dot */}
        <circle r="7" fill="#BE6A43" opacity="0.95" filter="url(#hiwGlow)">
          <animateMotion dur="10s" repeatCount="indefinite">
            <mpath href="#hiwOrbit"/>
          </animateMotion>
          <animate attributeName="r" values="7;8.5;7" dur="0.6s" repeatCount="indefinite"/>
        </circle>

        {/* Center — gently breathing */}
        <circle cx="190" cy="152" r="42" fill="url(#hiwGrad)">
          <animate attributeName="r" values="42;45;42" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <path d="M190 135c1 3-2 4-2 7a2 2 0 0 0 4 0c2 2 3 3.5 3 6a5 5 0 0 1-10 0c0-3 2-4 2-7 0-2 2-3 3-6Z" fill="#fff" opacity=".95"/>
        <text x="190" y="190" textAnchor="middle" style={{fontFamily:'system-ui',fontSize:11,fontWeight:700,fill:'#7C7468'}}>~30 min</text>

        {/* Nodes */}
        {HIW_NODES.map((n, i) => {
          const active = step === i;
          return (
            <g key={i}>
              {active && (
                <circle cx={n.cx} cy={n.cy} r="36" fill="none" stroke="#BE6A43" strokeWidth="1.5">
                  <animate attributeName="r" values="34;42;34" dur="1s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle cx={n.cx} cy={n.cy} r="28"
                fill={active ? '#FDF0E8' : '#FAF6EF'}
                stroke={active ? '#BE6A43' : '#E7E1D5'}
                strokeWidth={active ? 2 : 1}
              />
              <text x={n.cx} y={n.cy - 4} textAnchor="middle" style={{fontFamily:'system-ui',fontSize:13,fontWeight:600,fill: active ? '#7a3020' : '#2C2620'}}>{n.label}</text>
              <text x={n.cx} y={n.cy + 10} textAnchor="middle" style={{fontFamily:'system-ui',fontSize:9.5,fill:'#7C7468'}}>{n.sub}</text>
              <circle cx={n.cx - 16} cy={n.cy - 16} r="9" fill={active ? '#7a3020' : '#BE6A43'}/>
              <text x={n.cx - 16} y={n.cy - 12} textAnchor="middle" style={{fontFamily:'system-ui',fontSize:9,fontWeight:700,fill:'#fff'}}>{i + 1}</text>
            </g>
          );
        })}
      </svg>

      {/* Step description */}
      <div style={{ minHeight: 52, textAlign: 'center', padding: '0 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
          {HIW_NODES.map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? '#BE6A43' : '#E7E1D5', transition: 'all 0.3s ease' }}/>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-2)' }}>Step {step + 1} · {HIW_NODES[step].label}. </strong>
          {HIW_NODES[step].desc}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { update } = useBooking();
  const [openFaq, setOpenFaq] = useState(null);

  function handleMomentSelect(ritualId, moment) {
    const ritual = RITUALS.find(r => r.id === ritualId);
    trackEvent('moment_selected', {
      source: 'home_browse_by_moment',
      ritual_id: ritualId,
      ritual_name: ritual?.name,
      moment_id: moment.id,
      moment_name: moment.name,
      value: moment.price,
      currency: 'INR',
    });
    update({
      ritualId,
      ritualName: ritual?.name || '',
      momentId: moment.id,
      momentName: moment.name,
      price: moment.price,
      deliveryDate: getDeliveryDate(),
    });
    navigate(`/ritual/${ritualId}/${moment.id}`);
  }

  return (
    <div className="page-wrap">
      <Navbar />

      <main style={{ flex: 1 }}>

        {/* Hero */}
        <div className="container">
          <div className="hero">
            <h1 className="hero-title">Because some moments deserve more than luck.</h1>
            <p className="hero-sub">Trusted rituals performed in your name by verified pandits. Video confirmation included.</p>
            <div className="hero-cta-row">
              <a href="#browse" className="btn-primary" onClick={() => trackEvent('hero_cta_clicked', { destination: 'browse' })}>Find the right ritual for your situation</a>
            </div>
          </div>
        </div>

        {/* Featured ritual cards */}
        <div className="container" id="browse">
          <div className="section">
            <p className="section-label">Featured Services</p>
            <h2 className="section-title">Rituals for moments that matter</h2>
            <div className="ritual-grid">
              {RITUALS.map(r => (
                <RitualBannerCard
                  key={r.id}
                  ritual={r}
                  onClick={() => {
                    trackEvent('ritual_card_clicked', {
                      source: 'featured_services',
                      ritual_id: r.id,
                      ritual_name: r.name,
                      from_price: r.from,
                      currency: 'INR',
                    });
                    navigate(`/ritual/${r.id}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* People like you — social proof */}
        <div className="container">
          <div className="section">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>14,000+ rituals booked</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>Every booking is verified, securely processed, and tracked until the ritual is complete.</p>
                </div>
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {FEED_ITEMS.slice(0, 4).map((item, index) => (
                    <div key={item.name} style={{ marginLeft: index === 0 ? 0 : -10 }}>
                      <AvatarCircle item={item} size={34} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {TRUST_POINTS.map((point) => (
                  <span key={point} style={{ fontSize: 11, fontWeight: 800, color: '#5C8A57', background: '#EEF6EA', border: '1px solid #D9EAD3', borderRadius: 100, padding: '4px 8px' }}>
                    {point}
                  </span>
                ))}
              </div>
              <BookingFeed />
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="container">
          <div className="section">
            <p className="section-label">How it works</p>
            <h2 className="section-title">How Sankalp works in 5 steps</h2>
            <StoryAnimation />
          </div>
        </div>

        {/* Video testimonials — Real ones, real changes */}
        <div className="container">
          <div className="section">
            <p className="section-label">Testimonials</p>
            <h2 className="section-title">Real ones, real changes</h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {REELS.map((r, i) => (
                <div key={i} style={{ flexShrink: 0, width: 140, height: 220, borderRadius: 16, background: r.bg, position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', width: 44, height: 44, background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 12px 14px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{r.dur}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{r.after}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Browse by moment */}
        <div className="container">
          <div className="section">
            <p className="section-label">Browse by moment</p>
            <h2 className="section-title">What moment are you preparing for?</h2>
            <BrowseByMoment onSelect={handleMomentSelect} />
          </div>
        </div>

        {/* FAQ */}
        <div className="container">
          <div className="section">
            <p className="section-label">The basics</p>
            <h2 className="section-title">Before you book</h2>
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-question">
                  {f.q}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                {openFaq === i && <div className="faq-answer">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="container">
          <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '36px 24px', marginBottom: 40 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Ready to book your Sankalp?</p>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Starts at ₹149 · OTP verified booking</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Sankalp by Tathastu — rituals, sorted</p>
      </footer>
    </div>
  );
}

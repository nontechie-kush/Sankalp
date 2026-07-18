import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { RITUALS, getDeliveryDate } from '../data/rituals';
import { useBooking } from '../context/BookingContext';
import { trackEvent } from '../lib/analytics';
import { applyBackendPrices, loadBackendPriceMap } from '../lib/catalogPrices';
import { tokenPayload, clearToken } from '../lib/auth';

const FAQS = [
  { q: 'So, how does this actually work?', a: 'You choose your moment, we find a verified pandit and schedule the ritual at an auspicious muhurat. You receive a confirmation when the ritual is done.' },
  { q: 'What do I have to do?', a: 'Nothing except place the booking. We handle the pandit, the timing, the ritual, and send you the confirmation. No calls, no coordination needed.' },
  { q: 'When will I receive the ritual video?', a: 'If you book by 2 PM IST, the video is usually shared within 12 hours. Later bookings are usually shared within 24 hours. Inauspicious days may delay the ritual, and we will show the reason clearly.' },
  { q: 'Can I use a number from outside India?', a: 'Yes. We verify via OTP — any mobile number that can receive SMS works. The booking is performed by a pandit in India on your behalf.' },
];

const RITUAL_META = {
  nb: {
    num: '01',
    enName: 'Evil Eye Removal',
    image: '/illustrations/nazar-badha.png',
    tagline: 'Good run suddenly going off?',
  },
  rk: {
    num: '02',
    enName: 'Protection Shield',
    image: '/illustrations/raksha-kavach.png',
    tagline: 'Big exam or interview coming up?',
  },
  ps: {
    num: '03',
    enName: 'Love & Harmony',
    image: '/illustrations/prem-setu.png',
    tagline: 'Something you have been meaning to say?',
  },
  da: {
    num: '04',
    enName: 'Prosperity Blessing',
    image: '/illustrations/dhan-aagman.png',
    tagline: 'New home, shop, or vehicle?',
  },
};

const RITUAL_ORDER = ['nb', 'rk', 'ps', 'da'];

const HOW_IT_WORKS_STEPS = [
  {
    label: 'Pick Moment',
    start: 0,
    desc: 'Choose the ritual, the moment that matters, and who the sankalp is for — yourself or someone you care about.',
  },
  {
    label: 'Book & Pay',
    start: 4,
    desc: 'Complete your booking and payment — the pandit may ask for your name, gotra, birth place to perform the ritual.',
  },
  {
    label: 'Pandit performs ritual',
    start: 8,
    desc: 'A verified pandit performs the ritual in your name at the chosen muhurat, usually within 4–12 hours of booking.',
  },
  {
    label: 'Receive ritual video',
    start: 11,
    desc: 'A recording of the ritual is sent to you on WhatsApp so you can watch it any time.',
  },
  {
    label: 'Doorstep prasad',
    start: 14,
    desc: 'Prasadam and kaala dhaaga are delivered to your doorstep — these are optional, not mandatory.',
  },
];

const RECENT_BOOKINGS = [
  'Riya booked Nazar Badha in Haldwani · 2 min ago',
  'Vikram booked Raksha Kavach in Jaipur · 5 min ago',
  'Sneha booked Dhan Aagman in Pune · 8 min ago',
  'Aman booked Prem Setu in Lucknow · 11 min ago',
];

const TRUST_BADGES = ['Verified pandits', 'Video proof', 'Secure payment', 'Live status tracking'];

const TESTIMONIALS = [
  {
    type: 'video',
    src: '/testimonials/testimonial_sukh.mp4',
    poster: '/testimonials/testimonial_sukh_poster.png',
    bg: 'linear-gradient(180deg,#D4A882 0%,#6e3c20 100%)',
    name: 'Sukhmani Kaur',
    after: 'Raksha Kavach · Gurgaon',
    cardLabel: 'Raksha Kavach',
    quote: 'Booked before sharing her dream job offer letter.',
    dur: '0:33',
  },
  { bg: 'linear-gradient(180deg,#C4B890 0%,#6a5a30 100%)', name: 'Rohan, 29', after: 'after Dhan Aagman', cardLabel: 'Dhan Aagman', dur: '0:28' },
  { bg: 'linear-gradient(180deg,#C8A09A 0%,#6a3030 100%)', name: 'Priya, 26', after: 'after Prem Setu', cardLabel: 'Prem Setu', dur: '0:31' },
];

const SANKALP_CONTEXT_POINTS = [
  {
    title: 'Mandir visits stay sacred',
    copy: 'Go in person whenever you can. That experience has its own place.',
  },
  {
    title: 'Use Sankkalp when life gets in the way',
    copy: 'Time, travel, health, work, or distance should not leave the moment unsupported.',
  },
  {
    title: 'A proper sankalp, not just touchwood',
    copy: 'A pandit takes your name, intention, and prayer into the ritual.',
  },
];

const FILTERS = ['All', 'Career', 'Exams', 'Travel', 'Money', 'Love', 'Protection'];

function getHowItWorksStep(currentTime) {
  let activeStep = 0;
  for (let index = HOW_IT_WORKS_STEPS.length - 1; index >= 0; index -= 1) {
    if (currentTime >= HOW_IT_WORKS_STEPS[index].start) {
      activeStep = index;
      break;
    }
  }
  return activeStep;
}

function categoryForMoment(ritual, groupName, momentName) {
  const text = `${ritual.name} ${groupName} ${momentName}`.toLowerCase();
  if (ritual.id === 'ps' || text.includes('love') || text.includes('marriage') || text.includes('family')) return 'Love';
  if (ritual.id === 'nb' || ritual.id === 'rk' || text.includes('protection') || text.includes('nazar') || text.includes('health')) return 'Protection';
  if (text.includes('exam') || text.includes('study') || text.includes('result')) return 'Exams';
  if (text.includes('travel') || text.includes('flight')) return 'Travel';
  if (ritual.id === 'da' || text.includes('money') || text.includes('deal') || text.includes('salary') || text.includes('business') || text.includes('investment')) return 'Money';
  return 'Career';
}

function SectionHeading({ eyebrow, title }) {
  return (
    <>
      <p style={styles.eyebrow}>{eyebrow}</p>
      <h2 style={styles.h2}>{title}</h2>
    </>
  );
}

function CheckIcon({ size = 11, color = '#2D6B2D' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="16" height="16" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="16" height="16" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="19" height="19" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HomeNav({ user, onSignIn, onBookings, onSignOut }) {
  const navigate = useNavigate();
  const initial = user?.name?.[0]?.toUpperCase() || (user ? 'U' : null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <nav style={styles.nav}>
      <Logo />
      {!user ? (
        <button type="button" style={styles.signInButton} onClick={onSignIn}>Sign in</button>
      ) : (
        <div style={styles.navUserActions}>
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button
              type="button"
              style={styles.navAvatar}
              onClick={() => setOpen((o) => !o)}
              aria-label="Account menu"
            >
              {initial}
            </button>
            {open && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                minWidth: 180, zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  {user?.name && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>{user.name}</div>}
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{user?.phone}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate('/profile'); }}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 14px', fontSize: 13, color: 'var(--ink)', borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: '1px solid var(--border)', background: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onBookings(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 14px', fontSize: 13, color: 'var(--ink)', borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: '1px solid var(--border)', background: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  My bookings
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onSignOut(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 14px', fontSize: 13, color: '#C0392B', background: 'none', border: 0, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero({ onBookNow }) {
  return (
    <section style={styles.hero}>
      <p style={styles.eyebrow}>SANKKALP BY TATHASTU</p>
      <h1 style={styles.h1}>Because some moments deserve more than luck.</h1>
      <p style={styles.heroCopy}>Verified pandits perform ritual on your behalf. Get ritual video delivered online with prasad delivered on doorstep.</p>
      <div style={styles.heroSupportRow}>
        <span style={styles.heroSupportIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
          </svg>
        </span>
        <span>Book for yourself, parents, partner, child, or friend.</span>
      </div>
      <button type="button" style={styles.heroCta} onClick={onBookNow}>Book Now →</button>
    </section>
  );
}

function RitualGrid({ rituals, onRitualClick }) {
  const orderedRituals = RITUAL_ORDER.map((id) => rituals.find((ritual) => ritual.id === id)).filter(Boolean);
  return (
    <section id="browse" style={styles.section}>
      <SectionHeading eyebrow="CHOOSE A RITUAL CATEGORY" title="Four rituals, one purpose" />
      <div style={styles.ritualGrid}>
        {orderedRituals.map((ritual) => {
          const meta = RITUAL_META[ritual.id] || {};
          return (
            <button key={ritual.id} type="button" style={styles.ritualCard} onClick={() => onRitualClick(ritual)}>
              <img src={meta.image} alt={ritual.name} loading="lazy" style={styles.ritualImage} />
              <span style={styles.ritualBody}>
                <span style={styles.ritualNum}>{meta.num}</span>
                <span style={styles.ritualName}>{ritual.name}</span>
                <span style={styles.ritualGloss}>{meta.enName}</span>
                <span style={styles.ritualTagline}>{meta.tagline || ritual.tagline}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const [hiwStep, setHiwStep] = useState(0);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const target = videoWrapRef.current;
    if (!target) return undefined;

    let loadTimer;
    const scheduleLoad = () => {
      loadTimer = window.setTimeout(() => setShouldLoadVideo(true), 1400);
    };

    if (!('IntersectionObserver' in window)) {
      scheduleLoad();
      return () => window.clearTimeout(loadTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scheduleLoad();
          observer.disconnect();
        }
      },
      { rootMargin: '120px 0px' }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
      window.clearTimeout(loadTimer);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const handleTimeUpdate = () => {
      const nextStep = getHowItWorksStep(video.currentTime);
      setHiwStep(Number.isFinite(nextStep) ? nextStep : 0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [shouldLoadVideo]);

  const current = HOW_IT_WORKS_STEPS[hiwStep] || HOW_IT_WORKS_STEPS[0];

  return (
    <section style={styles.section}>
      <SectionHeading eyebrow="How it works" title="Simple steps to get real blessings" />
      <div ref={videoWrapRef} style={styles.hiwVideoWrap}>
        <video
          ref={videoRef}
          src={shouldLoadVideo ? '/how-it-works.mp4' : undefined}
          poster="/how-it-works-poster.png"
          muted
          loop
          autoPlay
          playsInline
          preload="none"
          style={styles.hiwVideo}
        />
      </div>
      <div style={styles.hiwTracker} aria-label={`Step ${hiwStep + 1}: ${current.label}`}>
        {HOW_IT_WORKS_STEPS.map((step, index) => {
          const active = index === hiwStep;
          return (
            <button
              key={step.label}
              type="button"
              style={{ ...styles.hiwNode, background: active ? 'var(--accent)' : 'var(--border)', color: active ? '#fff' : 'var(--ink-3)' }}
              aria-label={`Show step ${index + 1}: ${step.label}`}
              aria-pressed={active}
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = step.start;
                  videoRef.current.play().catch(() => {});
                }
                setHiwStep(index);
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div style={styles.hiwStepCard}>
        <h3 style={styles.hiwStepTitle}>{current.label}</h3>
        <p style={styles.hiwStepDesc}>{current.desc}</p>
      </div>
    </section>
  );
}

function SocialProof() {
  const [recentIdx, setRecentIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setRecentIdx((idx) => (idx + 1) % RECENT_BOOKINGS.length), 3200);
    return () => clearInterval(interval);
  }, []);

  const avatars = [
    { initial: 'R', color: '#FAD7C0' },
    { initial: 'V', color: '#F5D9CC' },
    { initial: 'S', color: '#FADDC0' },
    { initial: 'A', color: '#F5E5D0' },
  ];

  return (
    <section style={styles.section}>
      <div style={styles.socialCard}>
        <div style={styles.socialTop}>
          <div style={styles.socialTitleRow}>
            <span style={styles.shieldTile}><ShieldCheckIcon /></span>
            <span>
              <span style={styles.socialTitle}>100+ rituals booked</span>
              <span style={styles.socialSubtitle}>Verified, secure, tracked to completion</span>
            </span>
          </div>
          <div style={styles.avatarStack} aria-hidden="true">
            {avatars.map((avatar, index) => (
              <span key={avatar.initial} style={{ ...styles.avatar, background: avatar.color, marginLeft: index === 0 ? 0 : -8 }}>{avatar.initial}</span>
            ))}
          </div>
        </div>
        <div style={styles.recentPill}>
          <span style={styles.greenDot} />
          <span style={styles.recentText}>{RECENT_BOOKINGS[recentIdx]}</span>
        </div>
        <div style={styles.badgeRow}>
          {TRUST_BADGES.map((badge) => (
            <span key={badge} style={styles.trustBadge}>
              <CheckIcon />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function LovedOnesSection({ onBookNow }) {
  const people = ['Parents', 'Partner', 'Child', 'Friend'];

  return (
    <section style={styles.lovedOnesBand}>
      <div style={styles.lovedOnesIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M20 12v8H4v-8" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7H8.5A2.5 2.5 0 1 1 12 3.5V7Z" />
          <path d="M12 7h3.5A2.5 2.5 0 1 0 12 3.5V7Z" />
        </svg>
      </div>
      <div style={styles.lovedOnesBody}>
        <p style={styles.eyebrow}>Book for someone else</p>
        <h2 style={styles.lovedOnesTitle}>Send a sankalp into their important moment.</h2>
        <p style={styles.lovedOnesCopy}>
          Enter their name, add gotra or city if you know it, and receive every update on your phone.
        </p>
        <div style={styles.lovedOnesChips}>
          {people.map((person) => <span key={person} style={styles.lovedOnesChip}>{person}</span>)}
        </div>
        <button type="button" style={styles.lovedOnesButton} onClick={onBookNow}>Choose a moment</button>
      </div>
    </section>
  );
}

function Testimonials() {
  const [modalItem, setModalItem] = useState(null);

  useEffect(() => {
    if (!modalItem) return;
    function onKey(e) { if (e.key === 'Escape') setModalItem(null); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalItem]);

  return (
    <section style={styles.section}>
      <SectionHeading eyebrow="Testimonials" title="Real ones, real changes" />
      <div style={styles.testimonialScroller}>
        {TESTIMONIALS.map((item) => (
          <div
            key={item.name}
            role={item.type === 'video' ? 'button' : 'img'}
            tabIndex={item.type === 'video' ? 0 : undefined}
            style={{ ...styles.testimonialCard, background: item.bg }}
            onClick={() => item.type === 'video' && setModalItem(item)}
            onKeyDown={(event) => {
              if (item.type === 'video' && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                setModalItem(item);
              }
            }}
            aria-label={item.type === 'video' ? `Play testimonial from ${item.name}` : `${item.name} testimonial`}
          >
            {item.poster ? (
              <img src={item.poster} alt="" style={styles.testimonialPoster} loading="lazy" />
            ) : null}
            <span style={styles.playButton}>
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span style={styles.testimonialOverlay}>
              <span style={styles.testimonialName}>{item.name}</span>
              <span style={styles.testimonialAfter}>{item.cardLabel || item.after}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Floating video modal */}
      {modalItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setModalItem(null)}
        >
          <div
            style={{ width: '100%', maxWidth: 360, borderRadius: 16, overflow: 'hidden', background: '#1a0f07', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — name + close button, no overlap with video controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#2C1A0E' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{modalItem.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{modalItem.after}</div>
              </div>
              <button
                onClick={() => setModalItem(null)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: 0, color: '#fff', fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Video — controls only at bottom, nothing overlapping */}
            <video
              src={modalItem.src}
              poster={modalItem.poster}
              style={{ width: '100%', display: 'block', maxHeight: '65vh', objectFit: 'contain', background: '#1a0f07' }}
              controls
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
              disableRemotePlayback
              autoPlay
              playsInline
              preload="metadata"
            />

            {/* Quote footer */}
            {modalItem.quote && (
              <div style={{ padding: '10px 14px 14px', background: '#2C1A0E' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontStyle: 'italic' }}>"{modalItem.quote}"</div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RitualContextSection() {
  return (
    <section style={styles.section}>
      <div style={styles.contextPanel}>
        <div style={styles.contextMedia}>
          <img src="/how-it-works-poster.png" alt="" style={styles.contextImage} loading="lazy" />
          <span style={styles.contextMediaPill}>For the moments you cannot be there</span>
        </div>

        <div style={styles.contextBody}>
          <p style={styles.eyebrow}>Where Sankkalp fits</p>
          <h2 style={styles.contextTitle}>Not a replacement for your temple visit.</h2>
          <p style={styles.contextLead}>
            Sankkalp is for the days when you want more than touchwood, but cannot arrange a temple visit or in-person pooja in time.
          </p>
        </div>

        <div style={styles.contextPointList}>
          {SANKALP_CONTEXT_POINTS.map((point) => (
            <div key={point.title} style={styles.contextPoint}>
              <span style={styles.contextIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span>
                <span style={styles.contextPointTitle}>{point.title}</span>
                <span style={styles.contextPointCopy}>{point.copy}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={styles.traditionBand}>
          <span style={styles.traditionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M4 19h16" />
              <path d="M7 19V9l5-4 5 4v10" />
              <path d="M9 19v-7h6v7" />
            </svg>
          </span>
          <span>
            <span style={styles.traditionTitle}>A familiar idea from older times</span>
            <span style={styles.traditionCopy}>
              Kings and queens would ask rishis, kul-gurus, and raj purohits to perform rituals for their family or kingdom when duty or distance kept them away. Sankkalp brings that same idea to urgent modern moments.
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

function BrowseByMoment({ rituals, onSelect }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllMoments, setShowAllMoments] = useState(false);

  const moments = useMemo(() => {
    return rituals.flatMap((ritual) => ritual.groups.flatMap((group) => group.moments.map((moment) => ({
      ...moment,
      ritualId: ritual.id,
      ritualName: ritual.name,
      category: categoryForMoment(ritual, group.name, moment.name),
    }))));
  }, [rituals]);

  const filteredMoments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return moments.filter((moment) => {
      const matchesFilter = activeFilter === 'All' || moment.category === activeFilter;
      const matchesSearch = !q || `${moment.name} ${moment.ritualName}`.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, moments, searchQuery]);

  const visibleMoments = showAllMoments ? filteredMoments : filteredMoments.slice(0, 10);
  const hiddenCount = Math.max(0, filteredMoments.length - 10);

  function updateFilter(filter) {
    setActiveFilter(filter);
    setShowAllMoments(false);
  }

  function updateQuery(event) {
    setSearchQuery(event.target.value);
    setShowAllMoments(false);
  }

  return (
    <section style={styles.section}>
      <h2 style={{ ...styles.h2, marginBottom: 12 }}>Search your moment</h2>
      <label style={styles.searchBox}>
        <span style={{ color: 'var(--ink-3)', display: 'inline-flex' }}><SearchIcon /></span>
        <input
          type="search"
          value={searchQuery}
          onChange={updateQuery}
          placeholder="Exam, interview, new home…"
          style={styles.searchInput}
        />
      </label>
      <div style={styles.filterScroller} aria-label="Moment filters">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => updateFilter(filter)}
              style={{ ...styles.filterPill, background: active ? 'var(--ink)' : 'var(--card)', color: active ? '#fff' : 'var(--ink)', borderColor: active ? 'var(--ink)' : 'var(--border)' }}
            >
              {filter}
            </button>
          );
        })}
      </div>
      <div style={styles.momentList}>
        {visibleMoments.map((moment) => (
          <button key={`${moment.ritualId}-${moment.id}`} type="button" style={styles.momentRow} onClick={() => onSelect(moment.ritualId, moment)}>
            <span style={styles.momentText}>
              <span style={styles.momentName}>{moment.name}</span>
              <span style={styles.momentRitual}>{moment.ritualName}</span>
            </span>
            <span style={styles.momentPrice}>₹{moment.price}</span>
          </button>
        ))}
        {filteredMoments.length === 0 && (
          <p style={styles.emptyState}>No moments match “{searchQuery}”</p>
        )}
      </div>
      {hiddenCount > 0 && (
        <button type="button" style={styles.viewMoreButton} onClick={() => setShowAllMoments((value) => !value)}>
          {showAllMoments ? 'Show less' : `View ${hiddenCount} more`}
        </button>
      )}
    </section>
  );
}

function FaqSection({ openFaq, setOpenFaq }) {
  return (
    <section style={styles.section}>
      <SectionHeading eyebrow="The basics" title="Before you book" />
      <div style={styles.faqList}>
        {FAQS.map((faq, index) => {
          const open = openFaq === index;
          return (
            <button key={faq.q} type="button" style={styles.faqItem} onClick={() => setOpenFaq(open ? null : index)}>
              <span style={styles.faqQuestion}>
                {faq.q}
                <ChevronIcon open={open} />
              </span>
              {open && <span style={styles.faqAnswer}>{faq.a}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StickyBookBar({ startingPrice, onBookNow }) {
  return (
    <div style={styles.stickyBar}>
      <div>
        <div style={styles.stickyLabel}>From</div>
        <div style={styles.stickyPrice}>₹{startingPrice}</div>
      </div>
      <button type="button" style={styles.stickyButton} onClick={onBookNow}>Book now</button>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { update } = useBooking();
  const [openFaq, setOpenFaq] = useState(null);
  const [rituals, setRituals] = useState(RITUALS);
  const [user, setUser] = useState(() => tokenPayload());

  useEffect(() => {
    let cancelled = false;
    loadBackendPriceMap()
      .then((priceMap) => {
        if (!cancelled) setRituals(applyBackendPrices(RITUALS, priceMap));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const refreshUser = () => setUser(tokenPayload());
    window.addEventListener('storage', refreshUser);
    window.addEventListener('focus', refreshUser);
    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('focus', refreshUser);
    };
  }, []);

  const startingPrice = useMemo(() => {
    const prices = rituals.flatMap((ritual) => ritual.groups.flatMap((group) => group.moments.map((moment) => moment.price).filter(Boolean)));
    return prices.length ? Math.min(...prices) : 149;
  }, [rituals]);

  function handleRitualClick(ritual) {
    trackEvent('ritual_card_clicked', {
      source: 'homepage_ritual_grid',
      ritual_id: ritual.id,
      ritual_name: ritual.name,
      from_price: ritual.from,
      currency: 'INR',
    });
    navigate(`/ritual/${ritual.id}`);
  }

  function handleMomentSelect(ritualId, moment) {
    const ritual = rituals.find((item) => item.id === ritualId);
    trackEvent('moment_selected', {
      source: 'home_search_moment',
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

  function signOut() {
    clearToken();
    setUser(null);
  }

  function handleBookNow(source = 'homepage_book_now') {
    trackEvent(source, { destination: 'moments' });
    navigate('/moments');
  }

  return (
    <div style={styles.page}>
      <HomeNav user={user} onSignIn={() => navigate('/signin')} onBookings={() => navigate('/bookings')} onSignOut={signOut} />
      <main style={styles.main}>
        <Hero onBookNow={() => handleBookNow('hero_cta_clicked')} />
        <RitualGrid rituals={rituals} onRitualClick={handleRitualClick} />
        <HowItWorks />
        <LovedOnesSection onBookNow={() => handleBookNow('book_for_someone_home_clicked')} />
        <SocialProof />
        <Testimonials />
        <RitualContextSection />
        <BrowseByMoment rituals={rituals} onSelect={handleMomentSelect} />
        <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
      </main>
      <footer style={styles.footer}>Sankkalp by Tathastu — rituals, sorted</footer>
      <StickyBookBar startingPrice={startingPrice} onBookNow={() => handleBookNow('sticky_book_now_clicked')} />
    </div>
  );
}

const styles = {
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
    paddingBottom: 78,
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: 52,
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    maxWidth: 520,
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
  },
  wordmark: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-.01em',
  },
  signInButton: {
    color: 'var(--ink)',
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'underline',
    background: 'none',
    border: 0,
    padding: 0,
  },
  navUserActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  bookingsButton: {
    color: 'var(--ink)',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 100,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 700,
  },
  navAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '1px solid rgba(181,101,74,.28)',
    background: '#F2ECE3',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    maxWidth: 520,
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '0 16px',
  },
  hero: {
    padding: '20px 0 16px',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    margin: '0 0 5px',
  },
  h1: {
    fontSize: 'clamp(22px, 5.5vw, 30px)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-.01em',
    margin: '0 0 10px',
    color: 'var(--ink)',
    overflowWrap: 'break-word',
  },
  heroCopy: {
    fontSize: 13,
    color: 'var(--ink-2)',
    lineHeight: 1.55,
    margin: '0 0 12px',
  },
  heroSupportRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    width: 'fit-content',
    maxWidth: '100%',
    boxSizing: 'border-box',
    color: '#7D4A2F',
    background: '#FFF8F4',
    border: '1px solid #EADDC9',
    borderRadius: 12,
    padding: '7px 11px',
    fontSize: 11.5,
    fontWeight: 700,
    lineHeight: 1.25,
    marginBottom: 16,
  },
  heroSupportIcon: {
    display: 'inline-flex',
    flexShrink: 0,
    color: 'var(--accent)',
  },
  heroCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--ink)',
    color: '#fff',
    fontSize: 13.5,
    fontWeight: 600,
    padding: '13px 20px',
    borderRadius: 8,
    border: 0,
  },
  section: {
    marginBottom: 28,
  },
  h2: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-.01em',
    margin: '0 0 14px',
  },
  ritualGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  ritualCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'left',
    color: 'var(--ink)',
    padding: 0,
    minWidth: 0,
  },
  ritualImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
  },
  ritualBody: {
    display: 'block',
    padding: '12px 13px',
  },
  ritualNum: {
    display: 'block',
    fontSize: 9,
    color: 'var(--accent)',
    fontWeight: 700,
    marginBottom: 5,
  },
  ritualName: {
    display: 'block',
    fontSize: 13.5,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  ritualGloss: {
    display: 'block',
    fontSize: 10,
    color: 'var(--ink-3)',
    marginTop: 1,
  },
  ritualTagline: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    fontSize: 11,
    color: 'var(--ink-2)',
    marginTop: 7,
    lineHeight: 1.4,
  },
  hiwVideoWrap: {
    width: 160,
    height: 284,
    borderRadius: 12,
    overflow: 'hidden',
    margin: '0 auto 18px',
    background: 'var(--border)',
  },
  hiwVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  hiwTracker: {
    display: 'flex',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 12,
  },
  hiwNode: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    transition: 'background .18s ease, color .18s ease, transform .18s ease',
  },
  hiwStepCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 14,
  },
  hiwStepTitle: {
    color: 'var(--ink)',
    fontSize: 13.5,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: '0 0 5px',
  },
  hiwStepDesc: {
    fontSize: 12.5,
    color: 'var(--ink-2)',
    lineHeight: 1.5,
    margin: 0,
  },
  lovedOnesBand: {
    display: 'grid',
    gridTemplateColumns: '44px 1fr',
    gap: 13,
    background: '#FFF8F4',
    borderTop: '1px solid #EADDC9',
    borderBottom: '1px solid #EADDC9',
    margin: '0 -16px 28px',
    padding: '18px 16px',
  },
  lovedOnesIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#FFFFFF',
    border: '1px solid #EADDC9',
    color: 'var(--accent)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lovedOnesBody: {
    minWidth: 0,
  },
  lovedOnesTitle: {
    color: 'var(--ink)',
    fontSize: 17,
    lineHeight: 1.18,
    fontWeight: 800,
    margin: '0 0 7px',
  },
  lovedOnesCopy: {
    color: 'var(--ink-2)',
    fontSize: 12.5,
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  lovedOnesChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 13,
  },
  lovedOnesChip: {
    borderRadius: 100,
    border: '1px solid #EADDC9',
    background: '#FFFFFF',
    color: '#7D4A2F',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '5px 9px',
  },
  lovedOnesButton: {
    border: 0,
    borderRadius: 8,
    background: 'var(--ink)',
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 700,
    padding: '10px 14px',
    cursor: 'pointer',
  },
  socialCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '18px 16px',
  },
  socialTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  socialTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  shieldTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: '#F2ECE3',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  socialTitle: {
    display: 'block',
    fontSize: 17,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  socialSubtitle: {
    display: 'block',
    fontSize: 11,
    color: 'var(--ink-3)',
    marginTop: 2,
  },
  avatarStack: {
    display: 'flex',
    flexShrink: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 11,
    color: '#5C3A1E',
    border: '2px solid #fff',
  },
  recentPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--bg)',
    borderRadius: 100,
    padding: '8px 12px',
    marginBottom: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#2D6B2D',
    flexShrink: 0,
  },
  recentText: {
    fontSize: 11,
    color: 'var(--ink-2)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badgeRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  trustBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10.5,
    fontWeight: 700,
    color: '#2D6B2D',
    background: '#EAF2EA',
    border: '1px solid #D3E5D0',
    borderRadius: 100,
    padding: '5px 10px 5px 8px',
  },
  testimonialScroller: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    paddingBottom: 8,
    scrollbarWidth: 'none',
  },
  testimonialCard: {
    flexShrink: 0,
    width: 118,
    height: 210,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    border: 0,
    padding: 0,
    textAlign: 'left',
  },
  testimonialPoster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -60%)',
    width: 38,
    height: 38,
    background: 'rgba(255,255,255,.28)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  testimonialOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '34px 10px 12px',
    background: 'linear-gradient(to top, rgba(0,0,0,.56), rgba(0,0,0,0))',
  },
  testimonialName: {
    display: 'block',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  testimonialAfter: {
    display: 'block',
    color: 'rgba(255,255,255,.82)',
    fontSize: 10,
    lineHeight: 1.2,
    marginTop: 3,
  },
  testimonialVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    background: '#1d120c',
  },
  contextPanel: {
    background: '#FEFCF8',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 10px 28px rgba(45,31,20,.04)',
  },
  contextMedia: {
    position: 'relative',
    height: 210,
    background: '#EADDC9',
    overflow: 'hidden',
  },
  contextImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  contextMediaPill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: 'calc(100% - 24px)',
    display: 'inline-flex',
    background: 'rgba(25,25,25,.72)',
    color: '#fff',
    borderRadius: 100,
    padding: '7px 11px',
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.2,
    backdropFilter: 'blur(5px)',
  },
  contextBody: {
    padding: '18px 16px 6px',
  },
  contextTitle: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.15,
    margin: '0 0 10px',
    color: 'var(--ink)',
  },
  contextLead: {
    fontSize: 13.5,
    color: 'var(--ink-2)',
    lineHeight: 1.55,
    margin: 0,
  },
  contextPointList: {
    display: 'grid',
    gap: 10,
    padding: '10px 16px 16px',
  },
  contextPoint: {
    display: 'grid',
    gridTemplateColumns: '24px 1fr',
    gap: 10,
    alignItems: 'flex-start',
  },
  contextIcon: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#EAF2EA',
    color: '#2D6B2D',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  contextPointTitle: {
    display: 'block',
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--ink)',
    lineHeight: 1.25,
    marginBottom: 2,
  },
  contextPointCopy: {
    display: 'block',
    fontSize: 12.5,
    color: 'var(--ink-2)',
    lineHeight: 1.5,
  },
  traditionBand: {
    display: 'grid',
    gridTemplateColumns: '34px 1fr',
    gap: 12,
    background: '#F7F0E6',
    borderTop: '1px solid #EADDC9',
    padding: '14px 13px',
  },
  traditionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#FFFFFF',
    color: 'var(--accent)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traditionTitle: {
    display: 'block',
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--ink)',
    lineHeight: 1.25,
    marginBottom: 4,
  },
  traditionCopy: {
    display: 'block',
    fontSize: 12.3,
    color: 'var(--ink-2)',
    lineHeight: 1.52,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '11px 12px',
    marginBottom: 10,
  },
  searchInput: {
    width: '100%',
    border: 0,
    outline: 'none',
    background: 'transparent',
    color: 'var(--ink)',
    fontSize: 13,
  },
  filterScroller: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 10,
    scrollbarWidth: 'none',
  },
  filterPill: {
    flexShrink: 0,
    border: '1px solid',
    borderRadius: 100,
    padding: '7px 13px',
    fontSize: 12,
    fontWeight: 700,
  },
  momentList: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  momentRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '13px 14px',
    background: 'var(--card)',
    border: 0,
    borderBottom: '1px solid var(--border)',
    textAlign: 'left',
    color: 'var(--ink)',
  },
  momentText: {
    display: 'block',
    minWidth: 0,
  },
  momentName: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.25,
  },
  momentRitual: {
    display: 'block',
    color: 'var(--accent)',
    fontSize: 10.5,
    fontWeight: 700,
    marginTop: 2,
  },
  momentPrice: {
    color: 'var(--accent)',
    fontSize: 12.5,
    fontWeight: 700,
    flexShrink: 0,
  },
  emptyState: {
    textAlign: 'center',
    color: 'var(--ink-3)',
    fontSize: 12.5,
    padding: '22px 10px',
    margin: 0,
  },
  viewMoreButton: {
    width: '100%',
    marginTop: 8,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 700,
  },
  faqList: {
    display: 'grid',
    gap: 8,
  },
  faqItem: {
    width: '100%',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '13px 14px',
    textAlign: 'left',
    color: 'var(--ink)',
  },
  faqQuestion: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 13,
    fontWeight: 700,
  },
  faqAnswer: {
    display: 'block',
    color: 'var(--ink-2)',
    fontSize: 12.5,
    lineHeight: 1.55,
    marginTop: 9,
  },
  footer: {
    maxWidth: 520,
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '18px 16px',
    textAlign: 'center',
    borderTop: '1px solid var(--border)',
    color: 'var(--ink-3)',
    fontSize: 11.5,
  },
  stickyBar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 120,
    maxWidth: 520,
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    background: '#fff',
    borderTop: '1px solid #E4E0D5',
    padding: '13px 16px calc(13px + env(safe-area-inset-bottom))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyLabel: {
    fontSize: 12.5,
    color: '#8A8378',
    lineHeight: 1.1,
  },
  stickyPrice: {
    color: '#191919',
    fontSize: 15,
    fontWeight: 700,
  },
  stickyButton: {
    border: '1.5px solid #191919',
    color: '#191919',
    background: '#fff',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
  },
};

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RITUALS } from '../data/rituals';
import { tokenPayload } from '../lib/auth';
import { trackEvent } from '../lib/analytics';
import { applyBackendPrices, loadBackendPriceMap } from '../lib/catalogPrices';
import { useEffect } from 'react';

const CHIPS = ['All', 'Career', 'Exams', 'Travel', 'Money', 'Love', 'Protection', 'Home', 'Family'];
const GROUP_ORDER = ['Career & Work', 'Exams & Study', 'Money & Business', 'Travel & Big Days', 'Love & Relationships', 'Protection & Nazar'];
const POPULAR_IDS = ['job-interview', 'exam-day', 'losing-streak', 'new-shop'];

const RITUAL_COLORS = {
  'Raksha Kavach': { bg: '#F6EAD4', ink: '#AD7A24' },
  'Dhan Aagman': { bg: '#EDE8D2', ink: '#8C7A2E' },
  'Prem Setu': { bg: '#F7E3E0', ink: '#BD5F63' },
  'Nazar Badha': { bg: '#EADBD6', ink: '#8B4B3E' },
};

const MOMENT_BLUEPRINTS = [
  { id: 'new-job', name: 'New job', desc: 'Start the new chapter protected.', ritualId: 'rk', momentId: 'rk-nj', category: 'Career', group: 'Career & Work', icon: 'career' },
  { id: 'first-day', name: 'First day at work', desc: 'Walk in on the right foot.', ritualId: 'rk', momentId: 'rk-fd', category: 'Career', group: 'Career & Work', icon: 'career' },
  { id: 'big-meeting', name: 'Big meeting', desc: 'Walk in with a clear, confident mind.', ritualId: 'rk', momentId: 'rk-bm', category: 'Career', group: 'Career & Work', icon: 'career' },
  { id: 'job-interview', name: 'Job interview', desc: 'Feel steady before the room.', ritualId: 'rk', momentId: 'rk-ji', category: 'Career', group: 'Career & Work', icon: 'career' },
  { id: 'salary-promotion', name: 'Salary or promotion', desc: 'Ask from a place of quiet confidence.', ritualId: 'da', momentId: 'da-sp', category: 'Career', group: 'Career & Work', icon: 'money' },
  { id: 'exam-day', name: 'Exam day', desc: 'Calm focus when it counts.', ritualId: 'rk', momentId: 'rk-ed', category: 'Exams', group: 'Exams & Study', icon: 'exams' },
  { id: 'results-day', name: 'Results day', desc: 'Hold your nerve for the news.', ritualId: 'rk', momentId: 'rk-rd', category: 'Exams', group: 'Exams & Study', icon: 'exams' },
  { id: 'big-deal', name: 'Big deal or pitch', desc: 'Tip the odds your way.', ritualId: 'da', momentId: 'da-bd', category: 'Money', group: 'Money & Business', icon: 'money' },
  { id: 'new-shop', name: 'New shop / business', desc: 'Start with prosperity blessings.', ritualId: 'da', momentId: 'da-ns', category: 'Money', group: 'Money & Business', icon: 'money' },
  { id: 'new-venture', name: 'New venture / startup', desc: 'Bless the launch before day one.', ritualId: 'da', momentId: 'da-sv', category: 'Money', group: 'Money & Business', icon: 'money' },
  { id: 'property-deal', name: 'Property deal', desc: 'Seal it with prosperity.', ritualId: 'da', momentId: 'da-pd', category: 'Money', group: 'Money & Business', icon: 'home' },
  { id: 'investment', name: 'Investment / trade', desc: 'Enter the market with a clear head.', ritualId: 'da', momentId: 'da-it', category: 'Money', group: 'Money & Business', icon: 'money' },
  { id: 'flight-travel', name: 'Flight / travel', desc: 'Safe passage, there and back.', ritualId: 'rk', momentId: 'rk-fl', category: 'Travel', group: 'Travel & Big Days', icon: 'travel' },
  { id: 'surgery-health', name: 'Surgery / health', desc: 'A shield through the procedure.', ritualId: 'rk', momentId: 'rk-sh', category: 'Travel', group: 'Travel & Big Days', icon: 'protection' },
  { id: 'new-home', name: 'New home', desc: 'Bless and protect the move.', ritualId: 'rk', momentId: 'rk-nh', category: 'Home', group: 'Travel & Big Days', icon: 'home' },
  { id: 'new-vehicle', name: 'New vehicle', desc: 'An auspicious first drive.', ritualId: 'da', momentId: 'da-nv', category: 'Travel', group: 'Travel & Big Days', icon: 'travel' },
  { id: 'confess', name: 'Confess your feelings', desc: 'Find the nerve to say it.', ritualId: 'ps', momentId: 'ps-cf', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'propose', name: 'Before you propose', desc: 'Bless the big question.', ritualId: 'ps', momentId: 'ps-pr', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'anniversary', name: 'Anniversary', desc: 'Renew the connection.', ritualId: 'ps', momentId: 'ps-an', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'long-distance', name: 'Long distance bond', desc: 'Keep the connection strong.', ritualId: 'ps', momentId: 'ps-ld', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'patch-fight', name: 'Patch a fight', desc: 'Mend a strained bond.', ritualId: 'ps', momentId: 'ps-pf', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'win-back', name: 'Win them back', desc: 'Reopen the door, gently.', ritualId: 'ps', momentId: 'ps-wb', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'family-harmony', name: 'Family harmony', desc: 'Bring peace back to the home.', ritualId: 'ps', momentId: 'ps-fh', category: 'Family', group: 'Love & Relationships', icon: 'family' },
  { id: 'marriage', name: 'Marriage / shaadi', desc: 'Bless the union before the day.', ritualId: 'ps', momentId: 'ps-ms', category: 'Love', group: 'Love & Relationships', icon: 'love' },
  { id: 'losing-streak', name: 'A losing streak', desc: 'Clear heavy energy and reset.', ritualId: 'nb', momentId: 'nb-ls', category: 'Protection', group: 'Protection & Nazar', icon: 'protection' },
  { id: 'biz-nazar', name: 'Business / home nazar', desc: "Protect what you've built.", ritualId: 'nb', momentId: 'nb-bh', category: 'Protection', group: 'Protection & Nazar', icon: 'protection' },
  { id: 'health-family', name: 'Health / family', desc: 'Clear heavy energy from loved ones.', ritualId: 'nb', momentId: 'nb-hf', category: 'Family', group: 'Protection & Nazar', icon: 'family' },
  { id: 'feeling-off', name: 'Feeling off lately', desc: 'Reset when nothing feels right.', ritualId: 'nb', momentId: 'nb-fo', category: 'Protection', group: 'Protection & Nazar', icon: 'protection' },
];

const ICONS = {
  career: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  exams: <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />,
  money: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M12 10v5M10 12.5h4" /></>,
  travel: <path d="M22 16.2l-3.5 3.6-8.5-3.8L6 21l-2-2 4.3-4.1L5 6 7 4l5.2 4.2 4.1-4.3 3.5 1.7" />,
  love: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />,
  protection: <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z" />,
  home: <path d="M3 11l9-7 9 7M5 10v10h14V10" />,
  family: <path d="M16 11c1.7 0 3 1.3 3 3v1h-4M8 11c-1.7 0-3 1.3-3 3v1h4M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#2D6B2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronRight({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8A8378" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8A8378" strokeWidth="1.8" strokeLinecap="round" width="16" height="16" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function MomentIcon({ item, size = 42 }) {
  const colors = RITUAL_COLORS[item.ritualName] || RITUAL_COLORS['Raksha Kavach'];
  return (
    <span style={{ ...styles.iconTile, width: size, height: size, background: colors.bg, color: colors.ink }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="17" height="17" aria-hidden="true">
        {ICONS[item.icon] || ICONS.protection}
      </svg>
    </span>
  );
}

function RitualPill({ ritualName }) {
  const colors = RITUAL_COLORS[ritualName] || RITUAL_COLORS['Raksha Kavach'];
  return <span style={{ ...styles.ritualPill, background: colors.bg, color: colors.ink }}>{ritualName}</span>;
}

function makeMoments(rituals) {
  return MOMENT_BLUEPRINTS.map((blueprint) => {
    const ritual = rituals.find((item) => item.id === blueprint.ritualId);
    const moment = ritual?.groups.flatMap((group) => group.moments).find((item) => item.id === blueprint.momentId);
    return {
      ...blueprint,
      ritualName: ritual?.name || 'Raksha Kavach',
      price: moment?.price || 149,
    };
  });
}

function filterMoments(moments, activeFilter, query) {
  const q = query.trim().toLowerCase();
  return moments.filter((moment) => {
    const matchesFilter = activeFilter === 'All' || moment.category === activeFilter;
    const matchesQuery = !q || `${moment.name} ${moment.desc} ${moment.ritualName}`.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });
}

export default function MomentsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [rituals, setRituals] = useState(RITUALS);
  const user = tokenPayload();

  useEffect(() => {
    let cancelled = false;
    loadBackendPriceMap()
      .then((priceMap) => {
        if (!cancelled) setRituals(applyBackendPrices(RITUALS, priceMap));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const moments = useMemo(() => makeMoments(rituals), [rituals]);
  const filtered = useMemo(() => filterMoments(moments, activeFilter, searchQuery), [activeFilter, moments, searchQuery]);
  const grouped = useMemo(() => GROUP_ORDER.map((group) => ({
    group,
    items: filtered.filter((moment) => moment.group === group),
  })).filter((group) => group.items.length > 0), [filtered]);
  const popular = useMemo(() => POPULAR_IDS.map((id) => moments.find((moment) => moment.id === id)).filter(Boolean), [moments]);
  const showPopular = !searchQuery.trim() && activeFilter === 'All';
  const hasResults = grouped.length > 0;

  function selectFilter(chip) {
    setActiveFilter(chip);
    trackEvent('moment_filter_clicked', { source: 'moments_page', filter: chip });
  }

  function updateSearch(event) {
    const value = event.target.value;
    setSearchQuery(value);
    if (value.length === 1) trackEvent('moment_search_started', { source: 'moments_page' });
  }

  function resetAll() {
    setSearchQuery('');
    setActiveFilter('All');
  }

  function openMoment(moment, source = 'moments_page') {
    trackEvent('moment_selected', {
      source,
      ritual_id: moment.ritualId,
      ritual_name: moment.ritualName,
      moment_id: moment.momentId,
      moment_name: moment.name,
      value: moment.price,
      currency: 'INR',
    });
    navigate(`/ritual/${moment.ritualId}/${moment.momentId}`);
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button type="button" style={styles.backButton} onClick={() => navigate('/')}>
          <BackIcon />
        </button>
        <strong style={styles.navTitle}>Choose your moment</strong>
        {!user ? (
          <button type="button" style={styles.signInButton} onClick={() => navigate('/signin')}>Sign in</button>
        ) : (
          <button type="button" style={styles.signInButton} onClick={() => navigate('/bookings')}>My bookings</button>
        )}
      </nav>

      <main style={styles.main}>
        <section style={styles.header}>
          <p style={styles.eyebrow}>BOOK A SANKKALP</p>
          <h1 style={styles.h1}>What moment are you preparing for?</h1>
          <p style={styles.subhead}>Choose what’s happening in your life. We’ll suggest the right ritual and show when your ritual video can be delivered.</p>
          <div style={styles.trustRow}>
            <CheckIcon />
            <span>Verified pandits</span>
            <span style={styles.separator}>·</span>
            <span>Video proof</span>
            <span style={styles.separator}>·</span>
            <span>4–12 hr turnaround</span>
          </div>
        </section>

        <section style={styles.searchSection}>
          <label style={styles.searchBox}>
            <SearchIcon />
            <input
              type="search"
              value={searchQuery}
              onChange={updateSearch}
              placeholder="Search exam, interview, new home…"
              style={styles.searchInput}
            />
            {searchQuery && (
              <button type="button" style={styles.clearButton} onClick={() => setSearchQuery('')} aria-label="Clear search">×</button>
            )}
          </label>
        </section>

        <section style={styles.chipScroller} aria-label="Moment filters">
          {CHIPS.map((chip) => {
            const active = activeFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => selectFilter(chip)}
                style={{ ...styles.chip, background: active ? '#191919' : '#fff', borderColor: active ? '#191919' : '#E4E0D5', color: active ? '#fff' : '#191919' }}
              >
                {chip}
              </button>
            );
          })}
        </section>

        {showPopular && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Popular right now</h2>
            {popular.map((moment) => (
              <button key={moment.id} type="button" style={styles.popularCard} onClick={() => openMoment(moment, 'moments_popular')}>
                <MomentIcon item={moment} size={40} />
                <span style={styles.popularBody}>
                  <span style={styles.cardTopLine}>
                    <span style={styles.popularName}>{moment.name}</span>
                    <ChevronRight />
                  </span>
                  <span style={styles.popularDesc}>{moment.desc}</span>
                  <span style={styles.cardFooter}>
                    <RitualPill ritualName={moment.ritualName} />
                    <span style={styles.fromPrice}>From ₹{moment.price}</span>
                  </span>
                </span>
              </button>
            ))}
          </section>
        )}

        <section id="all-moments" style={styles.section}>
          <h2 style={styles.sectionTitle}>All moments</h2>
          {hasResults ? (
            grouped.map(({ group, items }) => (
              <div key={group} style={styles.groupWrap}>
                <h3 style={styles.groupTitle}>{group}</h3>
                <div style={styles.groupCard}>
                  {items.map((moment) => (
                    <button key={moment.id} type="button" style={styles.momentRow} onClick={() => openMoment(moment)}>
                      <MomentIcon item={moment} />
                      <span style={styles.rowBody}>
                        <span style={styles.rowName}>{moment.name}</span>
                        <span style={styles.rowDesc}>{moment.desc}</span>
                        <RitualPill ritualName={moment.ritualName} />
                      </span>
                      <span style={styles.rowPrice}>₹{moment.price}</span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>No matching moment found</h3>
              <p style={styles.emptyCopy}>Try searching for what’s happening — like “exam”, “love”, “money”, or “nazar”.</p>
              <button type="button" style={styles.outlineButton} onClick={resetAll}>Browse all moments</button>
            </div>
          )}
        </section>
      </main>

      <div style={styles.helperBar}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.helperTitle}>Not sure what to choose?</div>
          <div style={styles.helperCopy}>Search your situation or pick the closest moment.</div>
        </div>
        <a href="#all-moments" style={styles.helperButton}>Browse</a>
      </div>
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
    paddingBottom: 78,
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: 52,
    maxWidth: 520,
    margin: '0 auto',
    padding: '0 16px',
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
    display: 'grid',
    gridTemplateColumns: '44px 1fr auto',
    alignItems: 'center',
    gap: 6,
  },
  backButton: { width: 36, height: 36, border: 0, background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', padding: 0 },
  navTitle: { fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' },
  signInButton: { border: 0, background: 'transparent', color: 'var(--ink)', fontSize: 12, fontWeight: 600, textDecoration: 'underline', padding: 0 },
  main: { maxWidth: 520, margin: '0 auto' },
  header: { padding: '20px 16px 16px' },
  eyebrow: { fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 8px' },
  h1: { fontSize: 20, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-.01em', margin: '0 0 8px' },
  subhead: { color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, margin: '0 0 12px' },
  trustRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: 'var(--ink-2)', fontSize: 11, fontWeight: 600 },
  separator: { color: 'var(--border)' },
  searchSection: { padding: '0 16px 12px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1px solid var(--border)', borderRadius: 100, padding: '13px 16px' },
  searchInput: { border: 0, outline: 'none', background: 'transparent', width: '100%', color: 'var(--ink)', fontSize: 13.5 },
  clearButton: { width: 20, height: 20, borderRadius: '50%', border: 0, background: 'var(--bg)', color: 'var(--ink-3)', fontSize: 16, lineHeight: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  chipScroller: { display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 20px', scrollbarWidth: 'none' },
  chip: { flexShrink: 0, border: '1px solid', borderRadius: 100, padding: '7px 13px', fontSize: 11.5, fontWeight: 600 },
  section: { padding: '0 16px 24px' },
  sectionTitle: { fontSize: 17, fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px' },
  popularCard: { width: '100%', display: 'flex', gap: 13, alignItems: 'flex-start', background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 15, marginBottom: 10, textAlign: 'left', color: 'var(--ink)' },
  iconTile: { borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  popularBody: { display: 'block', flex: 1, minWidth: 0 },
  cardTopLine: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  popularName: { fontSize: 15, fontWeight: 700, lineHeight: 1.2 },
  popularDesc: { display: 'block', color: 'var(--ink-2)', fontSize: 12.5, lineHeight: 1.4, margin: '4px 0 11px' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  ritualPill: { display: 'inline-flex', alignItems: 'center', borderRadius: 100, padding: '3.5px 10px', fontSize: 10, fontWeight: 700, lineHeight: 1.2 },
  fromPrice: { color: 'var(--ink)', fontSize: 13.5, fontWeight: 700, flexShrink: 0 },
  groupWrap: { marginBottom: 18 },
  groupTitle: { color: 'var(--ink-3)', fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 8px' },
  groupCard: { background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  momentRow: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 13, border: 0, borderBottom: '1px solid var(--border)', background: '#fff', textAlign: 'left', color: 'var(--ink)' },
  rowBody: { display: 'block', flex: 1, minWidth: 0 },
  rowName: { display: 'block', fontSize: 14, fontWeight: 700, lineHeight: 1.2 },
  rowDesc: { display: 'block', color: 'var(--ink-2)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '3px 0 5px' },
  rowPrice: { color: 'var(--ink)', fontSize: 12.5, fontWeight: 700, flexShrink: 0 },
  emptyState: { textAlign: 'center', padding: '44px 20px 40px' },
  emptyTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 6px' },
  emptyCopy: { color: 'var(--ink-3)', fontSize: 12.5, lineHeight: 1.5, margin: '0 0 16px' },
  outlineButton: { border: '1.5px solid var(--ink)', background: 'transparent', color: 'var(--ink)', borderRadius: 8, padding: '10px 18px', fontSize: 12.5, fontWeight: 600 },
  helperBar: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 120, maxWidth: 520, margin: '0 auto', background: '#fff', borderTop: '1px solid #E4E0D5', padding: '11px 16px calc(11px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  helperTitle: { color: '#191919', fontSize: 12, fontWeight: 700 },
  helperCopy: { color: '#8A8378', fontSize: 10.5, marginTop: 1 },
  helperButton: { flexShrink: 0, color: '#191919', border: '1.5px solid #191919', borderRadius: 8, padding: '8px 15px', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' },
};

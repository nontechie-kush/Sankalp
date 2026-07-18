import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { api } from '../lib/api';
import { clearToken, getStoredUser, setStoredUser, tokenPayload } from '../lib/auth';

const S = {
  page: {
    '--bg': '#F7F5F1', '--card': '#FFFFFF', '--ink': '#191919',
    '--ink-2': '#5C574D', '--ink-3': '#8A8378', '--accent': '#B5654A',
    '--border': '#E4E0D5',
    minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    paddingBottom: 60,
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
  },
  navInner: {
    height: 52, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 16px',
    maxWidth: 520, margin: '0 auto',
  },
  backBtn: {
    background: 'none', border: 0, padding: 0,
    fontSize: 13, fontWeight: 600, color: 'var(--ink-2)',
    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
  },
  wrap: { maxWidth: 520, margin: '0 auto', padding: '0 16px' },
  avatar: {
    width: 60, height: 60, borderRadius: '50%',
    background: 'linear-gradient(135deg,#C8845A,#7D4A2F)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0,
  },
  section: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 14, overflow: 'hidden', marginBottom: 12,
  },
  sectionHead: {
    padding: '13px 16px', borderBottom: '1px solid var(--border)',
    fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
    textTransform: 'uppercase', color: 'var(--ink-3)',
  },
  field: { padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  fieldLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
    textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5, display: 'block',
  },
  fieldInput: {
    width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
    padding: '10px 12px', fontSize: 15, color: 'var(--ink)', background: '#fff',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color .15s',
  },
  fieldHint: { fontSize: 11, color: 'var(--ink-3)', marginTop: 5 },
  row: {
    padding: '13px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  relCard: {
    padding: '13px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  relAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: '#F2ECE3', border: '1px solid rgba(181,101,74,.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
  },
  relName: { fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 },
  relSub: { fontSize: 12, color: 'var(--ink-3)', marginTop: 2 },
  btn: (variant) => ({
    border: 0, borderRadius: 10, padding: '11px 18px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    ...(variant === 'primary'
      ? { background: 'var(--accent)', color: '#fff' }
      : variant === 'danger'
      ? { background: 'none', color: '#C0392B', padding: '11px 0' }
      : { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }),
  }),
  drawer: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,.45)', display: 'flex',
    alignItems: 'flex-end', justifyContent: 'center',
  },
  drawerCard: {
    background: '#fff', borderRadius: '18px 18px 0 0',
    width: '100%', maxWidth: 520, padding: '20px 20px 36px',
    maxHeight: '90vh', overflowY: 'auto',
  },
};

function getRelatives() {
  try { return JSON.parse(localStorage.getItem('sankalp_relatives') || '[]'); }
  catch { return []; }
}
function persistRelatives(list) {
  localStorage.setItem('sankalp_relatives', JSON.stringify(list));
}

const RELATIONS = ['Mother', 'Father', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Grandparent', 'Friend', 'Other'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = tokenPayload();

  const [name, setName] = useState('');
  const [gotra, setGotra] = useState('');
  const [place, setPlace] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saved' | 'error'
  const locationRef = useRef(null);
  const acRef = useRef(null);

  const [relatives, setRelatives] = useState(getRelatives);
  const [drawer, setDrawer] = useState(null); // null | { mode: 'add'|'edit', idx?: number }
  const [relForm, setRelForm] = useState({ name: '', relation: '', gotra: '', place: '' });

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    const stored = getStoredUser();
    if (stored?.name) setName(stored.name);
    if (stored?.gotra) setGotra(stored.gotra);
    if (stored?.sankalpLocation) setPlace(stored.sankalpLocation);

    api.me().then(d => {
      if (!d.success || !d.user) return;
      if (d.user.name) setName(d.user.name);
      if (d.user.gotra) setGotra(d.user.gotra);
      if (d.user.sankalpLocation) setPlace(d.user.sankalpLocation);
    }).catch(() => {});
  }, []);

  // Attach Google Places autocomplete once input is mounted
  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) return;

    function attach() {
      if (!locationRef.current || !window.google?.maps?.places) return;
      if (acRef.current) return;
      acRef.current = new window.google.maps.places.Autocomplete(locationRef.current, {
        types: ['(cities)'],
        fields: ['name', 'formatted_address'],
      });
      acRef.current.addListener('place_changed', () => {
        const p = acRef.current.getPlace();
        setPlace(p.name || p.formatted_address || '');
      });
    }

    if (window.google?.maps?.places) {
      attach();
    } else if (!document.getElementById('gmaps-script')) {
      const s = document.createElement('script');
      s.id = 'gmaps-script';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      s.async = true;
      s.onload = attach;
      document.head.appendChild(s);
    }
  }, []);

  async function saveProfile() {
    if (name.trim().length < 2) return;
    setSaving(true); setSaveStatus('');
    const d = await api.saveProfile(name.trim(), gotra.trim(), { sankalpLocation: place.trim() });
    setSaving(false);
    if (!d.success) { setSaveStatus('error'); return; }
    if (d.user) setStoredUser(d.user);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2500);
  }

  function openAdd() {
    setRelForm({ name: '', relation: '', gotra: '', place: '' });
    setDrawer({ mode: 'add' });
  }
  function openEdit(idx) {
    setRelForm({ ...relatives[idx] });
    setDrawer({ mode: 'edit', idx });
  }
  function saveRelative() {
    if (relForm.name.trim().length < 2) return;
    const updated = [...relatives];
    const entry = { ...relForm, name: relForm.name.trim() };
    if (drawer.mode === 'edit') updated[drawer.idx] = entry;
    else updated.push(entry);
    persistRelatives(updated);
    setRelatives(updated);
    setDrawer(null);
  }
  function deleteRelative(idx) {
    const updated = relatives.filter((_, i) => i !== idx);
    persistRelatives(updated);
    setRelatives(updated);
    setDrawer(null);
  }

  const initial = name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div style={S.page}>
      {/* Nav */}
      <div style={S.nav}>
        <div style={S.navInner}>
          <button style={S.backBtn} onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <Logo noLink />
          <div style={{ width: 48 }} />
        </div>
      </div>

      <div style={S.wrap}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 18px' }}>
          <div style={S.avatar}>{initial}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>{name || 'Your profile'}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{user?.phone}</div>
          </div>
        </div>

        {/* Details section */}
        <div style={S.section}>
          <div style={S.sectionHead}>Your details</div>

          <div style={S.field}>
            <label style={S.fieldLabel}>Full name *</label>
            <input
              style={S.fieldInput}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
            />
          </div>

          <div style={S.field}>
            <label style={S.fieldLabel}>Gotra <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
            <input
              style={S.fieldInput}
              type="text"
              value={gotra}
              onChange={e => setGotra(e.target.value)}
              placeholder="e.g. Kashyap"
            />
            <div style={S.fieldHint}>Used by the pandit during the sankalp.</div>
          </div>

          <div style={{ ...S.field, borderBottom: 0 }}>
            <label style={S.fieldLabel}>City / location <span style={{ textTransform: 'none', fontWeight: 400 }}>(recommended)</span></label>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
                <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              <input
                ref={locationRef}
                style={{ ...S.fieldInput, paddingLeft: 32 }}
                type="text"
                value={place}
                onChange={e => setPlace(e.target.value)}
                placeholder="e.g. Gurugram, Delhi"
                autoComplete="off"
              />
            </div>
            <div style={S.fieldHint}>Included in the sankalp. Type to search city via Google.</div>
          </div>
        </div>

        {/* Save button */}
        <button
          style={{ ...S.btn('primary'), width: '100%', marginBottom: 16, opacity: saving || name.trim().length < 2 ? .5 : 1 }}
          onClick={saveProfile}
          disabled={saving || name.trim().length < 2}
        >
          {saving ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Could not save — retry' : 'Save changes'}
        </button>

        {/* Relatives section */}
        <div style={S.section}>
          <div style={{ ...S.sectionHead, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Family & relatives</span>
            <button
              onClick={openAdd}
              style={{ background: 'none', border: 0, color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}
            >
              + Add
            </button>
          </div>

          {relatives.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No relatives added yet.<br />Add family members to book rituals for them quickly.
            </div>
          ) : (
            relatives.map((rel, idx) => (
              <div key={idx} style={S.relCard}>
                <div style={S.relAvatar}>{rel.name[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.relName}>{rel.name}</div>
                  <div style={S.relSub}>
                    {[rel.relation, rel.gotra, rel.place].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(idx)}
                  style={{ background: 'none', border: 0, color: 'var(--ink-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                >
                  Edit
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => { clearToken(); navigate('/'); }}
          style={{ ...S.btn('danger'), width: '100%', textAlign: 'center', marginTop: 4 }}
        >
          Sign out
        </button>
      </div>

      {/* Add / Edit relative drawer */}
      {drawer && (
        <div style={S.drawer} onClick={() => setDrawer(null)}>
          <div style={S.drawerCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{drawer.mode === 'add' ? 'Add relative' : 'Edit relative'}</div>
              <button onClick={() => setDrawer(null)} style={{ background: 'none', border: 0, fontSize: 22, color: 'var(--ink-3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Relation chips */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.fieldLabel}>Relation</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {RELATIONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRelForm(f => ({ ...f, relation: r }))}
                    style={{
                      padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                      border: '1.5px solid', cursor: 'pointer',
                      borderColor: relForm.relation === r ? 'var(--accent)' : 'var(--border)',
                      background: relForm.relation === r ? '#FFF1EB' : '#fff',
                      color: relForm.relation === r ? 'var(--accent)' : 'var(--ink-2)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.fieldLabel}>Full name *</label>
              <input style={S.fieldInput} type="text" placeholder="e.g. Sunita Sharma"
                value={relForm.name} onChange={e => setRelForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.fieldLabel}>Gotra <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input style={S.fieldInput} type="text" placeholder="e.g. Kashyap"
                value={relForm.gotra} onChange={e => setRelForm(f => ({ ...f, gotra: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.fieldLabel}>City <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input style={S.fieldInput} type="text" placeholder="e.g. Mumbai"
                value={relForm.place} onChange={e => setRelForm(f => ({ ...f, place: e.target.value }))} />
            </div>

            <button
              style={{ ...S.btn('primary'), width: '100%', marginBottom: drawer.mode === 'edit' ? 10 : 0, opacity: relForm.name.trim().length < 2 ? .5 : 1 }}
              onClick={saveRelative}
              disabled={relForm.name.trim().length < 2}
            >
              {drawer.mode === 'add' ? 'Add relative' : 'Save changes'}
            </button>

            {drawer.mode === 'edit' && (
              <button style={{ ...S.btn('danger'), width: '100%', textAlign: 'center' }} onClick={() => deleteRelative(drawer.idx)}>
                Remove relative
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

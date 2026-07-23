import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Logo from '../components/Logo';

export default function WatchPage() {
  const { ref } = useParams();
  const [streamUrl, setStreamUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`/api/video/${ref}`)
      .then(r => r.json())
      .then(data => {
        if (data.streamUrl) {
          setStreamUrl(data.streamUrl);
        } else {
          setError(data.error || 'Video not available');
        }
      })
      .catch(() => setError('Could not load video'))
      .finally(() => setLoading(false));
  }, [ref]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <Logo />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 520, margin: '0 auto', width: '100%', padding: '24px 16px 40px' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>
          Your Ritual Video
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', marginBottom: 20 }}>
          Ritual Complete 🙏
        </h1>

        {loading && (
          <div style={{ background: '#000', borderRadius: 14, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,.2)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {error && (
          <div style={{ background: '#FDF3F3', border: '1px solid #F5C6C6', borderRadius: 14, padding: '20px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#C0392B', marginBottom: 4 }}>{error}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>If you think this is a mistake, contact us on WhatsApp.</p>
          </div>
        )}

        {streamUrl && (
          <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              playsInline
              preload="metadata"
              style={{ width: '100%', display: 'block', maxHeight: '70vh' }}
            />
          </div>
        )}

        {streamUrl && (
          <div style={{ marginTop: 20, padding: '16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
              This video was performed by a verified pandit on your behalf at an auspicious muhurat.
              The link is valid for 24 hours. Save the video to your device to keep it permanently.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

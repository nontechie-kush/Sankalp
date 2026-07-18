import { useNavigate } from 'react-router-dom';

function Flame({ size = 20 }) {
  return (
    <svg viewBox="0 0 12 20" width={size * 0.6} height={size} fill="none">
      {/* Outer flame body */}
      <path
        d="M6 0C6 0 1 7 1 12.5A5 5 0 0 0 11 12.5C11 9 8.5 5.5 7.5 3.5 7.2 5 7 6.2 7 7.8 7 9.5 7.8 10.8 7.8 10.8 7.8 10.8 6 8.5 6 0Z"
        fill="#B5654A"
      />
      {/* Inner hot-core highlight */}
      <path
        d="M6 6C6 6 4 9 4 12A2 2 0 0 0 8 12C8 10 7 8.5 6 6Z"
        fill="#E8956A"
        opacity="0.55"
      />
    </svg>
  );
}

export default function Logo({ size = 'md', noLink = false }) {
  const navigate = useNavigate();
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 20 : 15;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 19;

  return (
    <span
      onClick={noLink ? undefined : () => navigate('/')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        cursor: noLink ? 'default' : 'pointer',
        userSelect: 'none',
        textDecoration: 'none',
      }}
    >
      <Flame size={iconSize} />
      <span style={{
        fontSize,
        fontWeight: 700,
        letterSpacing: '-.025em',
        color: '#191919',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        lineHeight: 1,
      }}>
        Sankkalp
      </span>
    </span>
  );
}

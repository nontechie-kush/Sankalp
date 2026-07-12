export function getToken() { return localStorage.getItem('sankalp_token'); }
export function setToken(t) { localStorage.setItem('sankalp_token', t); }
export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('sankalp_user') || 'null'); }
  catch { return null; }
}
export function setStoredUser(user) { localStorage.setItem('sankalp_user', JSON.stringify(user || {})); }
export function clearToken() {
  localStorage.removeItem('sankalp_token');
  localStorage.removeItem('sankalp_user');
}

export function tokenPayload() {
  try {
    const t = getToken();
    if (!t) return null;
    const p = JSON.parse(atob(t.split('.')[1]));
    if (p.exp * 1000 <= Date.now()) {
      clearToken();
      return null;
    }
    const stored = getStoredUser();
    return {
      ...p,
      phone: stored?.phone || p.phone,
      name: stored?.name || p.name || '',
      gotra: stored?.gotra || p.gotra || '',
    };
  } catch { return null; }
}

export function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

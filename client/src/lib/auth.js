import { supabase } from './supabase';

export function getToken() {
  return localStorage.getItem('sankalp_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('sankalp_token', token);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('sankalp_user') || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem('sankalp_user', JSON.stringify(user || {}));
}

export function clearToken() {
  localStorage.removeItem('sankalp_token');
  localStorage.removeItem('sankalp_user');
  void supabase.auth.signOut({ scope: 'local' });
}

export function tokenPayload() {
  const stored = getStoredUser();
  if (stored?.phone) return stored;

  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearToken();
      return null;
    }
    return {
      ...payload,
      phone: payload.phone || payload.user_metadata?.phone || '',
      name: payload.user_metadata?.full_name || payload.name || '',
    };
  } catch {
    return null;
  }
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

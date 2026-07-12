const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !serviceKey) {
  console.warn('⚠️  Supabase service role not configured — bookings will not persist (add SUPABASE_URL + SUPABASE_SERVICE_KEY to .env)');
}

if (!url || !anonKey) {
  console.warn('⚠️  Supabase phone auth not configured — OTP will not work (add SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY to .env)');
}

const db = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;

const authClient = url && (anonKey || serviceKey)
  ? createClient(url, anonKey || serviceKey, { auth: { persistSession: false } })
  : null;

module.exports = { db, authClient };

const express = require('express');
const router = express.Router();
const { db: supabase, authClient } = require('../src/supabase');
const { signToken, verifyToken } = require('../src/auth');

function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');

  if (raw.startsWith('+') && digits.length >= 8 && digits.length <= 15) {
    return '+' + digits;
  }
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  if (digits.length > 10 && digits.length <= 15) return '+' + digits;
  return null;
}

function publicUser(row, phone) {
  return {
    id: row?.id || null,
    phone: row?.phone || phone,
    name: row?.name || '',
    gotra: row?.gotra || '',
    ritualPoints: row?.ritual_points || 0,
  };
}

async function findOrCreateUser(authUser, phone) {
  if (!supabase) return { user: publicUser(null, phone), isNew: true };

  let { data: existing, error: selectError } = await supabase
    .from('sankalp_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    return { user: publicUser(existing, phone), isNew: !existing.name };
  }

  const insertPayload = authUser?.id ? { id: authUser.id, phone } : { phone };
  const { data: inserted, error: insertError } = await supabase
    .from('sankalp_users')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) throw insertError;
  return { user: publicUser(inserted, phone), isNew: true };
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ success: false, error: 'Enter a valid phone number with country code.' });
  if (!authClient) return res.status(503).json({ success: false, error: 'Phone OTP is not configured.' });

  const { error } = await authClient.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error('Supabase OTP send error:', error.message);
    return res.status(400).json({ success: false, error: error.message || 'Could not send OTP.' });
  }

  res.json({ success: true, message: 'OTP sent via SMS', phone });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || '').trim();

  if (!phone || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, error: 'Phone and 6-digit OTP required.' });
  }
  if (!authClient) return res.status(503).json({ success: false, error: 'Phone OTP is not configured.' });

  const { data, error } = await authClient.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms',
  });

  if (error || !data?.user) {
    console.error('Supabase OTP verify error:', error?.message);
    return res.status(400).json({ success: false, error: error?.message || 'Invalid or expired OTP. Try again.' });
  }

  try {
    const { user, isNew } = await findOrCreateUser(data.user, phone);
    const token = signToken({
      userId: user.id || data.user.id,
      authUserId: data.user.id,
      phone,
      name: user.name || '',
    });

    res.json({ success: true, token, isNew, user });
  } catch (err) {
    console.error('User upsert error:', err.message);
    res.status(500).json({ success: false, error: 'OTP verified, but account setup failed.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const payload = verifyToken(header.replace('Bearer ', ''));
  if (!payload) return res.status(401).json({ success: false, error: 'Invalid token' });

  const { name, gotra } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Name is required' });

  const cleanName = name.trim();
  const cleanGotra = (gotra || '').trim() || null;

  if (!supabase) {
    return res.json({
      success: true,
      user: publicUser({ phone: payload.phone, name: cleanName, gotra: cleanGotra }, payload.phone),
    });
  }

  const { data: updated, error } = await supabase
    .from('sankalp_users')
    .update({ name: cleanName, gotra: cleanGotra, updated_at: new Date().toISOString() })
    .eq('phone', payload.phone)
    .select('*')
    .single();

  if (error) return res.status(500).json({ success: false, error: 'Failed to save profile' });

  if (payload.authUserId && supabase.auth?.admin) {
    await supabase.auth.admin.updateUserById(payload.authUserId, {
      user_metadata: { full_name: cleanName, gotra: cleanGotra },
    }).catch((err) => console.error('Auth metadata update error:', err.message));
  }

  res.json({ success: true, user: publicUser(updated, payload.phone) });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const payload = verifyToken(header.replace('Bearer ', ''));
  if (!payload) return res.status(401).json({ success: false, error: 'Invalid token' });

  if (!supabase) {
    return res.json({ success: true, user: publicUser(payload, payload.phone) });
  }

  const { data: user } = await supabase
    .from('sankalp_users')
    .select('*')
    .eq('phone', payload.phone)
    .maybeSingle();

  res.json({ success: true, user: publicUser(user, payload.phone) });
});

module.exports = router;

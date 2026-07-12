const express = require('express');
const router = express.Router();
const data = require('../src/data');
const { db: supabase } = require('../src/supabase');
const { verifyToken } = require('../src/auth');

function genRef() {
  return 'SK' + Math.floor(Math.random() * 90000 + 10000);
}

function priceToPaise(priceStr) {
  const num = parseFloat((priceStr || '0').replace(/[₹,]/g, ''));
  return Math.round(num * 100);
}

// GET /api/rituals
router.get('/rituals', (req, res) => {
  res.json({ success: true, rituals: data.RITUALS });
});

// GET /api/rituals/:key
router.get('/rituals/:key', (req, res) => {
  const ritual = data.RITUALS.find(r => r.key === req.params.key);
  if (!ritual) return res.status(404).json({ success: false, error: 'Ritual not found' });
  res.json({ success: true, ritual });
});

// GET /api/slots?date=YYYY-MM-DD
router.get('/slots', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  res.json({ success: true, date, slots: data.SLOTS });
});

// POST /api/bookings  (pre-payment / unverified — real booking comes from /api/payment/verify)
router.post('/bookings', async (req, res) => {
  const { ritual, ritualKey, moment, date, slot, price } = req.body;

  if (!ritual || !moment || !date || !slot) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const bookingRef = genRef();
  const pandit = { name: 'Pandit Sharma', rating: 4.9, location: 'Haridwar', years: 12 };
  const booking = {
    id: bookingRef, ritual, ritualKey: ritualKey || '', moment, date, slot, price,
    status: 'confirmed', pandit, createdAt: new Date().toISOString(),
  };

  // Persist if Supabase is configured
  if (supabase) {
    const userPhone = (() => {
      try {
        const h = req.headers.authorization;
        if (h) { const p = verifyToken(h.slice(7)); return p ? p.phone : null; }
      } catch { return null; }
    })();

    const { error } = await supabase.from('sankalp_bookings').insert({
      booking_ref: bookingRef, ritual_key: ritualKey || '', ritual_name: ritual,
      moment, booking_date: date, slot, price_display: price || '',
      price_paise: priceToPaise(price), user_phone: userPhone,
      pandit_name: pandit.name, pandit_rating: pandit.rating,
      pandit_location: pandit.location, pandit_years: pandit.years,
    });
    if (error) console.error('Supabase insert error:', error.message);
  }

  res.status(201).json({ success: true, booking });
});

// GET /api/bookings — returns user's real bookings if authed, else mock
router.get('/bookings', async (req, res) => {
  const header = req.headers.authorization;
  if (header && supabase) {
    const payload = verifyToken(header.replace('Bearer ', ''));
    if (payload && payload.phone) {
      const { data: rows } = await supabase
        .from('sankalp_bookings')
        .select('*')
        .eq('user_phone', payload.phone)
        .order('created_at', { ascending: false });

      if (rows && rows.length > 0) {
        const now = new Date();
        const upcoming = rows.filter(b => new Date(b.booking_date) >= now && b.status !== 'cancelled');
        const past     = rows.filter(b => new Date(b.booking_date) <  now || b.status === 'completed');
        return res.json({ success: true, bookings: { upcoming, past } });
      }
    }
  }
  res.json({ success: true, bookings: data.MOCK_BOOKINGS });
});

// GET /api/bookings/:ref
router.get('/bookings/:ref', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });

  const { data: booking, error } = await supabase
    .from('sankalp_bookings')
    .select('*')
    .eq('booking_ref', req.params.ref.toUpperCase())
    .single();

  if (error || !booking) return res.status(404).json({ success: false, error: 'Booking not found' });
  res.json({ success: true, booking });
});

module.exports = router;

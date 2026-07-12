const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { db: supabase } = require('../src/supabase');
const { authMiddleware } = require('../src/auth');

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// POST /api/payment/create-order
router.post('/create-order', authMiddleware, async (req, res) => {
  const { amountPaise, bookingMeta } = req.body;
  if (!amountPaise) return res.status(400).json({ success: false, error: 'Amount required' });

  if (!razorpay) {
    return res.json({
      success: true,
      order: { id: 'order_dev_' + Date.now(), amount: amountPaise, currency: 'INR', key: 'rzp_test_placeholder' },
    });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amountPaise),
      currency: 'INR',
      receipt: 'SK' + Math.floor(Math.random() * 90000 + 10000),
      notes: bookingMeta || {},
    });
    res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID },
    });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ success: false, error: 'Payment initiation failed' });
  }
});

// POST /api/payment/verify
router.post('/verify', authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Missing payment fields' });
  }

  // Verify HMAC signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keySecret) {
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }
  }

  const bookingRef = 'SK' + Math.floor(Math.random() * 90000 + 10000);

  if (supabase && bookingData) {
    const { error } = await supabase.from('sankalp_bookings').insert({
      booking_ref:      bookingRef,
      ritual_key:       bookingData.ritualKey || '',
      ritual_name:      bookingData.ritual,
      moment:           bookingData.moment,
      booking_date:     bookingData.date,
      slot:             bookingData.slot,
      price_display:    bookingData.price || '',
      price_paise:      Math.round(bookingData.amountPaise || 0),
      status:           'confirmed',
      user_phone:       req.user.phone,
      payment_id:       razorpay_payment_id,
      razorpay_order_id,
    });
    if (error) console.error('Booking insert error:', error.message);
  }

  res.json({ success: true, bookingRef, paymentId: razorpay_payment_id });
});

module.exports = router;

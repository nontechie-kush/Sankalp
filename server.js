require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ── security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://cdn.razorpay.com'],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://sfzkwrrxjcdkwxakbcdz.supabase.co',
        'wss://sfzkwrrxjcdkwxakbcdz.supabase.co',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.razorpay.com',
        'https://checkout.razorpay.com',
        'https://cdn.razorpay.com',
      ],
      frameSrc:   ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
    },
  },
}));

// ── middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const supabaseUrl = process.env.SUPABASE_URL || 'https://sfzkwrrxjcdkwxakbcdz.supabase.co';
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_FatQFY7WEibd2GGrk0-HAA_oCgDIbKo';

async function proxyPaymentFunction(functionName, req, res) {
  const authorization = req.get('authorization');
  if (!authorization) {
    return res.status(401).json({ error: 'Sign in before paying.' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        authorization,
        apikey: supabasePublishableKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body || {}),
    });
    const text = await response.text();
    res.status(response.status);
    res.type(response.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch (error) {
    console.error(`Payment proxy failed for ${functionName}`, error);
    return res.status(502).json({ error: 'Payment service could not be reached.' });
  }
}

// ── routes ────────────────────────────────────────────────────────────────────
app.post('/api/payments/create-order', (req, res) =>
  proxyPaymentFunction('razorpay-create-order', req, res)
);
app.post('/api/payments/verify', (req, res) =>
  proxyPaymentFunction('razorpay-verify-payment', req, res)
);

app.use('/', require('./routes/index'));
// API writes now go directly to Supabase Auth/RPC/Edge Functions from the client.
// The older Express API routes are intentionally not mounted to avoid maintaining
// a second backend contract.

// ── SPA catch-all (React Router) ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🔥 Sankalp running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;

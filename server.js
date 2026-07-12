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

// ── routes ────────────────────────────────────────────────────────────────────
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

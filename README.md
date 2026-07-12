# 🔥 Sankalp — rituals, sorted

A Hindu ritual booking app built with Node.js, Express, Vite and React.

## What it does

Book a ritual on your phone. A verified pandit performs it at an auspicious time. The video and certificate come back to you — on the app and WhatsApp.

## Four rituals

- **Raksha Kavach** — Protection shield (from ₹199)
- **Dhan Aagman** — Wealth & fortune (from ₹351)
- **Prem Setu** — For the heart (from ₹251)
- **Nazar Badha** — Clear the evil eye (from ₹199)

## Getting started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & run

```bash
# Install dependencies
npm install

# Start (production)
npm start

# Start (development with auto-reload)
npm run dev
```

The app runs at **http://localhost:3000**

## Project structure

```
sankalp-app/
├── server.js           # Express server entry point
├── package.json
├── .env.example        # Environment variable template
├── routes/
│   ├── index.js        # Page routes (SPA shell)
│   └── api.js          # REST API endpoints
├── src/
│   └── data.js         # Ritual & booking data (replace with DB in prod)
└── public/
    ├── index.html      # Single-page app shell
    ├── 404.html        # Not found page
    ├── css/
    │   └── main.css    # All styles
    └── js/
        └── app.js      # All UI logic
```

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rituals` | All 4 rituals with moments |
| GET | `/api/rituals/:key` | Single ritual (`rk`, `da`, `ps`, `nb`) |
| GET | `/api/slots?date=YYYY-MM-DD` | Available time slots |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | List user's bookings |

### POST /api/bookings example

```json
{
  "ritual": "Raksha Kavach",
  "moment": "Exam day",
  "date": "2026-06-27",
  "slot": "11:54",
  "price": "₹251"
}
```

## Screens

1. **Home** — Banner carousel, browse by moment, how it works, people ticker, FAQ
2. **Rituals** — All 4 rituals with full moment lists, filter chips
3. **Time selection** — Calendar + auspicious slot picker
4. **Payment** — UPI / Card / Netbanking
5. **Confirmation** — Animated tick, order summary
6. **Booking page** — Live countdown, status timeline, pandit card, certificate
7. **Bookings** — Upcoming (countdown) + Past (video + certificate + rebook)
8. **You / Profile** — Account info, points, preferences, toggles

## OTP / Twilio setup

Phone OTP uses Supabase Auth. Configure Twilio Verify inside Supabase:

1. Supabase Dashboard → Authentication → Providers → Phone.
2. Enable Phone provider.
3. Select Twilio Verify and add Twilio Account SID, Auth Token and Verify Service SID.
4. Set these app env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`

The app never stores Twilio credentials directly.

## Production roadmap

- [ ] Connect Razorpay for payments
- [ ] Connect WhatsApp Business API for video delivery
- [x] Add Supabase/Twilio phone OTP for user accounts
- [x] Add Supabase for bookings & user profiles
- [ ] Add pandit admin panel for ritual management
- [ ] Build video upload + certificate PDF generation

## Built with

- Node.js + Express
- React + Vite
- Google Fonts (Fraunces + Plus Jakarta Sans)
- SVG illustrations (custom drawn)

---

Made with ❤️ by Sankalp

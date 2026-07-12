# Sankalp

Mobile web ritual booking app.

## Current architecture

- Frontend: React + Vite, built into `public/`
- Runtime server: Express static SPA server only
- Backend: Supabase Auth, Postgres RPCs, Row Level Security, and Edge Functions
- OTP: Supabase Phone Auth configured with Twilio Verify inside Supabase
- Payments: Razorpay via Supabase Edge Functions

The Express REST backend from Mohit's handoff is intentionally not mounted. The app should not create bookings, OTPs, users, or payments through local Express routes.

## Local setup

```bash
npm install
npm run build
npm start
```

App runs at `http://localhost:3000`.

## Frontend env

Use publishable Supabase values only:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX # optional GA4 analytics
```

The current client also contains a fallback to the known Sankalp Supabase project so local smoke tests work without env vars.

## Analytics

GA4 is wired through `VITE_GA_MEASUREMENT_ID`. If this env var is not set, the app still pushes events to `window.dataLayer` but does not load Google Analytics.

Tracked events include:

- `page_view`
- `hero_cta_clicked`
- `ritual_card_clicked`
- `moment_selected`
- `booking_flow_started`
- `checkout_slot_selected`
- `otp_sent`, `otp_verified`, and failure variants
- standalone sign-in OTP/profile events
- `booking_created`
- `payment_checkout_opened`, `payment_success`, and failure/dismiss variants
- `booking_confirmed_viewed`

Do not send phone numbers, names, OTPs, or payment IDs in analytics events.

## Supabase backend

Versioned backend files are in:

- `supabase/migrations/`
- `supabase/functions/razorpay-create-order`
- `supabase/functions/razorpay-verify-payment`
- `supabase/functions/place-autocomplete`

Before production deployment, apply the migrations to the target Supabase project and deploy the Edge Functions.

Razorpay secrets belong in Supabase Edge Function secrets:

```bash
supabase secrets set RAZORPAY_KEY_ID=...
supabase secrets set RAZORPAY_KEY_SECRET=...
```

## Validation

```bash
npm run build
node -e "require('./server'); console.log('server import ok')"
```

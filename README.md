# Sankalp mobile web

React mobile-web booking flow backed by Supabase and deployable on Vercel. The visual system and user flow are reconstructed from the existing Sankalp deployment, while the source code and database migrations are now version controlled.

## Included flow

- Supabase-powered ritual catalogue, banners, use cases, slots, and FAQs
- Ritual and intent selection
- Mumbai-time fulfilment policy: before 2 PM is expected the same day unless inauspicious; all other bookings are performed by the next day
- Internal Supabase slot assignment without exposing muhurat selection to customers
- Development phone verification using OTP `1234`
- Mock payment
- Booking confirmation and status timeline
- Row-level security for public catalogue data
- Security-definer RPCs for private lead, OTP, and booking records

## Local development

Node.js 24 LTS is recommended.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The repository defaults to the existing Supabase project's browser-safe publishable key, so the app also runs without `.env.local`. Never add a secret or service-role key to a `VITE_` variable.

## Validation

```bash
npm run check
npm test
npm run test:e2e
npm run build
```

The end-to-end test reads the live catalogue and stops before creating an OTP or booking.

## Supabase

The reproducible schema and seed data are under `supabase/migrations`.

For a new local Supabase stack:

```bash
npx supabase start
npx supabase db reset
```

For the existing hosted project, authenticate and link it first:

```bash
npx supabase login
npx supabase link --project-ref sfzkwrrxjcdkwxakbcdz
npx supabase db pull
```

Review the pulled schema against the reconstructed migrations before running `npx supabase db push`. The hosted project predates this Git repository and may contain additional tables or policies that must be preserved.

The current OTP and payment functions are explicitly Phase 1 implementations. Before handling real customers:

- Replace the returned development OTP with an SMS provider.
- Replace mock payment with a signed server-side payment flow and webhook verification.
- Add an authenticated customer session or signed booking-access token instead of treating a lead UUID as the booking capability.

## Vercel

After signing into the Vercel account that owns the current project:

1. Import `nontechie-kush/Sankalp` into the existing Vercel project, or connect it under **Project settings → Git**.
2. Keep framework preset **Vite**, build command `npm run build`, and output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using `.env.example` as the reference.
4. Deploy the `main` branch.

Alternatively, use `npx vercel login`, `npx vercel link`, and `npx vercel --prod` after the Git repository has been pushed.

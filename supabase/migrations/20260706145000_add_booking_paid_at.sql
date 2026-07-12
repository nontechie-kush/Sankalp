alter table public.mweb_bookings
  add column if not exists paid_at timestamptz;

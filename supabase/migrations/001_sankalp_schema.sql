-- Sankalp — Database Schema
-- Run this in your Supabase SQL editor (same project as Trinetra Aroma)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reuse updated_at trigger function (already exists from Trinetra, safe to replace)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sankalp_bookings (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref       VARCHAR(20) UNIQUE NOT NULL,          -- e.g. SK24817
  ritual_key        VARCHAR(10) NOT NULL,                 -- rk | da | ps | nb
  ritual_name       VARCHAR(255) NOT NULL,
  moment            VARCHAR(255) NOT NULL,
  booking_date      DATE        NOT NULL,
  slot              VARCHAR(10) NOT NULL,                 -- e.g. 11:54
  price_display     VARCHAR(20) NOT NULL,                 -- e.g. ₹251
  price_paise       INTEGER     NOT NULL,                 -- 25100
  status            VARCHAR(50) NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('pending','confirmed','completed','cancelled')),
  pandit_name       VARCHAR(255) NOT NULL DEFAULT 'Pandit Sharma',
  pandit_rating     DECIMAL(3,1) NOT NULL DEFAULT 4.9,
  pandit_location   VARCHAR(255) NOT NULL DEFAULT 'Haridwar',
  pandit_years      INTEGER     NOT NULL DEFAULT 12,
  user_phone        VARCHAR(20),                          -- set in Step 3 (OTP auth)
  payment_id        VARCHAR(255),                         -- Razorpay payment ID (Step 4)
  razorpay_order_id VARCHAR(255),                         -- Razorpay order ID  (Step 4)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sankalp_bookings_ref      ON sankalp_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_sankalp_bookings_phone    ON sankalp_bookings(user_phone);
CREATE INDEX IF NOT EXISTS idx_sankalp_bookings_status   ON sankalp_bookings(status);
CREATE INDEX IF NOT EXISTS idx_sankalp_bookings_date     ON sankalp_bookings(booking_date);

-- updated_at trigger
CREATE TRIGGER update_sankalp_bookings_updated_at
  BEFORE UPDATE ON sankalp_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE sankalp_bookings ENABLE ROW LEVEL SECURITY;

-- Pre-auth phase: open insert/select for service role (server only)
-- Tightened in Step 3 when phone OTP auth is added
CREATE POLICY "Service role full access" ON sankalp_bookings
  USING (true)
  WITH CHECK (true);

COMMIT;

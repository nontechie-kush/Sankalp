-- Sankalp — Migration 002: Users
BEGIN;

-- ── Users (phone-based) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sankalp_users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(20) UNIQUE NOT NULL,
  name          VARCHAR(255),
  gotra         VARCHAR(255),
  ritual_points INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sankalp_users_phone ON sankalp_users(phone);

CREATE TRIGGER update_sankalp_users_updated_at
  BEFORE UPDATE ON sankalp_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sankalp_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on users" ON sankalp_users USING (true) WITH CHECK (true);

-- OTPs are handled by Supabase Auth Phone provider.
-- Twilio Verify credentials are configured in Supabase, not in this app.

-- ── Link bookings → users ─────────────────────────────────────────────────────
ALTER TABLE sankalp_bookings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES sankalp_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sankalp_bookings_user_id ON sankalp_bookings(user_id);

COMMIT;

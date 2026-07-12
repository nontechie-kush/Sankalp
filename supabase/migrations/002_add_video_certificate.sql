-- Add video and certificate URL columns to sankalp_bookings
-- Run in Supabase SQL editor

ALTER TABLE sankalp_bookings
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT;

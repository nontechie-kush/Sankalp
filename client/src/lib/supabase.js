import { createClient } from '@supabase/supabase-js';

// Publishable keys are safe in browser code. RLS/RPC policies protect data access.
const fallbackUrl = 'https://sfzkwrrxjcdkwxakbcdz.supabase.co';
const fallbackPublishableKey = 'sb_publishable_FatQFY7WEibd2GGrk0-HAA_oCgDIbKo';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || fallbackUrl,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackPublishableKey,
);

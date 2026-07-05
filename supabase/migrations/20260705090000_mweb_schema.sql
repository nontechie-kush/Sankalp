create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rituals (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid,
  title text not null,
  slug text not null unique,
  description text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  price_note text,
  supported_modes text[] not null default '{}',
  deliverables text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  is_trending boolean not null default false,
  trending_rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  subtitle text,
  short_description text,
  hero_title text,
  ritual_type text,
  starting_price_minor integer not null default 0 check (starting_price_minor >= 0),
  currency text not null default 'INR',
  tags text[] not null default '{}',
  inclusions text[] not null default '{}',
  preparation_steps text[] not null default '{}',
  image_url text,
  requires_address boolean not null default false,
  estimated_start_minutes integer
);

create table if not exists public.mweb_home_banners (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references public.rituals(id) on delete cascade,
  badge text not null,
  title text not null,
  subtitle text not null,
  visual_tone text not null default 'clay' check (visual_tone in ('clay', 'gold', 'green', 'blue')),
  display_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mweb_ritual_use_cases (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references public.rituals(id) on delete cascade,
  group_label text not null,
  icon_name text not null default 'sparkles',
  title text not null,
  subtitle text not null,
  price_minor integer not null check (price_minor >= 0),
  currency text not null default 'INR',
  is_popular boolean not null default false,
  display_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mweb_time_slots (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid references public.rituals(id) on delete cascade,
  slot_date date not null,
  slot_time time not null,
  label text,
  is_auspicious boolean not null default false,
  capacity integer not null default 1 check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0 and booked_count <= capacity),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ritual_id, slot_date, slot_time)
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'mweb',
  display_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mweb_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create index if not exists mweb_otp_challenges_phone_created_idx
  on public.mweb_otp_challenges (phone, created_at desc);

create table if not exists public.mweb_leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  phone_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mweb_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  lead_id uuid not null references public.mweb_leads(id),
  ritual_id uuid not null references public.rituals(id),
  use_case_id uuid references public.mweb_ritual_use_cases(id),
  slot_id uuid references public.mweb_time_slots(id),
  customer_name text not null,
  intent_note text,
  preferred_date date not null,
  preferred_time time not null,
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'INR',
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment',
      'pending_assignment',
      'pandit_assigned',
      'ritual_scheduled',
      'completed',
      'cancelled'
    )
  ),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mweb_bookings_lead_created_idx
  on public.mweb_bookings (lead_id, created_at desc);

alter table public.rituals enable row level security;
alter table public.mweb_home_banners enable row level security;
alter table public.mweb_ritual_use_cases enable row level security;
alter table public.mweb_time_slots enable row level security;
alter table public.faqs enable row level security;
alter table public.mweb_otp_challenges enable row level security;
alter table public.mweb_leads enable row level security;
alter table public.mweb_bookings enable row level security;

drop policy if exists "Public can read active rituals" on public.rituals;
create policy "Public can read active rituals"
  on public.rituals for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Public can read active mweb banners" on public.mweb_home_banners;
create policy "Public can read active mweb banners"
  on public.mweb_home_banners for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Public can read active mweb use cases" on public.mweb_ritual_use_cases;
create policy "Public can read active mweb use cases"
  on public.mweb_ritual_use_cases for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Public can read open mweb slots" on public.mweb_time_slots;
create policy "Public can read open mweb slots"
  on public.mweb_time_slots for select
  to anon, authenticated
  using (status = 'open');

drop policy if exists "Public can read active faqs" on public.faqs;
create policy "Public can read active faqs"
  on public.faqs for select
  to anon, authenticated
  using (status = 'active');

grant select on public.rituals to anon, authenticated;
grant select on public.mweb_home_banners to anon, authenticated;
grant select on public.mweb_ritual_use_cases to anon, authenticated;
grant select on public.mweb_time_slots to anon, authenticated;
grant select on public.faqs to anon, authenticated;

revoke all on public.mweb_otp_challenges from anon, authenticated;
revoke all on public.mweb_leads from anon, authenticated;
revoke all on public.mweb_bookings from anon, authenticated;

create or replace function public.normalize_mweb_phone(raw_phone text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g');
begin
  if length(digits) = 10 then
    return '+91' || digits;
  end if;

  if length(digits) = 12 and digits like '91%' then
    return '+' || digits;
  end if;

  if length(digits) between 11 and 15 then
    return '+' || digits;
  end if;

  raise exception 'Enter a valid mobile number.' using errcode = '22023';
end;
$$;

create or replace function public.request_mweb_otp(raw_phone text)
returns table (challenge_id uuid, phone text, dev_otp text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_phone text := public.normalize_mweb_phone(raw_phone);
  new_challenge_id uuid;
  challenge_expiry timestamptz := now() + interval '10 minutes';
begin
  if (
    select count(*)
    from public.mweb_otp_challenges challenge
    where challenge.phone = normalized_phone
      and challenge.created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Too many OTP requests. Try again in 10 minutes.' using errcode = 'P0001';
  end if;

  insert into public.mweb_otp_challenges (phone, code_hash, expires_at)
  values (normalized_phone, extensions.crypt('1234', extensions.gen_salt('bf')), challenge_expiry)
  returning id into new_challenge_id;

  return query select new_challenge_id, normalized_phone, '1234'::text, challenge_expiry;
end;
$$;

create or replace function public.verify_mweb_otp(
  challenge_id uuid,
  raw_phone text,
  code text,
  lead_name text default null
)
returns table (lead_id uuid, phone text, name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_phone text := public.normalize_mweb_phone(raw_phone);
  matched_challenge public.mweb_otp_challenges%rowtype;
  verified_lead public.mweb_leads%rowtype;
begin
  select challenge.*
    into matched_challenge
  from public.mweb_otp_challenges challenge
  where challenge.id = challenge_id
    and challenge.phone = normalized_phone
  for update;

  if matched_challenge.id is null
    or matched_challenge.verified_at is not null
    or matched_challenge.expires_at <= now()
    or matched_challenge.attempts >= 5 then
    raise exception 'This OTP challenge is no longer valid.' using errcode = 'P0001';
  end if;

  if extensions.crypt(code, matched_challenge.code_hash) <> matched_challenge.code_hash then
    update public.mweb_otp_challenges
      set attempts = attempts + 1
    where id = matched_challenge.id;
    raise exception 'The OTP is incorrect.' using errcode = 'P0001';
  end if;

  update public.mweb_otp_challenges
    set verified_at = now()
  where id = matched_challenge.id;

  insert into public.mweb_leads (phone, name, phone_verified_at)
  values (normalized_phone, nullif(trim(lead_name), ''), now())
  on conflict (phone) do update
    set name = coalesce(excluded.name, public.mweb_leads.name),
        phone_verified_at = excluded.phone_verified_at,
        updated_at = now()
  returning * into verified_lead;

  return query select verified_lead.id, verified_lead.phone, verified_lead.name;
end;
$$;

create or replace function public.create_mweb_booking(
  p_lead_id uuid,
  p_ritual_id uuid,
  p_use_case_id uuid default null,
  p_slot_id uuid default null,
  p_customer_name text default 'Sankalp customer',
  p_intent_note text default null
)
returns table (booking_id uuid, booking_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_use_case public.mweb_ritual_use_cases%rowtype;
  chosen_slot public.mweb_time_slots%rowtype;
  new_booking_id uuid := gen_random_uuid();
  new_booking_number text := 'SKP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
begin
  if not exists (
    select 1 from public.mweb_leads lead
    where lead.id = p_lead_id and lead.phone_verified_at > now() - interval '24 hours'
  ) then
    raise exception 'Verify your phone before creating a booking.' using errcode = 'P0001';
  end if;

  select use_case.* into chosen_use_case
  from public.mweb_ritual_use_cases use_case
  where use_case.id = p_use_case_id
    and use_case.ritual_id = p_ritual_id
    and use_case.status = 'active';

  if chosen_use_case.id is null then
    raise exception 'The selected ritual intent is unavailable.' using errcode = 'P0001';
  end if;

  select slot.* into chosen_slot
  from public.mweb_time_slots slot
  where slot.id = p_slot_id
    and (slot.ritual_id = p_ritual_id or slot.ritual_id is null)
    and slot.status = 'open'
    and slot.slot_date >= current_date
  for update;

  if chosen_slot.id is null or chosen_slot.booked_count >= chosen_slot.capacity then
    raise exception 'The selected time slot is no longer available.' using errcode = 'P0001';
  end if;

  update public.mweb_time_slots
    set booked_count = booked_count + 1,
        updated_at = now()
  where id = chosen_slot.id;

  insert into public.mweb_bookings (
    id,
    booking_number,
    lead_id,
    ritual_id,
    use_case_id,
    slot_id,
    customer_name,
    intent_note,
    preferred_date,
    preferred_time,
    amount_minor,
    currency
  ) values (
    new_booking_id,
    new_booking_number,
    p_lead_id,
    p_ritual_id,
    chosen_use_case.id,
    chosen_slot.id,
    coalesce(nullif(trim(p_customer_name), ''), 'Sankalp customer'),
    nullif(trim(p_intent_note), ''),
    chosen_slot.slot_date,
    chosen_slot.slot_time,
    chosen_use_case.price_minor,
    chosen_use_case.currency
  );

  return query select new_booking_id, new_booking_number;
end;
$$;

create or replace function public.mock_pay_mweb_booking(p_lead_id uuid, p_booking_id uuid)
returns table (booking_id uuid, status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mweb_bookings booking
    set status = 'pending_assignment',
        paid_at = now(),
        updated_at = now()
  where booking.id = p_booking_id
    and booking.lead_id = p_lead_id
    and booking.status = 'pending_payment';

  if not found then
    raise exception 'The booking could not be paid.' using errcode = 'P0001';
  end if;

  return query select p_booking_id, 'pending_assignment'::text;
end;
$$;

create or replace function public.get_mweb_booking(p_lead_id uuid, p_booking_id uuid)
returns table (
  booking_id uuid,
  booking_number text,
  ritual_title text,
  use_case_title text,
  preferred_date date,
  preferred_time time,
  amount_minor integer,
  currency text,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    booking.id,
    booking.booking_number,
    ritual.title,
    use_case.title,
    booking.preferred_date,
    booking.preferred_time,
    booking.amount_minor,
    booking.currency,
    booking.status
  from public.mweb_bookings booking
  join public.rituals ritual on ritual.id = booking.ritual_id
  left join public.mweb_ritual_use_cases use_case on use_case.id = booking.use_case_id
  where booking.id = p_booking_id
    and booking.lead_id = p_lead_id;
$$;

revoke all on function public.normalize_mweb_phone(text) from public;
revoke all on function public.request_mweb_otp(text) from public;
revoke all on function public.verify_mweb_otp(uuid, text, text, text) from public;
revoke all on function public.create_mweb_booking(uuid, uuid, uuid, uuid, text, text) from public;
revoke all on function public.mock_pay_mweb_booking(uuid, uuid) from public;
revoke all on function public.get_mweb_booking(uuid, uuid) from public;

grant execute on function public.request_mweb_otp(text) to anon, authenticated;
grant execute on function public.verify_mweb_otp(uuid, text, text, text) to anon, authenticated;
grant execute on function public.create_mweb_booking(uuid, uuid, uuid, uuid, text, text) to anon, authenticated;
grant execute on function public.mock_pay_mweb_booking(uuid, uuid) to anon, authenticated;
grant execute on function public.get_mweb_booking(uuid, uuid) to anon, authenticated;

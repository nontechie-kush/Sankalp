alter table public.mweb_leads
  add column if not exists gotra text,
  add column if not exists sankalp_location text;

alter table public.mweb_bookings
  add column if not exists customer_gotra text,
  add column if not exists customer_location text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.mweb_bookings booking
set customer_gotra = coalesce(booking.customer_gotra, nullif(trim(lead.gotra), '')),
    customer_location = coalesce(booking.customer_location, nullif(trim(lead.sankalp_location), '')),
    metadata = coalesce(booking.metadata, '{}'::jsonb) ||
      jsonb_strip_nulls(jsonb_build_object(
        'customer_gotra', coalesce(booking.customer_gotra, nullif(trim(lead.gotra), '')),
        'sankalp_location', coalesce(booking.customer_location, nullif(trim(lead.sankalp_location), ''))
      )),
    updated_at = now()
from public.mweb_leads lead
where lead.id = booking.lead_id
  and (
    booking.customer_gotra is null
    or booking.customer_location is null
  );

drop function if exists public.get_my_mweb_profile();

create function public.get_my_mweb_profile()
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  gotra text,
  sankalp_location text,
  date_of_birth date,
  place_of_birth text,
  place_of_birth_id text,
  place_of_birth_provider text,
  profile_completed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    lead.user_id,
    lead.id,
    lead.phone,
    lead.name,
    lead.gotra,
    lead.sankalp_location,
    lead.date_of_birth,
    lead.place_of_birth,
    lead.place_of_birth_id,
    lead.place_of_birth_provider,
    lead.profile_completed_at
  from public.mweb_leads lead
  where auth.uid() is not null
    and lead.user_id = auth.uid()
  limit 1;
$$;

drop function if exists public.update_my_mweb_profile_v2(text, date, text, text, text, boolean);

create function public.update_my_mweb_profile_v2(
  p_name text,
  p_date_of_birth date default null,
  p_place_of_birth text default null,
  p_place_of_birth_id text default null,
  p_place_of_birth_provider text default null,
  p_complete boolean default false,
  p_gotra text default null,
  p_sankalp_location text default null
)
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  gotra text,
  sankalp_location text,
  date_of_birth date,
  place_of_birth text,
  place_of_birth_id text,
  place_of_birth_provider text,
  profile_completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.mweb_leads%rowtype;
  clean_name text := nullif(trim(p_name), '');
  clean_gotra text := nullif(trim(p_gotra), '');
  clean_sankalp_location text := nullif(trim(p_sankalp_location), '');
  clean_place text := nullif(trim(p_place_of_birth), '');
  clean_place_id text := nullif(trim(p_place_of_birth_id), '');
  clean_provider text := nullif(trim(p_place_of_birth_provider), '');
begin
  if auth.uid() is null then
    raise exception 'Sign in before updating your profile.' using errcode = '42501';
  end if;

  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Enter your full name.' using errcode = '22023';
  end if;

  if clean_gotra is not null and char_length(clean_gotra) > 80 then
    raise exception 'Gotra is too long.' using errcode = '22023';
  end if;

  if clean_sankalp_location is not null and char_length(clean_sankalp_location) > 160 then
    raise exception 'Location is too long.' using errcode = '22023';
  end if;

  if p_date_of_birth is not null and (
    p_date_of_birth > current_date or
    p_date_of_birth < current_date - interval '120 years'
  ) then
    raise exception 'Enter a valid date of birth.' using errcode = '22023';
  end if;

  if clean_place is not null and char_length(clean_place) > 160 then
    raise exception 'Place of birth is too long.' using errcode = '22023';
  end if;

  if clean_place is not null and (
    clean_provider not in ('google', 'legacy') or
    (clean_provider = 'google' and clean_place_id is null)
  ) then
    raise exception 'Choose a place from the suggestions.' using errcode = '22023';
  end if;

  update public.mweb_leads lead
  set name = clean_name,
      gotra = clean_gotra,
      sankalp_location = clean_sankalp_location,
      date_of_birth = p_date_of_birth,
      place_of_birth = clean_place,
      place_of_birth_id = case when clean_place is null then null else clean_place_id end,
      place_of_birth_provider = case when clean_place is null then null else clean_provider end,
      profile_completed_at = case
        when p_complete then coalesce(lead.profile_completed_at, now())
        else lead.profile_completed_at
      end,
      updated_at = now()
  where lead.user_id = auth.uid()
  returning lead.* into updated_profile;

  if updated_profile.id is null then
    raise exception 'Complete phone verification before updating your profile.' using errcode = '42501';
  end if;

  return query select
    updated_profile.user_id,
    updated_profile.id,
    updated_profile.phone,
    updated_profile.name,
    updated_profile.gotra,
    updated_profile.sankalp_location,
    updated_profile.date_of_birth,
    updated_profile.place_of_birth,
    updated_profile.place_of_birth_id,
    updated_profile.place_of_birth_provider,
    updated_profile.profile_completed_at;
end;
$$;

drop function if exists public.update_my_mweb_profile(text, date, text, boolean);

create function public.update_my_mweb_profile(
  p_name text,
  p_date_of_birth date default null,
  p_place_of_birth text default null,
  p_complete boolean default false
)
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  date_of_birth date,
  place_of_birth text,
  profile_completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    profile.user_id,
    profile.lead_id,
    profile.phone,
    profile.name,
    profile.date_of_birth,
    profile.place_of_birth,
    profile.profile_completed_at
  from public.update_my_mweb_profile_v2(
    p_name,
    p_date_of_birth,
    p_place_of_birth,
    null,
    case when nullif(trim(p_place_of_birth), '') is null then null else 'legacy' end,
    p_complete,
    null,
    null
  ) profile;
end;
$$;

drop function if exists public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid);

create function public.create_my_mweb_booking(
  p_ritual_id uuid,
  p_use_case_id uuid,
  p_slot_id uuid,
  p_customer_name text,
  p_intent_note text,
  p_client_request_id uuid
)
returns table (booking_id uuid, booking_number text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_lead public.mweb_leads%rowtype;
  existing_booking public.mweb_bookings%rowtype;
  created_booking record;
  booking_created_at timestamptz;
  fulfilment record;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating a booking.' using errcode = '42501';
  end if;

  select lead.* into authenticated_lead
  from public.mweb_leads lead
  where lead.user_id = auth.uid()
  limit 1;

  if authenticated_lead.id is null then
    raise exception 'Complete phone verification before creating a booking.' using errcode = '42501';
  end if;

  if p_client_request_id is null then
    raise exception 'A booking request identifier is required.' using errcode = '22023';
  end if;

  select booking.* into existing_booking
  from public.mweb_bookings booking
  where booking.lead_id = authenticated_lead.id
    and booking.client_request_id = p_client_request_id
  limit 1;

  if existing_booking.id is not null then
    return query select existing_booking.id, existing_booking.booking_number;
    return;
  end if;

  update public.mweb_leads lead
  set last_verified_at = now(),
      phone_verified_at = now(),
      updated_at = now()
  where lead.id = authenticated_lead.id;

  select * into created_booking
  from public.create_mweb_booking(
    authenticated_lead.id,
    p_ritual_id,
    p_use_case_id,
    p_slot_id,
    coalesce(nullif(trim(p_customer_name), ''), nullif(trim(authenticated_lead.name), ''), 'Sankalp customer'),
    p_intent_note
  );

  select booking.created_at into booking_created_at
  from public.mweb_bookings booking
  where booking.id = created_booking.booking_id;

  select * into fulfilment
  from public.calculate_mweb_fulfilment(booking_created_at);

  update public.mweb_bookings booking
  set client_request_id = p_client_request_id,
      customer_gotra = nullif(trim(authenticated_lead.gotra), ''),
      customer_location = nullif(trim(authenticated_lead.sankalp_location), ''),
      metadata = coalesce(booking.metadata, '{}'::jsonb) ||
        jsonb_strip_nulls(jsonb_build_object(
          'customer_gotra', nullif(trim(authenticated_lead.gotra), ''),
          'sankalp_location', nullif(trim(authenticated_lead.sankalp_location), ''),
          'profile_lead_id', authenticated_lead.id
        )),
      payment_status = case when booking.status = 'pending_payment' then 'pending' else 'paid' end,
      promised_service_date = timezone('Asia/Kolkata', fulfilment.promise_deadline)::date,
      promised_by = fulfilment.promise_deadline,
      fulfilment_delay_reason = fulfilment.delay_reason,
      inauspicious_day = fulfilment.blocked_day,
      fulfilment_rule_version = 'ist-rolling-video-v2',
      updated_at = now()
  where booking.id = created_booking.booking_id;

  return query select created_booking.booking_id, created_booking.booking_number;
end;
$$;

revoke all on function public.get_my_mweb_profile() from public, anon;
revoke all on function public.update_my_mweb_profile_v2(text, date, text, text, text, boolean, text, text) from public, anon;
revoke all on function public.update_my_mweb_profile(text, date, text, boolean) from public, anon;
revoke all on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid) from public, anon;

grant execute on function public.get_my_mweb_profile() to authenticated;
grant execute on function public.update_my_mweb_profile_v2(text, date, text, text, text, boolean, text, text) to authenticated;
grant execute on function public.update_my_mweb_profile(text, date, text, boolean) to authenticated;
grant execute on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid) to authenticated;

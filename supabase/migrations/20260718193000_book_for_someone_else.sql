alter table public.mweb_bookings
  add column if not exists metadata jsonb,
  add column if not exists booking_for text,
  add column if not exists beneficiary_name text,
  add column if not exists beneficiary_relation text,
  add column if not exists beneficiary_gotra text,
  add column if not exists beneficiary_location text;

update public.mweb_bookings booking
set metadata = coalesce(booking.metadata, '{}'::jsonb),
    booking_for = case
      when booking.booking_for in ('self', 'other') then booking.booking_for
      else 'self'
    end,
    beneficiary_name = coalesce(
      nullif(trim(booking.beneficiary_name), ''),
      nullif(trim(booking.customer_name), ''),
      'Sankalp customer'
    ),
    beneficiary_gotra = coalesce(nullif(trim(booking.beneficiary_gotra), ''), nullif(trim(booking.customer_gotra), '')),
    beneficiary_location = coalesce(nullif(trim(booking.beneficiary_location), ''), nullif(trim(booking.customer_location), '')),
    updated_at = now();

alter table public.mweb_bookings
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null,
  alter column booking_for set default 'self',
  alter column booking_for set not null,
  alter column beneficiary_name drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mweb_bookings_booking_for_check'
      and conrelid = 'public.mweb_bookings'::regclass
  ) then
    alter table public.mweb_bookings
      add constraint mweb_bookings_booking_for_check
      check (booking_for in ('self', 'other'));
  end if;
end;
$$;

drop function if exists public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid);
drop function if exists public.create_my_mweb_booking_v2(uuid, uuid, uuid, text, text, text, text, text, text, uuid, integer);

create or replace function public.create_my_mweb_booking_v2(
  p_ritual_id uuid,
  p_use_case_id uuid,
  p_slot_id uuid,
  p_booking_for text,
  p_beneficiary_name text,
  p_beneficiary_relation text,
  p_beneficiary_gotra text,
  p_beneficiary_location text,
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
  effective_slot_id uuid := p_slot_id;
  ist_today date := timezone('Asia/Kolkata', now())::date;
  clean_booking_for text := lower(nullif(trim(p_booking_for), ''));
  clean_name text := nullif(trim(p_beneficiary_name), '');
  clean_relation text := nullif(trim(p_beneficiary_relation), '');
  clean_gotra text := nullif(trim(p_beneficiary_gotra), '');
  clean_location text := nullif(trim(p_beneficiary_location), '');
  clean_intent_note text := nullif(trim(p_intent_note), '');
  payer_name text;
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

  if clean_booking_for is null then
    clean_booking_for := 'self';
  end if;

  if clean_booking_for not in ('self', 'other') then
    raise exception 'Choose who this booking is for.' using errcode = '22023';
  end if;

  if clean_booking_for = 'self' then
    clean_name := coalesce(clean_name, nullif(trim(authenticated_lead.name), ''), 'Sankalp customer');
    clean_gotra := coalesce(clean_gotra, nullif(trim(authenticated_lead.gotra), ''));
    clean_location := coalesce(clean_location, nullif(trim(authenticated_lead.sankalp_location), ''));
    clean_relation := null;
  end if;

  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Enter the name for the sankalp.' using errcode = '22023';
  end if;

  if clean_relation is not null and char_length(clean_relation) > 80 then
    raise exception 'Relation is too long.' using errcode = '22023';
  end if;

  if clean_gotra is not null and char_length(clean_gotra) > 80 then
    raise exception 'Gotra is too long.' using errcode = '22023';
  end if;

  if clean_location is not null and char_length(clean_location) > 160 then
    raise exception 'Location is too long.' using errcode = '22023';
  end if;

  payer_name := case
    when clean_booking_for = 'other' then coalesce(nullif(trim(authenticated_lead.name), ''), 'Sankalp customer')
    else coalesce(nullif(trim(authenticated_lead.name), ''), clean_name, 'Sankalp customer')
  end;

  select booking.* into existing_booking
  from public.mweb_bookings booking
  where booking.lead_id = authenticated_lead.id
    and booking.client_request_id = p_client_request_id
  limit 1;

  if existing_booking.id is not null then
    return query select existing_booking.id, existing_booking.booking_number;
    return;
  end if;

  if effective_slot_id is null then
    select slot.id into effective_slot_id
    from public.mweb_time_slots slot
    where slot.ritual_id = p_ritual_id
      and slot.status = 'open'
      and slot.slot_date >= ist_today
      and slot.booked_count < slot.capacity
    order by slot.slot_date, slot.slot_time
    limit 1;
  end if;

  if effective_slot_id is null then
    insert into public.mweb_time_slots (
      ritual_id,
      slot_date,
      slot_time,
      label,
      is_auspicious,
      capacity,
      status
    ) values (
      p_ritual_id,
      ist_today,
      time '08:00',
      'Digital fulfilment',
      false,
      1000,
      'open'
    )
    on conflict (ritual_id, slot_date, slot_time)
    do update set
      status = 'open',
      capacity = greatest(public.mweb_time_slots.capacity, 1000),
      updated_at = now()
    returning id into effective_slot_id;
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
    effective_slot_id,
    payer_name,
    clean_intent_note
  );

  select booking.created_at into booking_created_at
  from public.mweb_bookings booking
  where booking.id = created_booking.booking_id;

  select * into fulfilment
  from public.calculate_mweb_fulfilment(booking_created_at);

  update public.mweb_bookings booking
  set client_request_id = p_client_request_id,
      booking_for = clean_booking_for,
      beneficiary_name = clean_name,
      beneficiary_relation = clean_relation,
      beneficiary_gotra = clean_gotra,
      beneficiary_location = clean_location,
      customer_gotra = clean_gotra,
      customer_location = clean_location,
      metadata = coalesce(booking.metadata, '{}'::jsonb) ||
        jsonb_strip_nulls(jsonb_build_object(
          'booking_for', clean_booking_for,
          'beneficiary_name', clean_name,
          'beneficiary_relation', clean_relation,
          'beneficiary_gotra', clean_gotra,
          'beneficiary_location', clean_location,
          'payer_lead_id', authenticated_lead.id
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
begin
  return query
  select created.booking_id, created.booking_number
  from public.create_my_mweb_booking_v2(
    p_ritual_id,
    p_use_case_id,
    p_slot_id,
    'self',
    p_customer_name,
    null,
    null,
    null,
    p_intent_note,
    p_client_request_id
  ) created;
end;
$$;

drop function if exists public.list_my_mweb_bookings();
drop function if exists public.get_my_mweb_booking(uuid);

create function public.list_my_mweb_bookings()
returns table (
  booking_id uuid,
  booking_number text,
  ritual_title text,
  use_case_title text,
  preferred_date date,
  preferred_time time,
  booked_before_cutoff boolean,
  promised_service_date date,
  promised_by timestamptz,
  fulfilment_delay_reason text,
  inauspicious_day date,
  amount_minor integer,
  currency text,
  status text,
  payment_status text,
  booking_for text,
  beneficiary_name text,
  beneficiary_relation text,
  beneficiary_gotra text,
  beneficiary_location text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    booking.id,
    booking.booking_number,
    booking.ritual_title,
    booking.use_case_title,
    booking.preferred_date,
    booking.preferred_time,
    timezone('Asia/Kolkata', booking.created_at)::time <= time '14:00',
    booking.promised_service_date,
    booking.promised_by,
    booking.fulfilment_delay_reason,
    booking.inauspicious_day,
    booking.amount_minor,
    booking.currency,
    booking.status,
    booking.payment_status,
    booking.booking_for,
    booking.beneficiary_name,
    booking.beneficiary_relation,
    booking.beneficiary_gotra,
    booking.beneficiary_location,
    booking.created_at,
    booking.updated_at
  from public.mweb_bookings booking
  join public.mweb_leads lead on lead.id = booking.lead_id
  where auth.uid() is not null
    and lead.user_id = auth.uid()
  order by
    case when booking.status in (
      'pending_payment',
      'pending_assignment',
      'pandit_assigned',
      'ritual_scheduled'
    ) then 0 else 1 end,
    booking.created_at desc;
$$;

create function public.get_my_mweb_booking(p_booking_id uuid)
returns table (
  booking_id uuid,
  booking_number text,
  ritual_title text,
  use_case_title text,
  preferred_date date,
  preferred_time time,
  booked_before_cutoff boolean,
  promised_service_date date,
  promised_by timestamptz,
  fulfilment_delay_reason text,
  inauspicious_day date,
  amount_minor integer,
  currency text,
  status text,
  payment_status text,
  booking_for text,
  beneficiary_name text,
  beneficiary_relation text,
  beneficiary_gotra text,
  beneficiary_location text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    booking.id,
    booking.booking_number,
    booking.ritual_title,
    booking.use_case_title,
    booking.preferred_date,
    booking.preferred_time,
    timezone('Asia/Kolkata', booking.created_at)::time <= time '14:00',
    booking.promised_service_date,
    booking.promised_by,
    booking.fulfilment_delay_reason,
    booking.inauspicious_day,
    booking.amount_minor,
    booking.currency,
    booking.status,
    booking.payment_status,
    booking.booking_for,
    booking.beneficiary_name,
    booking.beneficiary_relation,
    booking.beneficiary_gotra,
    booking.beneficiary_location,
    booking.created_at,
    booking.updated_at
  from public.mweb_bookings booking
  join public.mweb_leads lead on lead.id = booking.lead_id
  where auth.uid() is not null
    and lead.user_id = auth.uid()
    and booking.id = p_booking_id
  limit 1;
$$;

revoke all on function public.create_my_mweb_booking_v2(uuid, uuid, uuid, text, text, text, text, text, text, uuid) from public, anon;
revoke all on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid) from public, anon;
revoke all on function public.list_my_mweb_bookings() from public, anon;
revoke all on function public.get_my_mweb_booking(uuid) from public, anon;

grant execute on function public.create_my_mweb_booking_v2(uuid, uuid, uuid, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid) to authenticated;
grant execute on function public.list_my_mweb_bookings() to authenticated;
grant execute on function public.get_my_mweb_booking(uuid) to authenticated;

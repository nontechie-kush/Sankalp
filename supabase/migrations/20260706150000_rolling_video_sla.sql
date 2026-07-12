create table if not exists public.mweb_inauspicious_days (
  day date primary key,
  reason text not null check (length(trim(reason)) >= 3),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mweb_inauspicious_days is
  'IST calendar dates when rituals cannot be performed. Configure these rows from Supabase.';

alter table public.mweb_inauspicious_days enable row level security;

drop policy if exists "Public can read active inauspicious days"
  on public.mweb_inauspicious_days;
create policy "Public can read active inauspicious days"
  on public.mweb_inauspicious_days for select
  to anon, authenticated
  using (status = 'active');

revoke all on public.mweb_inauspicious_days from public, anon, authenticated;
grant select on public.mweb_inauspicious_days to anon, authenticated;

alter table public.mweb_bookings
  add column if not exists fulfilment_delay_reason text,
  add column if not exists inauspicious_day date;

create or replace function public.calculate_mweb_fulfilment(
  p_booking_at timestamptz
)
returns table (
  promise_deadline timestamptz,
  promise_hours integer,
  delay_reason text,
  blocked_day date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_booking_day date := timezone('Asia/Kolkata', p_booking_at)::date;
  v_booking_time time := timezone('Asia/Kolkata', p_booking_at)::time;
  v_reason text;
  v_last_day date;
  v_deadline timestamptz;
  v_hours integer;
begin
  select configured.reason into v_reason
  from public.mweb_inauspicious_days configured
  where configured.day = v_booking_day
    and configured.status = 'active';

  if v_reason is not null then
    with recursive consecutive(day) as (
      select v_booking_day
      union all
      select (consecutive.day + 1)::date
      from consecutive
      where exists (
        select 1
        from public.mweb_inauspicious_days configured
        where configured.day = consecutive.day + 1
          and configured.status = 'active'
      )
    )
    select max(consecutive.day) into v_last_day
    from consecutive;

    v_deadline := ((v_last_day + 1)::timestamp at time zone 'Asia/Kolkata')
      + interval '12 hours';
    v_hours := greatest(
      1,
      ceil(extract(epoch from (v_deadline - p_booking_at)) / 3600.0)::integer
    );

    return query select v_deadline, v_hours, v_reason, v_booking_day;
    return;
  end if;

  v_hours := case when v_booking_time <= time '14:00' then 12 else 24 end;
  v_deadline := p_booking_at + make_interval(hours => v_hours);
  return query select v_deadline, v_hours, null::text, null::date;
end;
$$;

revoke all on function public.calculate_mweb_fulfilment(timestamptz)
  from public, anon, authenticated;

create or replace function public.create_my_mweb_booking(
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
  authenticated_lead_id uuid;
  existing_booking public.mweb_bookings%rowtype;
  created_booking record;
  booking_created_at timestamptz;
  fulfilment record;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating a booking.' using errcode = '42501';
  end if;

  select lead.id into authenticated_lead_id
  from public.mweb_leads lead
  where lead.user_id = auth.uid()
  limit 1;

  if authenticated_lead_id is null then
    raise exception 'Complete phone verification before creating a booking.' using errcode = '42501';
  end if;

  if p_client_request_id is null then
    raise exception 'A booking request identifier is required.' using errcode = '22023';
  end if;

  select booking.* into existing_booking
  from public.mweb_bookings booking
  where booking.lead_id = authenticated_lead_id
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
  where lead.id = authenticated_lead_id;

  select * into created_booking
  from public.create_mweb_booking(
    authenticated_lead_id,
    p_ritual_id,
    p_use_case_id,
    p_slot_id,
    coalesce(nullif(trim(p_customer_name), ''), 'Sankalp customer'),
    p_intent_note
  );

  select booking.created_at into booking_created_at
  from public.mweb_bookings booking
  where booking.id = created_booking.booking_id;

  select * into fulfilment
  from public.calculate_mweb_fulfilment(booking_created_at);

  update public.mweb_bookings booking
  set client_request_id = p_client_request_id,
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

revoke all on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid)
  from public, anon;
grant execute on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid)
  to authenticated;

with calculated as (
  select booking.id, fulfilment.*
  from public.mweb_bookings booking
  cross join lateral public.calculate_mweb_fulfilment(booking.created_at) fulfilment
  where booking.status in (
    'pending_payment',
    'pending_assignment',
    'pandit_assigned',
    'ritual_scheduled'
  )
)
update public.mweb_bookings booking
set promised_service_date = timezone('Asia/Kolkata', calculated.promise_deadline)::date,
    promised_by = calculated.promise_deadline,
    fulfilment_delay_reason = calculated.delay_reason,
    inauspicious_day = calculated.blocked_day,
    fulfilment_rule_version = 'ist-rolling-video-v2',
    updated_at = now()
from calculated
where booking.id = calculated.id;

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
    booking.created_at,
    booking.updated_at
  from public.mweb_bookings booking
  join public.mweb_leads lead on lead.id = booking.lead_id
  where auth.uid() is not null
    and lead.user_id = auth.uid()
    and booking.id = p_booking_id
  limit 1;
$$;

revoke all on function public.list_my_mweb_bookings() from public, anon;
revoke all on function public.get_my_mweb_booking(uuid) from public, anon;
grant execute on function public.list_my_mweb_bookings() to authenticated;
grant execute on function public.get_my_mweb_booking(uuid) to authenticated;

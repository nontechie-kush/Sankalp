alter table public.mweb_bookings
  add column if not exists client_request_id uuid,
  add column if not exists payment_idempotency_key uuid,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists promised_service_date date,
  add column if not exists promised_by timestamptz,
  add column if not exists fulfilment_rule_version text not null default 'mumbai-2pm-v1';

update public.mweb_bookings
set promised_service_date = coalesce(promised_service_date, preferred_date),
    promised_by = coalesce(
      promised_by,
      (preferred_date::timestamp + time '23:59:59') at time zone 'Asia/Kolkata'
    ),
    payment_status = case
      when status = 'pending_payment' then 'pending'
      when status = 'cancelled' then 'cancelled'
      else 'paid'
    end
where promised_service_date is null
   or promised_by is null
   or payment_status = 'pending';

create unique index if not exists mweb_bookings_lead_client_request_unique_idx
  on public.mweb_bookings (lead_id, client_request_id)
  where client_request_id is not null;

create or replace function public.get_my_mweb_profile()
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select lead.user_id, lead.id, lead.phone, lead.name
  from public.mweb_leads lead
  where auth.uid() is not null
    and lead.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.list_my_mweb_bookings()
returns table (
  booking_id uuid,
  booking_number text,
  ritual_title text,
  use_case_title text,
  preferred_date date,
  preferred_time time,
  promised_service_date date,
  promised_by timestamptz,
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
    booking.promised_service_date,
    booking.promised_by,
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

create or replace function public.get_my_mweb_booking(p_booking_id uuid)
returns table (
  booking_id uuid,
  booking_number text,
  ritual_title text,
  use_case_title text,
  preferred_date date,
  preferred_time time,
  promised_service_date date,
  promised_by timestamptz,
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
    booking.promised_service_date,
    booking.promised_by,
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
  local_now timestamp := timezone('Asia/Kolkata', now());
  promise_date date;
  promise_deadline timestamptz;
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

  promise_date := case
    when local_now::time < time '14:00' then local_now::date
    else local_now::date + 1
  end;
  promise_deadline := (promise_date::timestamp + time '23:59:59') at time zone 'Asia/Kolkata';

  select * into created_booking
  from public.create_mweb_booking(
    authenticated_lead_id,
    p_ritual_id,
    p_use_case_id,
    p_slot_id,
    coalesce(nullif(trim(p_customer_name), ''), 'Sankalp customer'),
    p_intent_note
  );

  update public.mweb_bookings booking
  set client_request_id = p_client_request_id,
      payment_status = case when booking.status = 'pending_payment' then 'pending' else 'paid' end,
      promised_service_date = promise_date,
      promised_by = promise_deadline,
      fulfilment_rule_version = 'mumbai-2pm-v1',
      updated_at = now()
  where booking.id = created_booking.booking_id;

  return query select created_booking.booking_id, created_booking.booking_number;
end;
$$;

create or replace function public.pay_my_mweb_booking(
  p_booking_id uuid,
  p_idempotency_key uuid
)
returns table (booking_id uuid, status text, payment_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_lead_id uuid;
  owned_booking public.mweb_bookings%rowtype;
  paid_booking record;
begin
  if auth.uid() is null then
    raise exception 'Sign in before completing payment.' using errcode = '42501';
  end if;

  if p_idempotency_key is null then
    raise exception 'A payment request identifier is required.' using errcode = '22023';
  end if;

  select lead.id into authenticated_lead_id
  from public.mweb_leads lead
  where lead.user_id = auth.uid()
  limit 1;

  select booking.* into owned_booking
  from public.mweb_bookings booking
  where booking.id = p_booking_id
    and booking.lead_id = authenticated_lead_id
  for update;

  if owned_booking.id is null then
    raise exception 'This booking does not belong to your account.' using errcode = '42501';
  end if;

  if owned_booking.status <> 'pending_payment' then
    return query select owned_booking.id, owned_booking.status, owned_booking.payment_status;
    return;
  end if;

  if owned_booking.payment_status = 'paid' then
    return query select owned_booking.id, owned_booking.status, owned_booking.payment_status;
    return;
  end if;

  select * into paid_booking
  from public.mock_pay_mweb_booking(authenticated_lead_id, owned_booking.id);

  update public.mweb_bookings booking
  set payment_status = 'paid',
      payment_idempotency_key = coalesce(booking.payment_idempotency_key, p_idempotency_key),
      updated_at = now()
  where booking.id = owned_booking.id;

  return query select owned_booking.id, paid_booking.status, 'paid'::text;
end;
$$;

revoke all on function public.get_my_mweb_profile() from public, anon;
revoke all on function public.list_my_mweb_bookings() from public, anon;
revoke all on function public.get_my_mweb_booking(uuid) from public, anon;
revoke all on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid) from public, anon;
revoke all on function public.pay_my_mweb_booking(uuid, uuid) from public, anon;

grant execute on function public.get_my_mweb_profile() to authenticated;
grant execute on function public.list_my_mweb_bookings() to authenticated;
grant execute on function public.get_my_mweb_booking(uuid) to authenticated;
grant execute on function public.create_my_mweb_booking(uuid, uuid, uuid, text, text, uuid) to authenticated;
grant execute on function public.pay_my_mweb_booking(uuid, uuid) to authenticated;

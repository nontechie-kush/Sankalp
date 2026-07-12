alter table public.mweb_bookings
  add column if not exists payment_provider text,
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists payment_verified_at timestamptz;

create unique index if not exists mweb_bookings_razorpay_order_unique_idx
  on public.mweb_bookings (razorpay_order_id)
  where razorpay_order_id is not null;

create unique index if not exists mweb_bookings_razorpay_payment_unique_idx
  on public.mweb_bookings (razorpay_payment_id)
  where razorpay_payment_id is not null;

create or replace function public.get_mweb_booking_payment_context(
  p_booking_id uuid,
  p_user_id uuid
)
returns table (
  booking_id uuid,
  booking_number text,
  ritual_title text,
  amount_minor integer,
  currency text,
  status text,
  payment_status text,
  razorpay_order_id text
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
    booking.amount_minor,
    booking.currency,
    booking.status,
    booking.payment_status,
    booking.razorpay_order_id
  from public.mweb_bookings booking
  join public.mweb_leads lead on lead.id = booking.lead_id
  where booking.id = p_booking_id
    and lead.user_id = p_user_id
  limit 1;
$$;

create or replace function public.attach_mweb_razorpay_order(
  p_booking_id uuid,
  p_user_id uuid,
  p_razorpay_order_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  attached_order_id text;
begin
  if nullif(trim(p_razorpay_order_id), '') is null then
    raise exception 'A Razorpay order identifier is required.' using errcode = '22023';
  end if;

  update public.mweb_bookings booking
  set razorpay_order_id = coalesce(booking.razorpay_order_id, trim(p_razorpay_order_id)),
      payment_provider = 'razorpay',
      updated_at = now()
  from public.mweb_leads lead
  where booking.id = p_booking_id
    and lead.id = booking.lead_id
    and lead.user_id = p_user_id
    and booking.status = 'pending_payment'
    and booking.payment_status = 'pending'
  returning booking.razorpay_order_id into attached_order_id;

  if attached_order_id is null then
    raise exception 'This booking is not awaiting payment.' using errcode = 'P0001';
  end if;

  return attached_order_id;
end;
$$;

create or replace function public.complete_mweb_razorpay_payment(
  p_booking_id uuid,
  p_user_id uuid,
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
returns table (booking_id uuid, status text, payment_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_booking public.mweb_bookings%rowtype;
begin
  select booking.* into owned_booking
  from public.mweb_bookings booking
  join public.mweb_leads lead on lead.id = booking.lead_id
  where booking.id = p_booking_id
    and lead.user_id = p_user_id
  for update of booking;

  if owned_booking.id is null then
    raise exception 'This booking does not belong to the signed-in account.' using errcode = '42501';
  end if;

  if owned_booking.payment_status = 'paid' then
    if owned_booking.razorpay_order_id = p_razorpay_order_id
      and owned_booking.razorpay_payment_id = p_razorpay_payment_id then
      return query select owned_booking.id, owned_booking.status, owned_booking.payment_status;
      return;
    end if;
    raise exception 'This booking already has a different verified payment.' using errcode = 'P0001';
  end if;

  if owned_booking.status <> 'pending_payment'
    or owned_booking.razorpay_order_id is distinct from p_razorpay_order_id then
    raise exception 'The Razorpay order does not match this booking.' using errcode = 'P0001';
  end if;

  update public.mweb_bookings booking
  set status = 'pending_assignment',
      payment_status = 'paid',
      payment_provider = 'razorpay',
      razorpay_payment_id = p_razorpay_payment_id,
      payment_verified_at = now(),
      paid_at = coalesce(booking.paid_at, now()),
      updated_at = now()
  where booking.id = owned_booking.id;

  return query select owned_booking.id, 'pending_assignment'::text, 'paid'::text;
end;
$$;

revoke all on function public.get_mweb_booking_payment_context(uuid, uuid) from public, anon, authenticated;
revoke all on function public.attach_mweb_razorpay_order(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.complete_mweb_razorpay_payment(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.get_mweb_booking_payment_context(uuid, uuid) to service_role;
grant execute on function public.attach_mweb_razorpay_order(uuid, uuid, text) to service_role;
grant execute on function public.complete_mweb_razorpay_payment(uuid, uuid, text, text) to service_role;

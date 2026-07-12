with expected as (
  select
    booking.id,
    case
      when timezone('Asia/Kolkata', booking.created_at)::time < time '14:00'
        then timezone('Asia/Kolkata', booking.created_at)::date
      else timezone('Asia/Kolkata', booking.created_at)::date + 1
    end as service_date
  from public.mweb_bookings booking
  where booking.fulfilment_rule_version = 'mumbai-2pm-v1'
)
update public.mweb_bookings booking
set promised_service_date = expected.service_date,
    promised_by = (expected.service_date::timestamp + time '23:59:59') at time zone 'Asia/Kolkata',
    updated_at = now()
from expected
where booking.id = expected.id
  and (
    booking.promised_service_date is distinct from expected.service_date
    or booking.promised_by is distinct from
      (expected.service_date::timestamp + time '23:59:59') at time zone 'Asia/Kolkata'
  );

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
    timezone('Asia/Kolkata', booking.created_at)::time < time '14:00',
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
    timezone('Asia/Kolkata', booking.created_at)::time < time '14:00',
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

revoke all on function public.list_my_mweb_bookings() from public, anon;
revoke all on function public.get_my_mweb_booking(uuid) from public, anon;
grant execute on function public.list_my_mweb_bookings() to authenticated;
grant execute on function public.get_my_mweb_booking(uuid) to authenticated;

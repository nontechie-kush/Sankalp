create or replace function public.replace_mweb_razorpay_order(
  p_booking_id uuid,
  p_user_id uuid,
  p_expected_order_id text,
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
  set razorpay_order_id = trim(p_razorpay_order_id),
      payment_provider = 'razorpay',
      updated_at = now()
  from public.mweb_leads lead
  where booking.id = p_booking_id
    and lead.id = booking.lead_id
    and lead.user_id = p_user_id
    and booking.status = 'pending_payment'
    and booking.payment_status = 'pending'
    and booking.razorpay_order_id is not distinct from p_expected_order_id
  returning booking.razorpay_order_id into attached_order_id;

  if attached_order_id is null then
    select booking.razorpay_order_id into attached_order_id
    from public.mweb_bookings booking
    join public.mweb_leads lead on lead.id = booking.lead_id
    where booking.id = p_booking_id
      and lead.user_id = p_user_id
      and booking.status = 'pending_payment'
      and booking.payment_status = 'pending';
  end if;

  if attached_order_id is null then
    raise exception 'This booking is not awaiting payment.' using errcode = 'P0001';
  end if;

  return attached_order_id;
end;
$$;

revoke all on function public.replace_mweb_razorpay_order(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.replace_mweb_razorpay_order(uuid, uuid, text, text)
  to service_role;

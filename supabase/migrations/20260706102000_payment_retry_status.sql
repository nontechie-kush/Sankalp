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

revoke all on function public.pay_my_mweb_booking(uuid, uuid) from public, anon;
grant execute on function public.pay_my_mweb_booking(uuid, uuid) to authenticated;

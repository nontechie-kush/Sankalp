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
  effective_slot_id uuid := p_slot_id;
  ist_today date := timezone('Asia/Kolkata', now())::date;
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
  where lead.id = authenticated_lead_id;

  select * into created_booking
  from public.create_mweb_booking(
    authenticated_lead_id,
    p_ritual_id,
    p_use_case_id,
    effective_slot_id,
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

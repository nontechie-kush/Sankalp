alter table public.mweb_leads
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists last_verified_at timestamptz,
  add column if not exists phone_verified_at timestamptz;

update public.mweb_leads
set last_verified_at = coalesce(last_verified_at, phone_verified_at),
    phone_verified_at = coalesce(phone_verified_at, last_verified_at);

create unique index if not exists mweb_leads_user_id_unique_idx
  on public.mweb_leads (user_id)
  where user_id is not null;

update public.mweb_leads lead
set user_id = auth_user.id,
    last_verified_at = coalesce(auth_user.phone_confirmed_at, lead.last_verified_at),
    updated_at = now()
from auth.users auth_user
where lead.user_id is null
  and auth_user.phone is not null
  and lead.phone = auth_user.phone;

create or replace function public.upsert_mweb_authenticated_lead(lead_name text default null)
returns table (lead_id uuid, phone text, name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  authenticated_phone text;
  authenticated_phone_confirmed_at timestamptz;
  verified_lead public.mweb_leads%rowtype;
begin
  if authenticated_user_id is null then
    raise exception 'Sign in with your phone before continuing.' using errcode = '42501';
  end if;

  select auth_user.phone, auth_user.phone_confirmed_at
    into authenticated_phone, authenticated_phone_confirmed_at
  from auth.users auth_user
  where auth_user.id = authenticated_user_id;

  if authenticated_phone is null or authenticated_phone_confirmed_at is null then
    raise exception 'Verify your phone before continuing.' using errcode = '42501';
  end if;

  insert into public.mweb_leads (
    user_id,
    phone,
    name,
    last_verified_at,
    phone_verified_at
  )
  values (
    authenticated_user_id,
    authenticated_phone,
    nullif(trim(lead_name), ''),
    authenticated_phone_confirmed_at,
    authenticated_phone_confirmed_at
  )
  on conflict (phone) do update
    set user_id = excluded.user_id,
        name = coalesce(excluded.name, public.mweb_leads.name),
        last_verified_at = excluded.last_verified_at,
        phone_verified_at = excluded.phone_verified_at,
        updated_at = now()
    where public.mweb_leads.user_id is null
       or public.mweb_leads.user_id = excluded.user_id
  returning * into verified_lead;

  if verified_lead.id is null then
    raise exception 'This phone number is already linked to another account.' using errcode = '23505';
  end if;

  return query select verified_lead.id, verified_lead.phone, verified_lead.name;
end;
$$;

create or replace function public.create_authenticated_mweb_booking(
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
begin
  if auth.uid() is null or not exists (
    select 1
    from public.mweb_leads lead
    where lead.id = p_lead_id
      and lead.user_id = auth.uid()
  ) then
    raise exception 'Verify your phone before creating a booking.' using errcode = '42501';
  end if;

  return query
  select legacy.booking_id, legacy.booking_number
  from public.create_mweb_booking(
    p_lead_id,
    p_ritual_id,
    p_use_case_id,
    p_slot_id,
    p_customer_name,
    p_intent_note
  ) legacy;
end;
$$;

create or replace function public.mock_pay_authenticated_mweb_booking(
  p_lead_id uuid,
  p_booking_id uuid
)
returns table (booking_id uuid, status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.mweb_leads lead
    where lead.id = p_lead_id
      and lead.user_id = auth.uid()
  ) then
    raise exception 'This booking does not belong to your account.' using errcode = '42501';
  end if;

  return query
  select legacy.booking_id, legacy.status
  from public.mock_pay_mweb_booking(p_lead_id, p_booking_id) legacy;
end;
$$;

create or replace function public.get_authenticated_mweb_booking(
  p_lead_id uuid,
  p_booking_id uuid
)
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
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.mweb_leads lead
    where lead.id = p_lead_id
      and lead.user_id = auth.uid()
  ) then
    raise exception 'This booking does not belong to your account.' using errcode = '42501';
  end if;

  return query
  select
    legacy.booking_id,
    legacy.booking_number,
    legacy.ritual_title,
    legacy.use_case_title,
    legacy.preferred_date,
    legacy.preferred_time,
    legacy.amount_minor,
    legacy.currency,
    legacy.status
  from public.get_mweb_booking(p_lead_id, p_booking_id) legacy;
end;
$$;

drop policy if exists "Users can read their own mweb lead" on public.mweb_leads;
create policy "Users can read their own mweb lead"
  on public.mweb_leads for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read their own mweb bookings" on public.mweb_bookings;
create policy "Users can read their own mweb bookings"
  on public.mweb_bookings for select
  to authenticated
  using (
    exists (
      select 1
      from public.mweb_leads lead
      where lead.id = mweb_bookings.lead_id
        and lead.user_id = auth.uid()
    )
  );

grant select on public.mweb_leads to authenticated;
grant select on public.mweb_bookings to authenticated;

revoke all on function public.request_mweb_otp(text) from public, anon, authenticated;
revoke all on function public.verify_mweb_otp(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.create_mweb_booking(uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.mock_pay_mweb_booking(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_mweb_booking(uuid, uuid) from public, anon, authenticated;

revoke all on function public.upsert_mweb_authenticated_lead(text) from public, anon;
revoke all on function public.create_authenticated_mweb_booking(uuid, uuid, uuid, uuid, text, text) from public, anon;
revoke all on function public.mock_pay_authenticated_mweb_booking(uuid, uuid) from public, anon;
revoke all on function public.get_authenticated_mweb_booking(uuid, uuid) from public, anon;

grant execute on function public.upsert_mweb_authenticated_lead(text) to authenticated;
grant execute on function public.create_authenticated_mweb_booking(uuid, uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.mock_pay_authenticated_mweb_booking(uuid, uuid) to authenticated;
grant execute on function public.get_authenticated_mweb_booking(uuid, uuid) to authenticated;

update public.faqs
set answer = 'Choose the moment and ritual, verify your phone, and complete payment. We schedule the auspicious performance and handle pandit assignment for you.',
    updated_at = now()
where id = 'db06d0e4-edf8-4ed6-ba56-2d3d0e2ca910';

update public.faqs
set question = 'Can I use a number from outside India?',
    answer = 'Yes. Select your country code and enter your mobile number. We will send a secure one-time verification code by SMS.',
    updated_at = now()
where id = 'c745f3d2-c83e-4f88-87d3-03ccf3eed713';

alter table public.mweb_leads
  add column if not exists last_verified_at timestamptz,
  add column if not exists phone_verified_at timestamptz;

update public.mweb_leads
set last_verified_at = coalesce(last_verified_at, phone_verified_at),
    phone_verified_at = coalesce(phone_verified_at, last_verified_at);

create or replace function public.upsert_mweb_authenticated_lead(lead_name text default null)
returns table (lead_id uuid, phone text, name text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
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

revoke all on function public.upsert_mweb_authenticated_lead(text) from public, anon;
grant execute on function public.upsert_mweb_authenticated_lead(text) to authenticated;

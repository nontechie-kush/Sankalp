alter table public.mweb_leads
  add column if not exists place_of_birth_id text,
  add column if not exists place_of_birth_provider text;

update public.mweb_leads
set place_of_birth_provider = 'legacy'
where nullif(trim(place_of_birth), '') is not null
  and place_of_birth_provider is null;

alter table public.mweb_leads
  drop constraint if exists mweb_leads_place_of_birth_provider_check;

alter table public.mweb_leads
  add constraint mweb_leads_place_of_birth_provider_check
  check (place_of_birth_provider is null or place_of_birth_provider in ('google', 'legacy'));

create table if not exists public.mweb_place_search_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  requested_at timestamptz not null default now()
);

create index if not exists mweb_place_search_requests_user_time_idx
  on public.mweb_place_search_requests (user_id, requested_at desc);

alter table public.mweb_place_search_requests enable row level security;
revoke all on table public.mweb_place_search_requests from public, anon, authenticated;

create or replace function public.check_mweb_place_search_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  recent_count integer;
  daily_count integer;
begin
  if authenticated_user_id is null then
    raise exception 'Sign in before searching for a place.' using errcode = '42501';
  end if;

  select count(*) into recent_count
  from public.mweb_place_search_requests request
  where request.user_id = authenticated_user_id
    and request.requested_at > now() - interval '1 minute';

  if recent_count >= 12 then
    raise exception 'Too many place searches. Wait a minute and try again.' using errcode = 'P0001';
  end if;

  select count(*) into daily_count
  from public.mweb_place_search_requests request
  where request.user_id = authenticated_user_id
    and request.requested_at > now() - interval '24 hours';

  if daily_count >= 200 then
    raise exception 'Daily place search limit reached. Try again tomorrow.' using errcode = 'P0001';
  end if;

  insert into public.mweb_place_search_requests (user_id)
  values (authenticated_user_id);

  delete from public.mweb_place_search_requests request
  where request.user_id = authenticated_user_id
    and request.requested_at < now() - interval '2 days';

  return true;
end;
$$;

drop function if exists public.get_my_mweb_profile();

create function public.get_my_mweb_profile()
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  date_of_birth date,
  place_of_birth text,
  place_of_birth_id text,
  place_of_birth_provider text,
  profile_completed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    lead.user_id,
    lead.id,
    lead.phone,
    lead.name,
    lead.date_of_birth,
    lead.place_of_birth,
    lead.place_of_birth_id,
    lead.place_of_birth_provider,
    lead.profile_completed_at
  from public.mweb_leads lead
  where auth.uid() is not null
    and lead.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.update_my_mweb_profile_v2(
  p_name text,
  p_date_of_birth date default null,
  p_place_of_birth text default null,
  p_place_of_birth_id text default null,
  p_place_of_birth_provider text default null,
  p_complete boolean default false
)
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  date_of_birth date,
  place_of_birth text,
  place_of_birth_id text,
  place_of_birth_provider text,
  profile_completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.mweb_leads%rowtype;
  clean_name text := nullif(trim(p_name), '');
  clean_place text := nullif(trim(p_place_of_birth), '');
  clean_place_id text := nullif(trim(p_place_of_birth_id), '');
  clean_provider text := nullif(trim(p_place_of_birth_provider), '');
begin
  if auth.uid() is null then
    raise exception 'Sign in before updating your profile.' using errcode = '42501';
  end if;

  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Enter your full name.' using errcode = '22023';
  end if;

  if p_date_of_birth is not null and (
    p_date_of_birth > current_date or
    p_date_of_birth < current_date - interval '120 years'
  ) then
    raise exception 'Enter a valid date of birth.' using errcode = '22023';
  end if;

  if clean_place is not null and char_length(clean_place) > 160 then
    raise exception 'Place of birth is too long.' using errcode = '22023';
  end if;

  if clean_place is not null and (
    clean_provider not in ('google', 'legacy') or
    (clean_provider = 'google' and clean_place_id is null)
  ) then
    raise exception 'Choose a place from the suggestions.' using errcode = '22023';
  end if;

  update public.mweb_leads lead
  set name = clean_name,
      date_of_birth = p_date_of_birth,
      place_of_birth = clean_place,
      place_of_birth_id = case when clean_place is null then null else clean_place_id end,
      place_of_birth_provider = case when clean_place is null then null else clean_provider end,
      profile_completed_at = case
        when p_complete then coalesce(lead.profile_completed_at, now())
        else lead.profile_completed_at
      end,
      updated_at = now()
  where lead.user_id = auth.uid()
  returning lead.* into updated_profile;

  if updated_profile.id is null then
    raise exception 'Complete phone verification before updating your profile.' using errcode = '42501';
  end if;

  return query select
    updated_profile.user_id,
    updated_profile.id,
    updated_profile.phone,
    updated_profile.name,
    updated_profile.date_of_birth,
    updated_profile.place_of_birth,
    updated_profile.place_of_birth_id,
    updated_profile.place_of_birth_provider,
    updated_profile.profile_completed_at;
end;
$$;

revoke all on function public.get_my_mweb_profile() from public, anon;
revoke all on function public.check_mweb_place_search_rate_limit() from public, anon;
revoke all on function public.update_my_mweb_profile_v2(text, date, text, text, text, boolean) from public, anon;
grant execute on function public.get_my_mweb_profile() to authenticated;
grant execute on function public.check_mweb_place_search_rate_limit() to authenticated;
grant execute on function public.update_my_mweb_profile_v2(text, date, text, text, text, boolean) to authenticated;

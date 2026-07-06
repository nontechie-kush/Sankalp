alter table public.mweb_leads
  add column if not exists date_of_birth date,
  add column if not exists place_of_birth text,
  add column if not exists profile_completed_at timestamptz;

update public.mweb_leads
set profile_completed_at = coalesce(profile_completed_at, now())
where nullif(trim(name), '') is not null;

drop function if exists public.get_my_mweb_profile();

create function public.get_my_mweb_profile()
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  date_of_birth date,
  place_of_birth text,
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
    lead.profile_completed_at
  from public.mweb_leads lead
  where auth.uid() is not null
    and lead.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.update_my_mweb_profile(
  p_name text,
  p_date_of_birth date default null,
  p_place_of_birth text default null,
  p_complete boolean default false
)
returns table (
  user_id uuid,
  lead_id uuid,
  phone text,
  name text,
  date_of_birth date,
  place_of_birth text,
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

  update public.mweb_leads lead
  set name = clean_name,
      date_of_birth = p_date_of_birth,
      place_of_birth = clean_place,
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
    updated_profile.profile_completed_at;
end;
$$;

revoke all on function public.get_my_mweb_profile() from public, anon;
revoke all on function public.update_my_mweb_profile(text, date, text, boolean) from public, anon;
grant execute on function public.get_my_mweb_profile() to authenticated;
grant execute on function public.update_my_mweb_profile(text, date, text, boolean) to authenticated;

-- Fix: ensure profile exists for users who signed up before the trigger,
-- and make complete_profile upsert instead of update-only.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  v_phone := coalesce(
    new.phone,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'phone_number'
  );

  insert into public.profiles (id, phone)
  values (new.id, v_phone)
  on conflict (id) do update
    set phone = coalesce(excluded.phone, public.profiles.phone);

  return new;
end;
$$;

-- Backfill any auth users missing a profile row
insert into public.profiles (id, phone)
select
  u.id,
  coalesce(
    u.phone,
    u.raw_user_meta_data ->> 'phone',
    u.raw_user_meta_data ->> 'phone_number'
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

create or replace function public.complete_profile(
  p_full_name text,
  p_date_of_birth date,
  p_gender text,
  p_preferred_locale text default 'hi'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_row public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated.' using errcode = 'P0001';
  end if;

  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Please enter a valid full name.' using errcode = 'P0001';
  end if;

  if p_date_of_birth is null or p_date_of_birth > public.ist_today() then
    raise exception 'Please enter a valid date of birth.' using errcode = 'P0001';
  end if;

  if p_gender is null or p_gender not in ('male', 'female', 'other', 'prefer_not_to_say') then
    raise exception 'Please select a gender.' using errcode = 'P0001';
  end if;

  if p_preferred_locale is null or p_preferred_locale not in ('en', 'hi') then
    p_preferred_locale := 'hi';
  end if;

  select coalesce(
    u.phone,
    u.raw_user_meta_data ->> 'phone',
    u.raw_user_meta_data ->> 'phone_number'
  )
  into v_phone
  from auth.users u
  where u.id = v_uid;

  insert into public.profiles (
    id,
    phone,
    full_name,
    date_of_birth,
    gender,
    preferred_locale,
    profile_completed_at
  )
  values (
    v_uid,
    v_phone,
    trim(p_full_name),
    p_date_of_birth,
    p_gender,
    p_preferred_locale,
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    phone = coalesce(excluded.phone, public.profiles.phone),
    full_name = excluded.full_name,
    date_of_birth = excluded.date_of_birth,
    gender = excluded.gender,
    preferred_locale = excluded.preferred_locale,
    profile_completed_at = coalesce(
      public.profiles.profile_completed_at,
      timezone('utc', now())
    )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.complete_profile(text, date, text, text) to authenticated;

-- Appointment system: profiles, schedule, slots, appointments, RPCs

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique,
  full_name text,
  date_of_birth date,
  gender text check (
    gender is null
    or gender in ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  profile_completed_at timestamptz,
  hospital_reference_id text unique,
  preferred_locale text not null default 'hi' check (preferred_locale in ('en', 'hi')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_phone on public.profiles (phone);
create index if not exists idx_profiles_hospital_reference_id
  on public.profiles (hospital_reference_id);

alter table public.profiles enable row level security;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_hospital_reference_id()
returns trigger
language plpgsql
as $$
begin
  if old.hospital_reference_id is distinct from new.hospital_reference_id
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Hospital reference ID can only be set by admin.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_hospital_reference_id on public.profiles;
create trigger trg_protect_hospital_reference_id
  before update on public.profiles
  for each row execute function public.protect_hospital_reference_id();

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Schedule settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.schedule_settings (
  id int primary key default 1 check (id = 1),
  booking_window_days int not null default 30 check (booking_window_days between 1 and 90),
  timezone text not null default 'Asia/Kolkata',
  reminder_day_before_hour int not null default 10 check (reminder_day_before_hour between 0 and 23),
  reminder_same_day_hour int not null default 8 check (reminder_same_day_hour between 0 and 23),
  reminders_enabled boolean not null default true
);

insert into public.schedule_settings (id) values (1)
on conflict (id) do nothing;

alter table public.schedule_settings enable row level security;

create policy schedule_settings_select
  on public.schedule_settings for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Slot definitions
-- ---------------------------------------------------------------------------
create table if not exists public.slot_definitions (
  id bigint generated always as identity primary key,
  start_time time not null,
  end_time time not null,
  capacity int not null default 15 check (capacity between 1 and 500),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint slot_definitions_time_check check (end_time > start_time)
);

create index if not exists idx_slot_definitions_active_order
  on public.slot_definitions (is_active, sort_order, start_time);

alter table public.slot_definitions enable row level security;

create policy slot_definitions_select
  on public.slot_definitions for select
  to anon, authenticated
  using (true);

insert into public.slot_definitions (start_time, end_time, capacity, sort_order, is_active)
select * from (values
  (time '14:00', time '15:00', 15, 1, true),
  (time '15:00', time '16:00', 15, 2, true),
  (time '16:00', time '17:00', 15, 3, true),
  (time '18:00', time '19:00', 15, 4, true),
  (time '19:00', time '20:00', 15, 5, true)
) as v(start_time, end_time, capacity, sort_order, is_active)
where not exists (select 1 from public.slot_definitions limit 1);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_date date not null,
  slot_id bigint not null references public.slot_definitions (id),
  token_number int not null check (token_number >= 1),
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  reminder_day_before_sent_at timestamptz,
  reminder_same_day_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  cancelled_at timestamptz
);

create unique index if not exists uq_appointments_date_token_booked
  on public.appointments (appointment_date, token_number)
  where status = 'booked';

create unique index if not exists uq_appointments_user_date_slot_booked
  on public.appointments (user_id, appointment_date, slot_id)
  where status = 'booked';

create index if not exists idx_appointments_date_slot_status
  on public.appointments (appointment_date, slot_id, status);

create index if not exists idx_appointments_user_status_date
  on public.appointments (user_id, status, appointment_date);

create index if not exists idx_appointments_reminders
  on public.appointments (appointment_date, status)
  where status = 'booked';

alter table public.appointments enable row level security;

create policy appointments_select_own
  on public.appointments for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.profiles from anon;
revoke all on table public.appointments from anon;
revoke insert, update, delete on table public.slot_definitions from anon, authenticated;
revoke insert, update, delete on table public.schedule_settings from anon, authenticated;
revoke insert, update, delete on table public.appointments from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update on table public.profiles to authenticated;
grant select on table public.appointments to authenticated;
grant select on table public.slot_definitions to anon, authenticated;
grant select on table public.schedule_settings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.ist_today()
returns date
language sql
stable
as $$
  select (timezone('Asia/Kolkata', now()))::date;
$$;

create or replace function public.ist_now_time()
returns time
language sql
stable
as $$
  select (timezone('Asia/Kolkata', now()))::time;
$$;

create or replace function public.slot_is_bookable(p_date date, p_start_time time)
returns boolean
language sql
stable
as $$
  select
    p_date > public.ist_today()
    or (p_date = public.ist_today() and p_start_time > public.ist_now_time());
$$;

create or replace function public.slot_token_base(p_slot_id bigint)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start time;
  v_base int;
begin
  select s.start_time into v_start
  from public.slot_definitions s
  where s.id = p_slot_id;

  if v_start is null then
    raise exception 'Slot not found.' using errcode = 'P0001';
  end if;

  select 1 + coalesce(sum(s.capacity), 0)::int
    into v_base
  from public.slot_definitions s
  where s.is_active = true
    and s.start_time < v_start;

  return v_base;
end;
$$;

create or replace function public.renumber_slot_tokens(
  p_date date,
  p_slot_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base int;
  r record;
  v_pos int := 0;
begin
  v_base := public.slot_token_base(p_slot_id);

  -- Temporary high range to avoid unique collisions while shifting
  update public.appointments
  set token_number = token_number + 100000
  where appointment_date = p_date
    and slot_id = p_slot_id
    and status = 'booked';

  for r in
    select a.id
    from public.appointments a
    where a.appointment_date = p_date
      and a.slot_id = p_slot_id
      and a.status = 'booked'
    order by a.created_at asc, a.id asc
  loop
    v_pos := v_pos + 1;
    update public.appointments
      set token_number = v_base + v_pos - 1
    where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_profile
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- list_availability
-- ---------------------------------------------------------------------------
create or replace function public.list_availability(p_date date default null)
returns table (
  appointment_date date,
  slot_id bigint,
  start_time time,
  end_time time,
  capacity int,
  booked_count int,
  remaining_slots int,
  token_base int,
  can_book boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.ist_today();
  v_now time := public.ist_now_time();
  v_window int;
  v_end date;
  v_date date;
begin
  select s.booking_window_days into v_window from public.schedule_settings s where s.id = 1;
  v_end := v_today + (v_window - 1);

  if p_date is not null then
    if p_date < v_today or p_date > v_end then
      raise exception 'Date is outside the booking window.' using errcode = 'P0001';
    end if;
    v_date := p_date;
  end if;

  return query
  with days as (
    select generate_series(v_today, v_end, interval '1 day')::date as d
  ),
  active_slots as (
    select
      s.id,
      s.start_time,
      s.end_time,
      s.capacity,
      public.slot_token_base(s.id) as token_base
    from public.slot_definitions s
    where s.is_active = true
  ),
  counts as (
    select
      a.appointment_date,
      a.slot_id,
      count(*)::int as booked_count
    from public.appointments a
    where a.status = 'booked'
      and a.appointment_date >= v_today
      and a.appointment_date <= v_end
    group by a.appointment_date, a.slot_id
  )
  select
    d.d as appointment_date,
    sl.id as slot_id,
    sl.start_time,
    sl.end_time,
    sl.capacity,
    coalesce(c.booked_count, 0)::int as booked_count,
    greatest(sl.capacity - coalesce(c.booked_count, 0), 0)::int as remaining_slots,
    sl.token_base,
    (coalesce(c.booked_count, 0) < sl.capacity) as can_book
  from days d
  cross join active_slots sl
  left join counts c
    on c.appointment_date = d.d and c.slot_id = sl.id
  where (v_date is null or d.d = v_date)
    and (
      d.d > v_today
      or (d.d = v_today and sl.start_time > v_now)
    )
  order by d.d asc, sl.start_time asc;
end;
$$;

grant execute on function public.list_availability(date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- book_appointment
-- ---------------------------------------------------------------------------
create or replace function public.book_appointment(
  p_date date,
  p_slot_id bigint
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := public.ist_today();
  v_window int;
  v_slot public.slot_definitions;
  v_booked int;
  v_base int;
  v_token int;
  v_row public.appointments;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'Not authenticated.' using errcode = 'P0001';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.profile_completed_at is null then
    raise exception 'Please complete your profile first.' using errcode = 'P0001';
  end if;

  select s.booking_window_days into v_window from public.schedule_settings s where s.id = 1;
  if p_date is null or p_date < v_today or p_date > v_today + (v_window - 1) then
    raise exception 'Date is outside the booking window.' using errcode = 'P0001';
  end if;

  select * into v_slot from public.slot_definitions where id = p_slot_id and is_active = true;
  if v_slot.id is null then
    raise exception 'Slot is not available.' using errcode = 'P0001';
  end if;

  if not public.slot_is_bookable(p_date, v_slot.start_time) then
    raise exception 'This slot time has already passed.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('appt_' || p_date::text));

  if exists (
    select 1 from public.appointments a
    where a.user_id = v_uid
      and a.status = 'booked'
      and a.appointment_date >= v_today
  ) then
    raise exception 'You already have an upcoming appointment.' using errcode = 'P0001';
  end if;

  select count(*)::int into v_booked
  from public.appointments a
  where a.appointment_date = p_date
    and a.slot_id = p_slot_id
    and a.status = 'booked';

  if v_booked >= v_slot.capacity then
    raise exception 'This slot is full.' using errcode = 'P0001';
  end if;

  v_base := public.slot_token_base(p_slot_id);
  v_token := v_base + v_booked;

  insert into public.appointments (
    user_id, appointment_date, slot_id, token_number, status
  ) values (
    v_uid, p_date, p_slot_id, v_token, 'booked'
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.book_appointment(date, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- cancel_appointment
-- ---------------------------------------------------------------------------
create or replace function public.cancel_appointment(p_appointment_id bigint)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments;
  v_date date;
  v_slot_id bigint;
begin
  if v_uid is null then
    raise exception 'Not authenticated.' using errcode = 'P0001';
  end if;

  select * into v_row
  from public.appointments a
  where a.id = p_appointment_id and a.user_id = v_uid and a.status = 'booked';

  if v_row.id is null then
    raise exception 'Appointment not found.' using errcode = 'P0001';
  end if;

  if v_row.appointment_date < public.ist_today() then
    raise exception 'Cannot cancel a past appointment.' using errcode = 'P0001';
  end if;

  v_date := v_row.appointment_date;
  v_slot_id := v_row.slot_id;

  perform pg_advisory_xact_lock(hashtext('appt_' || v_date::text));

  update public.appointments
  set status = 'cancelled', cancelled_at = timezone('utc', now())
  where id = v_row.id
  returning * into v_row;

  perform public.renumber_slot_tokens(v_date, v_slot_id);

  return v_row;
end;
$$;

grant execute on function public.cancel_appointment(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- reschedule_appointment
-- ---------------------------------------------------------------------------
create or replace function public.reschedule_appointment(
  p_appointment_id bigint,
  p_new_date date,
  p_new_slot_id bigint
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.appointments;
  v_new public.appointments;
  v_today date := public.ist_today();
  v_window int;
  v_slot public.slot_definitions;
  v_booked int;
  v_base int;
  v_token int;
  v_old_date date;
  v_old_slot bigint;
begin
  if v_uid is null then
    raise exception 'Not authenticated.' using errcode = 'P0001';
  end if;

  select * into v_old
  from public.appointments a
  where a.id = p_appointment_id and a.user_id = v_uid and a.status = 'booked';

  if v_old.id is null then
    raise exception 'Appointment not found.' using errcode = 'P0001';
  end if;

  if v_old.appointment_date < v_today then
    raise exception 'Cannot reschedule a past appointment.' using errcode = 'P0001';
  end if;

  select s.booking_window_days into v_window from public.schedule_settings s where s.id = 1;
  if p_new_date is null or p_new_date < v_today or p_new_date > v_today + (v_window - 1) then
    raise exception 'New date is outside the booking window.' using errcode = 'P0001';
  end if;

  select * into v_slot from public.slot_definitions where id = p_new_slot_id and is_active = true;
  if v_slot.id is null then
    raise exception 'Slot is not available.' using errcode = 'P0001';
  end if;

  if not public.slot_is_bookable(p_new_date, v_slot.start_time) then
    raise exception 'This slot time has already passed.' using errcode = 'P0001';
  end if;

  if v_old.appointment_date = p_new_date and v_old.slot_id = p_new_slot_id then
    raise exception 'Choose a different date or slot.' using errcode = 'P0001';
  end if;

  if v_old.appointment_date <= p_new_date then
    perform pg_advisory_xact_lock(hashtext('appt_' || v_old.appointment_date::text));
    if p_new_date <> v_old.appointment_date then
      perform pg_advisory_xact_lock(hashtext('appt_' || p_new_date::text));
    end if;
  else
    perform pg_advisory_xact_lock(hashtext('appt_' || p_new_date::text));
    perform pg_advisory_xact_lock(hashtext('appt_' || v_old.appointment_date::text));
  end if;

  v_old_date := v_old.appointment_date;
  v_old_slot := v_old.slot_id;

  update public.appointments
  set status = 'cancelled', cancelled_at = timezone('utc', now())
  where id = v_old.id;

  perform public.renumber_slot_tokens(v_old_date, v_old_slot);

  select count(*)::int into v_booked
  from public.appointments a
  where a.appointment_date = p_new_date
    and a.slot_id = p_new_slot_id
    and a.status = 'booked';

  if v_booked >= v_slot.capacity then
    raise exception 'This slot is full.' using errcode = 'P0001';
  end if;

  v_base := public.slot_token_base(p_new_slot_id);
  v_token := v_base + v_booked;

  insert into public.appointments (
    user_id, appointment_date, slot_id, token_number, status,
    reminder_day_before_sent_at, reminder_same_day_sent_at
  ) values (
    v_uid, p_new_date, p_new_slot_id, v_token, 'booked',
    null, null
  )
  returning * into v_new;

  return v_new;
end;
$$;

grant execute on function public.reschedule_appointment(bigint, date, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin day roster (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.admin_day_roster(p_date date)
returns table (
  appointment_id bigint,
  token_number int,
  slot_id bigint,
  start_time time,
  end_time time,
  user_id uuid,
  full_name text,
  phone text,
  hospital_reference_id text,
  gender text,
  date_of_birth date,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id as appointment_id,
    a.token_number,
    a.slot_id,
    s.start_time,
    s.end_time,
    a.user_id,
    p.full_name,
    p.phone,
    p.hospital_reference_id,
    p.gender,
    p.date_of_birth,
    a.created_at
  from public.appointments a
  join public.slot_definitions s on s.id = a.slot_id
  join public.profiles p on p.id = a.user_id
  where a.appointment_date = p_date
    and a.status = 'booked'
  order by a.token_number asc;
$$;

revoke all on function public.admin_day_roster(date) from public, anon, authenticated;
grant execute on function public.admin_day_roster(date) to service_role;

create or replace function public.get_my_upcoming_appointment()
returns table (
  appointment_id bigint,
  appointment_date date,
  slot_id bigint,
  start_time time,
  end_time time,
  token_number int,
  hospital_reference_id text,
  full_name text,
  phone text
)
language sql
security definer
set search_path = public
as $$
  select
    a.id as appointment_id,
    a.appointment_date,
    a.slot_id,
    s.start_time,
    s.end_time,
    a.token_number,
    p.hospital_reference_id,
    p.full_name,
    p.phone
  from public.appointments a
  join public.slot_definitions s on s.id = a.slot_id
  join public.profiles p on p.id = a.user_id
  where a.user_id = auth.uid()
    and a.status = 'booked'
    and a.appointment_date >= public.ist_today()
  order by a.appointment_date asc
  limit 1;
$$;

grant execute on function public.get_my_upcoming_appointment() to authenticated;

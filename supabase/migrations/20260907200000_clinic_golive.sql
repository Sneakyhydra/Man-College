-- Clinic go-live: per-slot FCFS tokens, no renumber, capacity ignores cancelled,
-- closed dates, day-of statuses, admin cancel/status, reminder_runs.

-- ---------------------------------------------------------------------------
-- Indexes & status enum
-- ---------------------------------------------------------------------------
drop index if exists public.uq_appointments_date_token_booked;

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status in ('booked', 'checked_in', 'completed', 'no_show', 'cancelled'));

create unique index if not exists uq_appointments_date_slot_token_active
  on public.appointments (appointment_date, slot_id, token_number)
  where status <> 'cancelled';

drop index if exists public.uq_appointments_user_date_slot_booked;
create unique index if not exists uq_appointments_user_date_slot_active
  on public.appointments (user_id, appointment_date, slot_id)
  where status <> 'cancelled';

-- ---------------------------------------------------------------------------
-- Closed dates
-- ---------------------------------------------------------------------------
create table if not exists public.closed_dates (
  date date primary key,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.closed_dates enable row level security;
revoke all on table public.closed_dates from anon, authenticated;
grant select on table public.closed_dates to authenticated;
-- service_role bypasses RLS

-- ---------------------------------------------------------------------------
-- Reminder runs
-- ---------------------------------------------------------------------------
create table if not exists public.reminder_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  day_before_sent int not null default 0,
  same_day_sent int not null default 0,
  error_count int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb
);

alter table public.reminder_runs enable row level security;
revoke all on table public.reminder_runs from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Token helpers (per-slot FCFS, never reuse including cancelled)
-- ---------------------------------------------------------------------------
create or replace function public.slot_active_count(p_date date, p_slot_id bigint)
returns int
language sql
stable
set search_path = public
as $$
  select count(*)::int
  from public.appointments a
  where a.appointment_date = p_date
    and a.slot_id = p_slot_id
    and a.status <> 'cancelled';
$$;

create or replace function public.allocate_slot_token(
  p_date date,
  p_slot_id bigint
)
returns int
language plpgsql
stable
set search_path = public
as $$
declare
  v_max int;
begin
  select coalesce(max(a.token_number), 0)::int into v_max
  from public.appointments a
  where a.appointment_date = p_date
    and a.slot_id = p_slot_id;

  return v_max + 1;
end;
$$;

create or replace function public.assert_date_bookable(p_date date)
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if exists (select 1 from public.closed_dates c where c.date = p_date) then
    raise exception 'Clinic is closed on this date.' using errcode = 'P0001';
  end if;
end;
$$;

-- No-op renumber (legacy callers safe)
create or replace function public.renumber_slot_tokens(
  p_date date,
  p_slot_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tokens are frozen; intentionally no-op.
  return;
end;
$$;

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
    select s.id, s.start_time, s.end_time, s.capacity
    from public.slot_definitions s
    where s.is_active = true
  ),
  counts as (
    select
      a.appointment_date,
      a.slot_id,
      count(*)::int as booked_count
    from public.appointments a
    where a.status <> 'cancelled'
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
    1 as token_base,
    (coalesce(c.booked_count, 0) < sl.capacity) as can_book
  from days d
  cross join active_slots sl
  left join counts c
    on c.appointment_date = d.d and c.slot_id = sl.id
  where (v_date is null or d.d = v_date)
    and not exists (select 1 from public.closed_dates cd where cd.date = d.d)
    and (
      d.d > v_today
      or (d.d = v_today and sl.end_time > v_now)
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
  v_active int;
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

  perform public.assert_date_bookable(p_date);

  select * into v_slot from public.slot_definitions where id = p_slot_id and is_active = true;
  if v_slot.id is null then
    raise exception 'Slot is not available.' using errcode = 'P0001';
  end if;

  if not public.slot_is_bookable(p_date, v_slot.end_time) then
    raise exception 'This slot time has already passed.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('appt_' || p_date::text));

  if exists (
    select 1 from public.appointments a
    where a.user_id = v_uid
      and a.status in ('booked', 'checked_in')
      and a.appointment_date >= v_today
  ) then
    raise exception 'You already have an upcoming appointment.' using errcode = 'P0001';
  end if;

  v_active := public.slot_active_count(p_date, p_slot_id);
  if v_active >= v_slot.capacity then
    raise exception 'This slot is full.' using errcode = 'P0001';
  end if;

  v_token := public.allocate_slot_token(p_date, p_slot_id);

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
-- cancel_appointment (patient; keep token; cutoff after slot start)
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
  v_slot public.slot_definitions;
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

  select * into v_slot from public.slot_definitions where id = v_row.slot_id;
  if v_row.appointment_date = public.ist_today()
     and v_slot.start_time is not null
     and v_slot.start_time <= public.ist_now_time() then
    raise exception 'Cannot cancel after the slot has started. Please contact the clinic.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('appt_' || v_row.appointment_date::text));

  update public.appointments
  set status = 'cancelled', cancelled_at = timezone('utc', now())
  where id = v_row.id
  returning * into v_row;

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
  v_old_slot public.slot_definitions;
  v_active int;
  v_token int;
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

  select * into v_old_slot from public.slot_definitions where id = v_old.slot_id;
  if v_old.appointment_date = v_today
     and v_old_slot.start_time is not null
     and v_old_slot.start_time <= public.ist_now_time() then
    raise exception 'Cannot reschedule after the slot has started. Please contact the clinic.' using errcode = 'P0001';
  end if;

  select s.booking_window_days into v_window from public.schedule_settings s where s.id = 1;
  if p_new_date is null or p_new_date < v_today or p_new_date > v_today + (v_window - 1) then
    raise exception 'New date is outside the booking window.' using errcode = 'P0001';
  end if;

  perform public.assert_date_bookable(p_new_date);

  select * into v_slot from public.slot_definitions where id = p_new_slot_id and is_active = true;
  if v_slot.id is null then
    raise exception 'Slot is not available.' using errcode = 'P0001';
  end if;

  if not public.slot_is_bookable(p_new_date, v_slot.end_time) then
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

  update public.appointments
  set status = 'cancelled', cancelled_at = timezone('utc', now())
  where id = v_old.id;

  v_active := public.slot_active_count(p_new_date, p_new_slot_id);
  if v_active >= v_slot.capacity then
    raise exception 'This slot is full.' using errcode = 'P0001';
  end if;

  v_token := public.allocate_slot_token(p_new_date, p_new_slot_id);

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
-- admin_book_appointment (no capacity cap)
-- ---------------------------------------------------------------------------
create or replace function public.admin_book_appointment(
  p_user_id uuid,
  p_date date,
  p_slot_id bigint
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.ist_today();
  v_window int;
  v_slot public.slot_definitions;
  v_token int;
  v_row public.appointments;
  v_profile public.profiles;
begin
  if p_user_id is null then
    raise exception 'Patient is required.' using errcode = 'P0001';
  end if;

  select * into v_profile from public.profiles where id = p_user_id;
  if v_profile.id is null then
    raise exception 'Patient profile not found.' using errcode = 'P0001';
  end if;
  if v_profile.profile_completed_at is null then
    raise exception 'Patient profile is incomplete.' using errcode = 'P0001';
  end if;

  select s.booking_window_days into v_window from public.schedule_settings s where s.id = 1;
  if p_date is null or p_date < v_today or p_date > v_today + (v_window - 1) then
    raise exception 'Date is outside the booking window.' using errcode = 'P0001';
  end if;

  perform public.assert_date_bookable(p_date);

  select * into v_slot from public.slot_definitions where id = p_slot_id and is_active = true;
  if v_slot.id is null then
    raise exception 'Slot is not available.' using errcode = 'P0001';
  end if;

  if not public.slot_is_bookable(p_date, v_slot.end_time) then
    raise exception 'This slot time has already passed.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('appt_' || p_date::text));

  if exists (
    select 1 from public.appointments a
    where a.user_id = p_user_id
      and a.status in ('booked', 'checked_in')
      and a.appointment_date >= v_today
  ) then
    raise exception 'Patient already has an upcoming appointment.' using errcode = 'P0001';
  end if;

  v_token := public.allocate_slot_token(p_date, p_slot_id);

  insert into public.appointments (
    user_id, appointment_date, slot_id, token_number, status
  ) values (
    p_user_id, p_date, p_slot_id, v_token, 'booked'
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_book_appointment(uuid, date, bigint) from public;
revoke all on function public.admin_book_appointment(uuid, date, bigint) from anon, authenticated;
grant execute on function public.admin_book_appointment(uuid, date, bigint) to service_role;

-- ---------------------------------------------------------------------------
-- admin_cancel_appointment
-- ---------------------------------------------------------------------------
create or replace function public.admin_cancel_appointment(p_appointment_id bigint)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  select * into v_row
  from public.appointments a
  where a.id = p_appointment_id
    and a.status in ('booked', 'checked_in', 'completed', 'no_show');

  if v_row.id is null then
    raise exception 'Appointment not found.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('appt_' || v_row.appointment_date::text));

  update public.appointments
  set status = 'cancelled', cancelled_at = timezone('utc', now())
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_cancel_appointment(bigint) from public;
revoke all on function public.admin_cancel_appointment(bigint) from anon, authenticated;
grant execute on function public.admin_cancel_appointment(bigint) to service_role;

-- ---------------------------------------------------------------------------
-- admin_set_appointment_status
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_appointment_status(
  p_appointment_id bigint,
  p_status text
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.appointments;
begin
  if p_status is null or p_status not in ('booked', 'checked_in', 'completed', 'no_show') then
    raise exception 'Invalid status.' using errcode = 'P0001';
  end if;

  select * into v_row
  from public.appointments a
  where a.id = p_appointment_id
    and a.status <> 'cancelled';

  if v_row.id is null then
    raise exception 'Appointment not found.' using errcode = 'P0001';
  end if;

  update public.appointments
  set status = p_status,
      cancelled_at = null
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_set_appointment_status(bigint, text) from public;
revoke all on function public.admin_set_appointment_status(bigint, text) from anon, authenticated;
grant execute on function public.admin_set_appointment_status(bigint, text) to service_role;

-- ---------------------------------------------------------------------------
-- admin_day_roster (all statuses; include cancelled with token)
-- ---------------------------------------------------------------------------
drop function if exists public.admin_day_roster(date);

create function public.admin_day_roster(p_date date)
returns table (
  appointment_id bigint,
  token_number int,
  status text,
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
    a.status,
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
  order by s.start_time asc, a.token_number asc;
$$;

revoke all on function public.admin_day_roster(date) from public, anon, authenticated;
grant execute on function public.admin_day_roster(date) to service_role;

-- ---------------------------------------------------------------------------
-- get_my_upcoming_appointment
-- ---------------------------------------------------------------------------
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
    and a.status in ('booked', 'checked_in')
    and a.appointment_date >= public.ist_today()
  order by a.appointment_date asc
  limit 1;
$$;

grant execute on function public.get_my_upcoming_appointment() to authenticated;

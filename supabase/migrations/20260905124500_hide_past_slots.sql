-- Hide and reject slots whose start time has already passed today (IST).

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

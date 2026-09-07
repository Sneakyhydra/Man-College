-- Sundays are always closed (IST calendar date).

create or replace function public.assert_date_bookable(p_date date)
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  -- PostgreSQL dow: 0 = Sunday … 6 = Saturday
  if extract(dow from p_date)::int = 0 then
    raise exception 'Clinic is closed on Sundays.' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.closed_dates c where c.date = p_date) then
    raise exception 'Clinic is closed on this date.' using errcode = 'P0001';
  end if;
end;
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
    and extract(dow from d.d)::int <> 0
    and not exists (select 1 from public.closed_dates cd where cd.date = d.d)
    and (
      d.d > v_today
      or (d.d = v_today and sl.end_time > v_now)
    )
  order by d.d asc, sl.start_time asc;
end;
$$;

grant execute on function public.list_availability(date) to anon, authenticated;

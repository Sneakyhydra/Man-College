create or replace function public.admin_queue_for_date(
  p_date date
)
returns table (
  id bigint,
  queue_date date,
  queue_number integer,
  patient_id text,
  patient_name text,
  mobile_number text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    e.id,
    e.queue_date,
    e.queue_number,
    e.patient_id,
    e.patient_name,
    e.mobile_number,
    e.created_at
  from public.patient_queue_entries e
  where e.queue_date = p_date
  order by e.queue_number asc;
$$;

create or replace function public.admin_queue_summary(
  p_date date
)
returns table (
  total_for_day integer,
  remaining_slots integer,
  next_queue_number integer,
  upcoming_total integer
)
language sql
security definer
set search_path = public
as $$
  with day_counts as (
    select count(*)::int as total_for_day
    from public.patient_queue_entries e
    where e.queue_date = p_date
  ),
  upcoming_counts as (
    select count(*)::int as upcoming_total
    from public.patient_queue_entries e
    where e.queue_date >= ((now() at time zone 'utc')::date)
  )
  select
    d.total_for_day,
    greatest(50 - d.total_for_day, 0)::int as remaining_slots,
    least(d.total_for_day + 1, 50)::int as next_queue_number,
    u.upcoming_total
  from day_counts d
  cross join upcoming_counts u;
$$;

grant execute on function public.admin_queue_for_date(date) to anon, authenticated;
grant execute on function public.admin_queue_summary(date) to anon, authenticated;

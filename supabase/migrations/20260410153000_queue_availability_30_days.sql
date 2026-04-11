create or replace function public.queue_availability_30_days()
returns table (
  queue_date date,
  total_for_day integer,
  remaining_slots integer,
  can_join boolean
)
language sql
security definer
set search_path = public
as $$
  with window_days as (
    select generate_series(
      (now() at time zone 'utc')::date,
      ((now() at time zone 'utc')::date + 29),
      interval '1 day'
    )::date as queue_date
  ),
  day_counts as (
    select
      e.queue_date,
      count(*)::int as total_for_day
    from public.patient_queue_entries e
    where e.queue_date >= (now() at time zone 'utc')::date
      and e.queue_date <= ((now() at time zone 'utc')::date + 29)
    group by e.queue_date
  )
  select
    w.queue_date,
    coalesce(d.total_for_day, 0)::int as total_for_day,
    greatest(50 - coalesce(d.total_for_day, 0), 0)::int as remaining_slots,
    (coalesce(d.total_for_day, 0) < 50) as can_join
  from window_days w
  left join day_counts d on d.queue_date = w.queue_date
  order by w.queue_date asc;
$$;

grant execute on function public.queue_availability_30_days() to anon, authenticated;

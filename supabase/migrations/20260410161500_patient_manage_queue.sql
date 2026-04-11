create or replace function public.patient_cancel_queue(
  p_patient_id text,
  p_mobile text,
  p_is_new_patient boolean default false
)
returns table (
  queue_date date,
  queue_number integer,
  entry_id bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_clean_patient_id text := nullif(trim(p_patient_id), '');
  v_clean_mobile text := trim(p_mobile);
  v_target record;
begin
  if p_mobile is null or length(v_clean_mobile) < 10 then
    raise exception 'Invalid mobile number.' using errcode = 'P0001';
  end if;

  if coalesce(p_is_new_patient, false) = false then
    if v_clean_patient_id is null or length(v_clean_patient_id) < 4 then
      raise exception 'Existing patients must provide a valid patient ID.' using errcode = 'P0001';
    end if;

    select e.id, e.queue_date, e.queue_number
      into v_target
    from public.patient_queue_entries e
    where e.queue_date >= v_today
      and e.patient_id = v_clean_patient_id
      and e.mobile_number = v_clean_mobile
    order by e.queue_date asc, e.queue_number asc
    limit 1;
  else
    select e.id, e.queue_date, e.queue_number
      into v_target
    from public.patient_queue_entries e
    where e.queue_date >= v_today
      and e.mobile_number = v_clean_mobile
      and e.patient_id is null
    order by e.queue_date asc, e.queue_number asc
    limit 1;
  end if;

  if v_target is null then
    raise exception 'No upcoming queued visit found for these details.' using errcode = 'P0001';
  end if;

  delete from public.patient_queue_entries e where e.id = v_target.id;

  return query
  select v_target.queue_date::date, v_target.queue_number::integer, v_target.id::bigint;
end;
$$;

create or replace function public.patient_reschedule_queue(
  p_patient_id text,
  p_mobile text,
  p_is_new_patient boolean,
  p_new_queue_date date
)
returns table (
  old_queue_date date,
  new_queue_date date,
  new_queue_number integer,
  entry_id bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_last_bookable_date date := v_today + 29;
  v_clean_patient_id text := nullif(trim(p_patient_id), '');
  v_clean_mobile text := trim(p_mobile);
  v_target record;
  v_next_number integer;
begin
  if p_mobile is null or length(v_clean_mobile) < 10 then
    raise exception 'Invalid mobile number.' using errcode = 'P0001';
  end if;

  if p_new_queue_date is null or p_new_queue_date < v_today or p_new_queue_date > v_last_bookable_date then
    raise exception 'New queue date must be within the next 30 days.' using errcode = 'P0001';
  end if;

  if coalesce(p_is_new_patient, false) = false then
    if v_clean_patient_id is null or length(v_clean_patient_id) < 4 then
      raise exception 'Existing patients must provide a valid patient ID.' using errcode = 'P0001';
    end if;

    select e.id, e.queue_date, e.queue_number
      into v_target
    from public.patient_queue_entries e
    where e.queue_date >= v_today
      and e.patient_id = v_clean_patient_id
      and e.mobile_number = v_clean_mobile
    order by e.queue_date asc, e.queue_number asc
    limit 1;
  else
    select e.id, e.queue_date, e.queue_number
      into v_target
    from public.patient_queue_entries e
    where e.queue_date >= v_today
      and e.mobile_number = v_clean_mobile
      and e.patient_id is null
    order by e.queue_date asc, e.queue_number asc
    limit 1;
  end if;

  if v_target is null then
    raise exception 'No upcoming queued visit found for these details.' using errcode = 'P0001';
  end if;

  if v_target.queue_date = p_new_queue_date then
    return query
    select
      v_target.queue_date::date,
      v_target.queue_date::date,
      v_target.queue_number::integer,
      v_target.id::bigint;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('patient_queue_' || v_target.queue_date::text));
  perform pg_advisory_xact_lock(hashtext('patient_queue_' || p_new_queue_date::text));

  select count(*)::int
    into v_next_number
  from public.patient_queue_entries e
  where e.queue_date = p_new_queue_date;

  if v_next_number >= 50 then
    raise exception 'Queue is full for selected new date.' using errcode = 'P0001';
  end if;

  select coalesce(max(e.queue_number), 0) + 1
    into v_next_number
  from public.patient_queue_entries e
  where e.queue_date = p_new_queue_date;

  update public.patient_queue_entries e
    set queue_date = p_new_queue_date,
        queue_number = v_next_number
  where e.id = v_target.id;

  return query
  select
    v_target.queue_date::date,
    p_new_queue_date::date,
    v_next_number::integer,
    v_target.id::bigint;
end;
$$;

grant execute on function public.patient_cancel_queue(text, text, boolean) to anon, authenticated;
grant execute on function public.patient_reschedule_queue(text, text, boolean, date) to anon, authenticated;

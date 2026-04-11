drop function if exists public.enqueue_patient(text, text, text, date, boolean);

create or replace function public.enqueue_patient(
  p_patient_id text,
  p_name text,
  p_mobile text,
  p_queue_date date,
  p_is_new_patient boolean default false
)
returns table (
  queue_date date,
  queue_number integer,
  entry_id bigint,
  was_existing boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_last_bookable_date date := v_today + 29;
  v_next_number integer;
  v_entry_id bigint;
  v_clean_patient_id text := nullif(trim(p_patient_id), '');
  v_clean_mobile text := trim(p_mobile);
  v_existing_record record;
begin
  if coalesce(p_is_new_patient, false) = false then
    if v_clean_patient_id is null or length(v_clean_patient_id) < 4 then
      raise exception 'Existing patients must provide a valid patient ID.' using errcode = 'P0001';
    end if;
  else
    v_clean_patient_id := null;
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Invalid patient name.' using errcode = 'P0001';
  end if;

  if p_mobile is null or length(v_clean_mobile) < 10 then
    raise exception 'Invalid mobile number.' using errcode = 'P0001';
  end if;

  if p_queue_date is null or p_queue_date < v_today or p_queue_date > v_last_bookable_date then
    raise exception 'Queue date must be within the next 30 days.' using errcode = 'P0001';
  end if;

  if v_clean_patient_id is not null then
    select e.queue_date, e.queue_number, e.id
      into v_existing_record
    from public.patient_queue_entries e
    where e.queue_date >= v_today
      and (
        e.patient_id = v_clean_patient_id
        or e.mobile_number = v_clean_mobile
      )
    order by e.queue_date asc, e.queue_number asc
    limit 1;
  else
    select e.queue_date, e.queue_number, e.id
      into v_existing_record
    from public.patient_queue_entries e
    where e.queue_date >= v_today
      and e.mobile_number = v_clean_mobile
    order by e.queue_date asc, e.queue_number asc
    limit 1;
  end if;

  if v_existing_record is not null then
    return query
    select
      v_existing_record.queue_date::date,
      v_existing_record.queue_number::integer,
      v_existing_record.id::bigint,
      true;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('patient_queue_' || p_queue_date::text));

  select coalesce(max(e.queue_number), 0) + 1
    into v_next_number
  from public.patient_queue_entries e
  where e.queue_date = p_queue_date;

  if v_next_number > 50 then
    raise exception 'Queue is full for the selected day.' using errcode = 'P0001';
  end if;

  insert into public.patient_queue_entries (
    queue_date,
    queue_number,
    patient_id,
    patient_name,
    mobile_number
  ) values (
    p_queue_date,
    v_next_number,
    v_clean_patient_id,
    trim(p_name),
    v_clean_mobile
  )
  returning id into v_entry_id;

  return query
  select p_queue_date, v_next_number, v_entry_id, false;

exception
  when unique_violation then
    raise exception 'This patient ID is already queued on the selected day.' using errcode = 'P0001';
end;
$$;

grant execute on function public.enqueue_patient(text, text, text, date, boolean) to anon, authenticated;

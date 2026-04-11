alter table public.patient_queue_entries
  alter column system_patient_id drop not null;

drop function if exists public.enqueue_patient(text, text, text, date);

create or replace function public.enqueue_patient(
  p_system_id text,
  p_name text,
  p_mobile text,
  p_queue_date date,
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
  v_last_bookable_date date := v_today + 29;
  v_next_number integer;
  v_entry_id bigint;
  v_clean_system_id text := nullif(trim(p_system_id), '');
begin
  if coalesce(p_is_new_patient, false) = false then
    if v_clean_system_id is null or length(v_clean_system_id) < 4 then
      raise exception 'Existing patients must provide a valid patient system ID.' using errcode = 'P0001';
    end if;
  else
    v_clean_system_id := null;
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Invalid patient name.' using errcode = 'P0001';
  end if;

  if p_mobile is null or length(trim(p_mobile)) < 10 then
    raise exception 'Invalid mobile number.' using errcode = 'P0001';
  end if;

  if p_queue_date is null or p_queue_date < v_today or p_queue_date > v_last_bookable_date then
    raise exception 'Queue date must be within the next 30 days.' using errcode = 'P0001';
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
    system_patient_id,
    patient_name,
    mobile_number
  ) values (
    p_queue_date,
    v_next_number,
    v_clean_system_id,
    trim(p_name),
    trim(p_mobile)
  )
  returning id into v_entry_id;

  return query
  select p_queue_date, v_next_number, v_entry_id;

exception
  when unique_violation then
    raise exception 'This patient ID is already queued on the selected day.' using errcode = 'P0001';
end;
$$;

grant execute on function public.enqueue_patient(text, text, text, date, boolean) to anon, authenticated;

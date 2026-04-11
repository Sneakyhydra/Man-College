create table if not exists public.patient_queue_entries (
  id bigint generated always as identity primary key,
  queue_date date not null,
  queue_number integer not null check (queue_number between 1 and 50),
  system_patient_id text not null,
  patient_name text not null,
  mobile_number text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint uq_queue_day_position unique (queue_date, queue_number),
  constraint uq_queue_day_patient unique (queue_date, system_patient_id)
);

create index if not exists idx_patient_queue_entries_queue_date
  on public.patient_queue_entries (queue_date);

alter table public.patient_queue_entries enable row level security;

revoke all on table public.patient_queue_entries from anon, authenticated;

create or replace function public.enqueue_patient(
  p_system_id text,
  p_name text,
  p_mobile text,
  p_queue_date date
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
begin
  if p_system_id is null or length(trim(p_system_id)) < 4 then
    raise exception 'Invalid patient system ID.' using errcode = 'P0001';
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
    trim(p_system_id),
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

grant execute on function public.enqueue_patient(text, text, text, date) to anon, authenticated;

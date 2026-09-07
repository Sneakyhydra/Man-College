-- Admin booking on behalf of a patient: no capacity cap; overflow tokens
-- sit past all active slot bands so they never collide with patient tokens.

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
  v_booked int;
  v_base int;
  v_token int;
  v_band_end int;
  v_max_token int;
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
    where a.user_id = p_user_id
      and a.status = 'booked'
      and a.appointment_date >= v_today
  ) then
    raise exception 'Patient already has an upcoming appointment.' using errcode = 'P0001';
  end if;

  select count(*)::int into v_booked
  from public.appointments a
  where a.appointment_date = p_date
    and a.slot_id = p_slot_id
    and a.status = 'booked';

  v_base := public.slot_token_base(p_slot_id);

  if v_booked < v_slot.capacity then
    v_token := v_base + v_booked;
  else
    select coalesce(sum(capacity), 0)::int into v_band_end
    from public.slot_definitions
    where is_active = true;

    select coalesce(max(token_number), 0)::int into v_max_token
    from public.appointments
    where appointment_date = p_date
      and status = 'booked';

    v_token := greatest(v_max_token + 1, v_band_end + 1);
  end if;

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

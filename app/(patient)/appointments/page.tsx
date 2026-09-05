import {
  AppointmentManager,
  type UpcomingAppointment,
} from "@/components/appointment-manager";
import type { AvailabilityRow } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const [{ data: upcoming }, { data: availability }] = await Promise.all([
    supabase.rpc("get_my_upcoming_appointment"),
    supabase.rpc("list_availability"),
  ]);

  const row = Array.isArray(upcoming) ? upcoming[0] : upcoming;
  const appointment = (row as UpcomingAppointment | undefined) ?? null;

  return (
    <AppointmentManager
      appointment={appointment}
      availability={(availability ?? []) as AvailabilityRow[]}
    />
  );
}

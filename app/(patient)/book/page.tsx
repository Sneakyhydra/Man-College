import { BookingPanel } from "@/components/booking-panel";
import type { AvailabilityRow } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";

export default async function BookPage() {
  const supabase = await createClient();

  const [{ data: availability }, { data: upcoming }] = await Promise.all([
    supabase.rpc("list_availability"),
    supabase.rpc("get_my_upcoming_appointment"),
  ]);

  const days = (availability ?? []) as AvailabilityRow[];
  const hasUpcoming = Array.isArray(upcoming)
    ? upcoming.length > 0
    : Boolean(upcoming);

  return <BookingPanel days={days} hasUpcoming={hasUpcoming} />;
}

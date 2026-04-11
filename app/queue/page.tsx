import type { Metadata } from "next";
import { QueuePageContent } from "@/components/queue-page-content";
import { BOOKING_WINDOW_DAYS } from "@/lib/queue";
import { site } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Patient queue",
  description: `Join ${site.name}'s patient queue for an available day in the next ${BOOKING_WINDOW_DAYS} days.`,
};

export default async function QueuePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.rpc("queue_availability_30_days");
  const availability = Array.isArray(data) ? data : [];

  return <QueuePageContent days={availability} />;
}

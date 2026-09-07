import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AdminRosterClient,
  type RosterRow,
} from "@/components/admin-roster-client";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { toIsoDateInTimeZone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type Props = { searchParams?: Promise<{ date?: string }> };

export default async function AdminRosterPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const params = (await searchParams) ?? {};
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : toIsoDateInTimeZone();

  const supabase = createSupabaseServiceClient();
  const { data: entries } = await supabase.rpc("admin_day_roster", {
    p_date: date,
  });

  const list = (Array.isArray(entries) ? entries : []) as RosterRow[];

  return <AdminRosterClient date={date} initialRows={list} />;
}

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { toIsoDateInTimeZone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const date =
    url.searchParams.get("date") &&
    /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("date")!)
      ? url.searchParams.get("date")!
      : toIsoDateInTimeZone();

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("admin_day_roster", {
    p_date: date,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ date, entries: data ?? [] });
}

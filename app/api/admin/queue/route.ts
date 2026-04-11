import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dateToIsoDay, getDateWindowUtc } from "@/lib/queue";

function getRequestedDate(searchParams: URLSearchParams) {
  const candidate = searchParams.get("date");
  if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }
  const { start } = getDateWindowUtc();
  return dateToIsoDay(start);
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const date = getRequestedDate(url.searchParams);
  const supabase = createSupabaseServerClient();

  const [
    { data: summary, error: summaryError },
    { data: entries, error: entriesError },
  ] = await Promise.all([
    supabase.rpc("admin_queue_summary", { p_date: date }),
    supabase.rpc("admin_queue_for_date", { p_date: date }),
  ]);

  if (summaryError || entriesError) {
    return NextResponse.json(
      {
        error:
          summaryError?.message ||
          entriesError?.message ||
          "Unable to load admin queue data.",
      },
      { status: 500 },
    );
  }

  const row = Array.isArray(summary) ? summary[0] : null;
  return NextResponse.json({
    date,
    summary: row ?? {
      total_for_day: 0,
      remaining_slots: 50,
      next_queue_number: 1,
      upcoming_total: 0,
    },
    entries: entries ?? [],
  });
}

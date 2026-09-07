import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get("date");
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("list_availability", {
    p_date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ days: data ?? [] });
}

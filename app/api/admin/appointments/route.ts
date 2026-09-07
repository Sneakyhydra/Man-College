import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { userId?: string; date?: string; slotId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!body.userId || !body.date || !body.slotId) {
    return NextResponse.json(
      { error: "userId, date, and slotId are required." },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("admin_book_appointment", {
    p_user_id: body.userId,
    p_date: body.date,
    p_slot_id: body.slotId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ appointment: data });
}

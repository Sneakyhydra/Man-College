import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { normalizeIndianPhone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ patients: [] });
  }

  const supabase = createSupabaseServiceClient();
  const phone = normalizeIndianPhone(q);
  let query = supabase
    .from("profiles")
    .select(
      "id, phone, full_name, date_of_birth, gender, hospital_reference_id, profile_completed_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (phone) {
    query = query.eq("phone", phone);
  } else {
    query = query.or(
      `phone.ilike.%${q}%,full_name.ilike.%${q}%,hospital_reference_id.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ patients: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { userId?: string; hospitalReferenceId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId required." }, { status: 400 });
  }

  const ref =
    body.hospitalReferenceId === undefined
      ? undefined
      : body.hospitalReferenceId?.trim() || null;

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ hospital_reference_id: ref })
    .eq("id", body.userId)
    .select(
      "id, phone, full_name, date_of_birth, gender, hospital_reference_id, profile_completed_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ patient: data });
}

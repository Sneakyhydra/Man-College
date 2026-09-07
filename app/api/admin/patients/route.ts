import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import {
  normalizeIndianPhone,
  type Gender,
} from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const GENDERS: Gender[] = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
];

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    phone?: string;
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    hospitalReferenceId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const phone = normalizeIndianPhone(body.phone ?? "");
  const fullName = body.fullName?.trim() ?? "";
  const dateOfBirth = body.dateOfBirth?.trim() ?? "";
  const gender = body.gender?.trim() ?? "";
  const hospitalReferenceId =
    body.hospitalReferenceId?.trim() || null;

  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Indian mobile number." },
      { status: 400 },
    );
  }
  if (fullName.length < 2) {
    return NextResponse.json(
      { error: "Please enter a valid full name." },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return NextResponse.json(
      { error: "Please enter a valid date of birth." },
      { status: 400 },
    );
  }
  if (!GENDERS.includes(gender as Gender)) {
    return NextResponse.json(
      { error: "Please select a gender." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();

  const { data: existingByPhone } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existingByPhone) {
    return NextResponse.json(
      { error: "A patient with this phone number already exists." },
      { status: 409 },
    );
  }

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
      user_metadata: { phone },
    });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || "Could not create auth user." },
      { status: 400 },
    );
  }

  const userId = created.user.id;
  const nowIso = new Date().toISOString();

  const { data: patient, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        phone,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        gender,
        preferred_locale: "hi",
        profile_completed_at: nowIso,
        hospital_reference_id: hospitalReferenceId,
      },
      { onConflict: "id" },
    )
    .select(
      "id, phone, full_name, date_of_birth, gender, hospital_reference_id, profile_completed_at",
    )
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ patient }, { status: 201 });
}

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

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BOOKING_WINDOW_DAYS,
  dateToIsoDay,
  getDateWindowUtc,
  isQueueDateWithinWindow,
  isValidMobileNumber,
  isValidPatientId,
} from "@/lib/queue";

function getRequestedDate(searchParams: URLSearchParams) {
  const candidate = searchParams.get("date");
  if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }
  const { start } = getDateWindowUtc();
  return dateToIsoDay(start);
}

async function assertAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function GET(request: Request) {
  if (!(await assertAdminSession())) {
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

type AdminAddBody = {
  patientId?: string;
  isNewPatient?: boolean;
  name?: string;
  mobile?: string;
  queueDate?: string;
};

export async function POST(request: Request) {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: AdminAddBody;
  try {
    body = (await request.json()) as AdminAddBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const patientId = body.patientId?.trim() ?? "";
  const isNewPatient = Boolean(body.isNewPatient);
  const name = body.name?.trim() ?? "";
  const mobile = body.mobile?.trim() ?? "";
  const queueDate = body.queueDate?.trim() ?? "";

  if (!isNewPatient && !isValidPatientId(patientId)) {
    return NextResponse.json(
      {
        error: "Patient ID must be 4-40 characters (letters, numbers, _ or -).",
      },
      { status: 400 },
    );
  }
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter a valid patient name." },
      { status: 400 },
    );
  }
  if (!isValidMobileNumber(mobile)) {
    return NextResponse.json(
      { error: "Please enter a valid mobile number." },
      { status: 400 },
    );
  }
  if (!isQueueDateWithinWindow(queueDate)) {
    return NextResponse.json(
      {
        error: `Queue date must be within the next ${BOOKING_WINDOW_DAYS} days.`,
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_enqueue_patient", {
    p_patient_id: patientId || null,
    p_name: name,
    p_mobile: mobile,
    p_queue_date: queueDate,
    p_is_new_patient: isNewPatient,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Could not add patient to queue." },
      { status: 400 },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json(
      { error: "Unexpected response while adding patient." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Patient added by admin.",
    queueDate: row.queue_date as string,
    queueNumber: row.queue_number as number,
    entryId: row.entry_id as number,
  });
}

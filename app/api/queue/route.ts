import { NextResponse } from "next/server";
import {
  BOOKING_WINDOW_DAYS,
  MAX_QUEUE_PER_DAY,
  isQueueDateWithinWindow,
  isValidMobileNumber,
  isValidPatientId,
} from "@/lib/queue";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QueueRequestBody = {
  patientId?: string;
  systemPatientId?: string;
  isNewPatient?: boolean;
  name?: string;
  mobile?: string;
  queueDate?: string;
};

export async function POST(request: Request) {
  let body: QueueRequestBody;

  try {
    body = (await request.json()) as QueueRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const patientId = (body.patientId ?? body.systemPatientId ?? "").trim();
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
  const { data, error } = await supabase.rpc("enqueue_patient", {
    p_patient_id: patientId || null,
    p_name: name,
    p_mobile: mobile,
    p_queue_date: queueDate,
    p_is_new_patient: isNewPatient,
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message || "Could not add patient to queue. Please try again.",
      },
      { status: 400 },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json(
      { error: "Unexpected queue response from server." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message:
      row.was_existing === true
        ? "Patient is already in queue. Showing existing queue details."
        : "Patient added to queue successfully.",
    queueDate: row.queue_date as string,
    queueNumber: row.queue_number as number,
    entryId: row.entry_id as number,
    alreadyQueued: row.was_existing === true,
    maxPerDay: MAX_QUEUE_PER_DAY,
  });
}

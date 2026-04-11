import { NextResponse } from "next/server";
import {
  BOOKING_WINDOW_DAYS,
  isQueueDateWithinWindow,
  isValidMobileNumber,
  isValidPatientId,
} from "@/lib/queue";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ManageAction = "cancel" | "reschedule";

type ManageBody = {
  action?: ManageAction;
  patientId?: string;
  isNewPatient?: boolean;
  mobile?: string;
  newQueueDate?: string;
};

export async function POST(request: Request) {
  let body: ManageBody;
  try {
    body = (await request.json()) as ManageBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const action = body.action;
  const isNewPatient = Boolean(body.isNewPatient);
  const patientId = body.patientId?.trim() ?? "";
  const mobile = body.mobile?.trim() ?? "";
  const newQueueDate = body.newQueueDate?.trim() ?? "";

  if (action !== "cancel" && action !== "reschedule") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  if (!isNewPatient && !isValidPatientId(patientId)) {
    return NextResponse.json(
      {
        error: "Patient ID must be 4-40 characters (letters, numbers, _ or -).",
      },
      { status: 400 },
    );
  }
  if (!isValidMobileNumber(mobile)) {
    return NextResponse.json(
      { error: "Please enter a valid mobile number." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();

  if (action === "cancel") {
    const { data, error } = await supabase.rpc("patient_cancel_queue", {
      p_patient_id: patientId || null,
      p_mobile: mobile,
      p_is_new_patient: isNewPatient,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      message: "Appointment cancelled successfully.",
      queueDate: row?.queue_date as string,
      queueNumber: row?.queue_number as number,
      entryId: row?.entry_id as number,
    });
  }

  if (!isQueueDateWithinWindow(newQueueDate)) {
    return NextResponse.json(
      {
        error: `New date must be within the next ${BOOKING_WINDOW_DAYS} days.`,
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("patient_reschedule_queue", {
    p_patient_id: patientId || null,
    p_mobile: mobile,
    p_is_new_patient: isNewPatient,
    p_new_queue_date: newQueueDate,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    message: "Appointment rescheduled successfully.",
    oldQueueDate: row?.old_queue_date as string,
    newQueueDate: row?.new_queue_date as string,
    newQueueNumber: row?.new_queue_number as number,
    entryId: row?.entry_id as number,
  });
}

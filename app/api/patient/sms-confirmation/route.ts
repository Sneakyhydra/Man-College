import { NextResponse } from "next/server";
import { sendAppointmentSms } from "@/lib/appointment-sms";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { appointmentId?: number; kind?: "booked" | "cancelled" | "rescheduled" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (
    !body.appointmentId ||
    !body.kind ||
    !["booked", "cancelled", "rescheduled"].includes(body.kind)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await sendAppointmentSms({
      appointmentId: body.appointmentId,
      kind: body.kind,
      requireUserId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("patient SMS confirmation failed", err);
    return NextResponse.json(
      {
        success: false,
        warning: err instanceof Error ? err.message : "SMS failed",
      },
      { status: 200 },
    );
  }
}

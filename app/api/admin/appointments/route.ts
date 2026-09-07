import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { sendAppointmentSms } from "@/lib/appointment-sms";
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

  let smsWarning: string | null = null;
  const appointmentId =
    data && typeof data === "object" && "id" in data
      ? Number((data as { id: number }).id)
      : null;
  if (appointmentId) {
    try {
      await sendAppointmentSms({ appointmentId, kind: "booked" });
    } catch (err) {
      smsWarning = err instanceof Error ? err.message : "SMS failed";
      console.error("admin book SMS failed", err);
    }
  }

  return NextResponse.json({ appointment: data, smsWarning });
}

export async function PATCH(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    appointmentId?: number;
    action?: "cancel" | "set_status";
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!body.appointmentId || !body.action) {
    return NextResponse.json(
      { error: "appointmentId and action are required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();

  if (body.action === "cancel") {
    const { data, error } = await supabase.rpc("admin_cancel_appointment", {
      p_appointment_id: body.appointmentId,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    let smsWarning: string | null = null;
    try {
      await sendAppointmentSms({
        appointmentId: body.appointmentId,
        kind: "cancelled",
      });
    } catch (err) {
      smsWarning = err instanceof Error ? err.message : "SMS failed";
      console.error("admin cancel SMS failed", err);
    }
    return NextResponse.json({ appointment: data, smsWarning });
  }

  if (body.action === "set_status") {
    if (!body.status) {
      return NextResponse.json({ error: "status required." }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("admin_set_appointment_status", {
      p_appointment_id: body.appointmentId,
      p_status: body.status,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ appointment: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

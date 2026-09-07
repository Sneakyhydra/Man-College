import { formatSlotRange } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import {
  bookingConfirmationMessage,
  cancelConfirmationMessage,
  rescheduleConfirmationMessage,
  sendSms,
} from "@/lib/sms";

type Kind = "booked" | "cancelled" | "rescheduled";

export async function sendAppointmentSms(opts: {
  appointmentId: number;
  kind: Kind;
  /** When set, must match appointment.user_id */
  requireUserId?: string;
}) {
  const supabase = createSupabaseServiceClient();
  const { data: appt, error } = await supabase
    .from("appointments")
    .select("id, user_id, appointment_date, slot_id, token_number, status")
    .eq("id", opts.appointmentId)
    .maybeSingle();

  if (error || !appt) {
    throw new Error(error?.message || "Appointment not found.");
  }
  if (opts.requireUserId && appt.user_id !== opts.requireUserId) {
    throw new Error("Forbidden.");
  }

  const [{ data: profile }, { data: slot }] = await Promise.all([
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", appt.user_id)
      .maybeSingle(),
    supabase
      .from("slot_definitions")
      .select("start_time, end_time")
      .eq("id", appt.slot_id)
      .maybeSingle(),
  ]);

  if (!profile?.phone || !slot?.start_time || !slot?.end_time) {
    throw new Error("Missing phone or slot for SMS.");
  }

  const slotLabel = formatSlotRange(slot.start_time, slot.end_time);
  const payload = {
    date: appt.appointment_date,
    slotLabel,
    token: appt.token_number,
  };

  let body: string;
  if (opts.kind === "cancelled") {
    body = cancelConfirmationMessage(payload);
  } else if (opts.kind === "rescheduled") {
    body = rescheduleConfirmationMessage(payload);
  } else {
    body = bookingConfirmationMessage(payload);
  }

  await sendSms(profile.phone, body);
}

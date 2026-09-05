import { NextResponse } from "next/server";
import { formatSlotRange, toIsoDateInTimeZone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reminderMessage, sendSms } from "@/lib/sms";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: settings } = await supabase
    .from("schedule_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.reminders_enabled) {
    return NextResponse.json({ skipped: true, reason: "reminders disabled" });
  }

  const nowIst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const hour = nowIst.getHours();
  const today = toIsoDateInTimeZone();
  const tomorrowDate = new Date(`${today}T12:00:00+05:30`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toIsoDateInTimeZone(tomorrowDate);

  const results: {
    sent: number;
    dayBeforeSent: number;
    sameDaySent: number;
    errors: string[];
  } = { sent: 0, dayBeforeSent: 0, sameDaySent: 0, errors: [] };

  async function processBatch(
    date: string,
    kind: "day_before" | "same_day",
    column: "reminder_day_before_sent_at" | "reminder_same_day_sent_at",
  ) {
    const { data: rows, error } = await supabase
      .from("appointments")
      .select(
        "id, token_number, appointment_date, slot_id, user_id, reminder_day_before_sent_at, reminder_same_day_sent_at",
      )
      .eq("appointment_date", date)
      .eq("status", "booked")
      .is(column, null)
      .limit(100);

    if (error) {
      results.errors.push(error.message);
      return;
    }

    for (const row of rows ?? []) {
      const [{ data: profile }, { data: slot }] = await Promise.all([
        supabase
          .from("profiles")
          .select("phone")
          .eq("id", row.user_id)
          .maybeSingle(),
        supabase
          .from("slot_definitions")
          .select("start_time, end_time")
          .eq("id", row.slot_id)
          .maybeSingle(),
      ]);

      if (!profile?.phone || !slot?.start_time || !slot?.end_time) continue;

      const body = reminderMessage({
        date: row.appointment_date,
        slotLabel: formatSlotRange(slot.start_time, slot.end_time),
        token: row.token_number,
        kind,
      });

      try {
        await sendSms(profile.phone, body);
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ [column]: new Date().toISOString() })
          .eq("id", row.id);
        if (updateError) {
          results.errors.push(updateError.message);
          continue;
        }
        results.sent += 1;
        if (kind === "day_before") results.dayBeforeSent += 1;
        else results.sameDaySent += 1;
      } catch (err) {
        results.errors.push(
          err instanceof Error ? err.message : "SMS send failed",
        );
      }
    }
  }

  // Hobby plan: one cron per day — send both reminder types in this run.
  // (hour fields in admin are informational until you upgrade for multi-run crons)
  await processBatch(tomorrow, "day_before", "reminder_day_before_sent_at");
  await processBatch(today, "same_day", "reminder_same_day_sent_at");

  return NextResponse.json({
    hour,
    today,
    tomorrow,
    scheduleNote: "Runs once daily (Vercel Hobby). Sends day-before + same-day.",
    ...results,
  });
}

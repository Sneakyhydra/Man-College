import { formatSlotRange, toIsoDateInTimeZone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reminderMessage, sendSms } from "@/lib/sms";

export type ReminderRunResult = {
  skipped?: boolean;
  reason?: string;
  hour: number;
  today: string;
  tomorrow: string;
  scheduleNote: string;
  sent: number;
  dayBeforeSent: number;
  sameDaySent: number;
  errors: string[];
  runId?: number;
};

export async function runReminderJob(): Promise<ReminderRunResult> {
  const supabase = createSupabaseServiceClient();

  const { data: runInsert, error: runInsertError } = await supabase
    .from("reminder_runs")
    .insert({ meta: { source: "cron" } })
    .select("id")
    .maybeSingle();

  if (runInsertError) {
    throw new Error(runInsertError.message);
  }

  const runId = runInsert?.id as number | undefined;

  const { data: settings } = await supabase
    .from("schedule_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const nowIst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const hour = nowIst.getHours();
  const today = toIsoDateInTimeZone();
  const tomorrowDate = new Date(`${today}T12:00:00+05:30`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toIsoDateInTimeZone(tomorrowDate);

  const baseMeta = {
    hour,
    today,
    tomorrow,
    scheduleNote:
      "Runs once daily (Vercel Hobby). Sends day-before + same-day.",
  };

  if (!settings?.reminders_enabled) {
    if (runId) {
      await supabase
        .from("reminder_runs")
        .update({
          finished_at: new Date().toISOString(),
          meta: { ...baseMeta, skipped: true, reason: "reminders disabled" },
        })
        .eq("id", runId);
    }
    return {
      skipped: true,
      reason: "reminders disabled",
      ...baseMeta,
      sent: 0,
      dayBeforeSent: 0,
      sameDaySent: 0,
      errors: [],
      runId,
    };
  }

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
    const pageSize = 100;
    for (;;) {
      const { data: rows, error } = await supabase
        .from("appointments")
        .select(
          "id, token_number, appointment_date, slot_id, user_id, reminder_day_before_sent_at, reminder_same_day_sent_at",
        )
        .eq("appointment_date", date)
        .eq("status", "booked")
        .is(column, null)
        .order("id", { ascending: true })
        .limit(pageSize);

      if (error) {
        results.errors.push(error.message);
        return;
      }

      if (!rows?.length) return;

      for (const row of rows) {
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

      if (rows.length < pageSize) return;
    }
  }

  await processBatch(tomorrow, "day_before", "reminder_day_before_sent_at");
  await processBatch(today, "same_day", "reminder_same_day_sent_at");

  if (runId) {
    await supabase
      .from("reminder_runs")
      .update({
        finished_at: new Date().toISOString(),
        day_before_sent: results.dayBeforeSent,
        same_day_sent: results.sameDaySent,
        error_count: results.errors.length,
        errors: results.errors.slice(0, 50),
        meta: baseMeta,
      })
      .eq("id", runId);
  }

  return { ...baseMeta, ...results, runId };
}

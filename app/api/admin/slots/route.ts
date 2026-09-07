import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { toIsoDateInTimeZone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const [
    { data: slots, error: slotsError },
    { data: settings, error: settingsError },
    { data: closedDates, error: closedError },
    { data: lastReminderRun },
  ] = await Promise.all([
    supabase
      .from("slot_definitions")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.from("schedule_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("closed_dates")
      .select("*")
      .gte("date", toIsoDateInTimeZone())
      .order("date", { ascending: true }),
    supabase
      .from("reminder_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (slotsError || settingsError || closedError) {
    return NextResponse.json(
      {
        error:
          slotsError?.message ||
          settingsError?.message ||
          closedError?.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    slots: slots ?? [],
    settings,
    closedDates: closedDates ?? [],
    lastReminderRun: lastReminderRun ?? null,
  });
}

async function slotHasActiveBookings(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  slotId: number,
) {
  const today = toIsoDateInTimeZone();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", slotId)
    .neq("status", "cancelled")
    .gte("appointment_date", today);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function PUT(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    settings?: {
      booking_window_days?: number;
      reminder_day_before_hour?: number;
      reminder_same_day_hour?: number;
      reminders_enabled?: boolean;
    };
    slots?: Array<{
      id?: number;
      start_time: string;
      end_time: string;
      capacity: number;
      sort_order: number;
      is_active: boolean;
      _delete?: boolean;
    }>;
    closedDates?: {
      add?: { date: string; note?: string | null };
      remove?: string[];
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  if (body.settings) {
    const { error } = await supabase
      .from("schedule_settings")
      .update(body.settings)
      .eq("id", 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (body.closedDates?.add?.date) {
    const date = body.closedDates.add.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid closed date." }, { status: 400 });
    }
    const { error } = await supabase.from("closed_dates").upsert({
      date,
      note: body.closedDates.add.note?.trim() || null,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (body.closedDates?.remove?.length) {
    const { error } = await supabase
      .from("closed_dates")
      .delete()
      .in("date", body.closedDates.remove);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (body.slots) {
    for (const slot of body.slots) {
      if (slot._delete && slot.id) {
        try {
          if (await slotHasActiveBookings(supabase, slot.id)) {
            return NextResponse.json(
              {
                error:
                  "Cannot delete a slot that has active or completed bookings today or in the future.",
              },
              { status: 400 },
            );
          }
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : "Lookup failed" },
            { status: 400 },
          );
        }
        const { error } = await supabase
          .from("slot_definitions")
          .delete()
          .eq("id", slot.id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        continue;
      }

      if (slot.id) {
        try {
          if (await slotHasActiveBookings(supabase, slot.id)) {
            const { data: existing } = await supabase
              .from("slot_definitions")
              .select("start_time, end_time, capacity, sort_order, is_active")
              .eq("id", slot.id)
              .maybeSingle();
            if (existing) {
              const lockedChange =
                existing.start_time !== slot.start_time ||
                existing.end_time !== slot.end_time ||
                existing.capacity !== slot.capacity ||
                existing.sort_order !== slot.sort_order ||
                existing.is_active !== slot.is_active;
              if (lockedChange) {
                return NextResponse.json(
                  {
                    error:
                      "Cannot change a slot that has active bookings today or in the future. Add a new slot instead.",
                  },
                  { status: 400 },
                );
              }
            }
          }
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : "Lookup failed" },
            { status: 400 },
          );
        }

        const { error } = await supabase
          .from("slot_definitions")
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            capacity: slot.capacity,
            sort_order: slot.sort_order,
            is_active: slot.is_active,
          })
          .eq("id", slot.id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } else {
        const { error } = await supabase.from("slot_definitions").insert({
          start_time: slot.start_time,
          end_time: slot.end_time,
          capacity: slot.capacity,
          sort_order: slot.sort_order,
          is_active: slot.is_active,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}

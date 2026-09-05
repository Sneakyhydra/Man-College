import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  const [{ data: slots, error: slotsError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase
        .from("slot_definitions")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase.from("schedule_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

  if (slotsError || settingsError) {
    return NextResponse.json(
      { error: slotsError?.message || settingsError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ slots: slots ?? [], settings });
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

  if (body.slots) {
    for (const slot of body.slots) {
      if (slot._delete && slot.id) {
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

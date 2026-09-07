import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { runReminderJob } from "@/lib/reminder-job";

export async function POST() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runReminderJob();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reminder job failed" },
      { status: 500 },
    );
  }
}

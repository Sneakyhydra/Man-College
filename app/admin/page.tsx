import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminAddPatientForm } from "@/components/admin-add-patient-form";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { dateToIsoDay, getDateWindowUtc } from "@/lib/queue";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  const params = (await searchParams) ?? {};
  const { start, end } = getDateWindowUtc();
  const minDate = dateToIsoDay(start);
  const maxDate = dateToIsoDay(end);
  const selectedDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : minDate;

  const supabase = createSupabaseServerClient();
  const [{ data: summary }, { data: entries }] = await Promise.all([
    supabase.rpc("admin_queue_summary", { p_date: selectedDate }),
    supabase.rpc("admin_queue_for_date", { p_date: selectedDate }),
  ]);

  const row = Array.isArray(summary) ? summary[0] : null;
  const stats = row ?? {
    total_for_day: 0,
    remaining_slots: 50,
    next_queue_number: 1,
    upcoming_total: 0,
  };
  const list = Array.isArray(entries) ? entries : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.15em] text-accent">
            Admin dashboard
          </p>
          <h1 className="font-serif-display text-3xl font-semibold text-foreground">
            Queue operations
          </h1>
        </div>
        <AdminLogoutButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          method="GET"
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <label
            htmlFor="admin-date"
            className="text-sm font-medium text-foreground"
          >
            Select day
          </label>
          <div className="mt-1 flex flex-wrap items-end gap-3">
            <input
              id="admin-date"
              name="date"
              type="date"
              defaultValue={selectedDate}
              min={minDate}
              max={maxDate}
              className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-72"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
            >
              View
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-serif-display text-xl font-semibold">
            Add patient
          </h2>
          <p className="mt-1 text-sm text-muted">
            Admin entries are not limited by the 50/day cap. You can add 51st+
            patients if required.
          </p>
          <div className="mt-3">
            <AdminAddPatientForm defaultDate={selectedDate} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered for selected day"
          value={stats.total_for_day}
        />
        <StatCard label="Remaining slots" value={stats.remaining_slots} />
        <StatCard label="Next queue number" value={stats.next_queue_number} />
        <StatCard
          label="Upcoming patients (all days)"
          value={stats.upcoming_total}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-serif-display text-xl font-semibold">
            Patients for {selectedDate}
          </h2>
        </div>
        {list.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">
            No patients registered for this day.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left text-muted">
                  <th className="px-4 py-3 font-medium">Queue #</th>
                  <th className="px-4 py-3 font-medium">Patient Name</th>
                  <th className="px-4 py-3 font-medium">Patient ID</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {list.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold text-accent">
                      {entry.queue_number}
                    </td>
                    <td className="px-4 py-3">{entry.patient_name}</td>
                    <td className="px-4 py-3 text-muted">
                      {entry.patient_id ?? "New patient"}
                    </td>
                    <td className="px-4 py-3">{entry.mobile_number}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-serif-display text-3xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

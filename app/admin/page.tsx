import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { formatSlotRange, toIsoDateInTimeZone } from "@/lib/appointments";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type Props = { searchParams?: Promise<{ date?: string }> };

export default async function AdminRosterPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const params = (await searchParams) ?? {};
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : toIsoDateInTimeZone();

  const supabase = createSupabaseServiceClient();
  const { data: entries } = await supabase.rpc("admin_day_roster", {
    p_date: date,
  });

  const list = Array.isArray(entries) ? entries : [];

  return (
    <div className="mx-auto my-auto w-full max-w-5xl py-8">
      <AdminNav />
      <h1 className="text-2xl font-semibold">Day roster</h1>
      <form method="GET" className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="date" className="text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="mt-1 block rounded-xl border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Load
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-stone-50 text-muted">
            <tr>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2">Slot</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Reference ID</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-muted">
                  No bookings for this day.
                </td>
              </tr>
            ) : (
              list.map((row) => (
                <tr key={row.appointment_id} className="border-b border-border">
                  <td className="px-3 py-2 font-semibold text-accent">
                    {row.token_number}
                  </td>
                  <td className="px-3 py-2">
                    {formatSlotRange(row.start_time, row.end_time)}
                  </td>
                  <td className="px-3 py-2">{row.full_name || "—"}</td>
                  <td className="px-3 py-2">{row.phone || "—"}</td>
                  <td className="px-3 py-2">
                    {row.hospital_reference_id || (
                      <Link
                        href={`/admin/patients?q=${encodeURIComponent(row.phone || "")}`}
                        className="text-accent"
                      >
                        Link…
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { formatSlotRange } from "@/lib/appointments";

export type RosterRow = {
  appointment_id: number;
  token_number: number;
  status: string;
  slot_id: number;
  start_time: string;
  end_time: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  hospital_reference_id: string | null;
  gender: string | null;
  date_of_birth: string | null;
  created_at: string;
};

const STATUS_ACTIONS: { status: string; label: string }[] = [
  { status: "booked", label: "Booked" },
  { status: "checked_in", label: "Check in" },
  { status: "completed", label: "Complete" },
  { status: "no_show", label: "No-show" },
];

export function AdminRosterClient({
  date,
  initialRows,
}: {
  date: string;
  initialRows: RosterRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const visible = rows.filter(
    (r) => showCancelled || r.status !== "cancelled",
  );

  async function patch(
    appointmentId: number,
    action: "cancel" | "set_status",
    status?: string,
  ) {
    setBusyId(appointmentId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, action, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const next = data.appointment as RosterRow | undefined;
      if (next && typeof next === "object" && "id" in next) {
        const appt = next as unknown as {
          id: number;
          status: string;
          token_number: number;
        };
        setRows((prev) =>
          prev.map((r) =>
            r.appointment_id === appointmentId
              ? { ...r, status: appt.status, token_number: appt.token_number }
              : r,
          ),
        );
      } else if (action === "cancel") {
        setRows((prev) =>
          prev.map((r) =>
            r.appointment_id === appointmentId
              ? { ...r, status: "cancelled" }
              : r,
          ),
        );
      } else if (status) {
        setRows((prev) =>
          prev.map((r) =>
            r.appointment_id === appointmentId ? { ...r, status } : r,
          ),
        );
      }
      if (data.smsWarning) {
        setMessage(`Updated (SMS warning: ${data.smsWarning})`);
      } else {
        setMessage("Updated.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

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
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
          />
          Show cancelled
        </label>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-stone-50 text-muted">
            <tr>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2">Slot</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Reference ID</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted">
                  No bookings for this day.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.appointment_id}
                  className="border-b border-border align-top"
                >
                  <td className="px-3 py-2 font-semibold text-accent">
                    {row.token_number}
                  </td>
                  <td className="px-3 py-2">
                    {formatSlotRange(row.start_time, row.end_time)}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {row.status.replace("_", " ")}
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
                  <td className="px-3 py-2">
                    {row.status === "cancelled" ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {STATUS_ACTIONS.filter(
                          (a) => a.status !== row.status,
                        ).map((a) => (
                          <button
                            key={a.status}
                            type="button"
                            disabled={busyId === row.appointment_id}
                            onClick={() =>
                              void patch(
                                row.appointment_id,
                                "set_status",
                                a.status,
                              )
                            }
                            className="rounded-full border border-border px-2 py-1 text-xs font-medium disabled:opacity-50"
                          >
                            {a.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={busyId === row.appointment_id}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Cancel token ${row.token_number}? Number stays retired.`,
                              )
                            ) {
                              void patch(row.appointment_id, "cancel");
                            }
                          }}
                          className="rounded-full border border-red-200 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {message ? <p className="mt-4 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

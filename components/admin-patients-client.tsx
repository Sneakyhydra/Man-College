"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin-nav";

type Patient = {
  id: string;
  phone: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  hospital_reference_id: string | null;
  profile_completed_at: string | null;
};

export function AdminPatientsClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialQuery.trim().length >= 3) {
      void search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for deep-link query
  }, []);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patients?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setPatients(data.patients ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRef(userId: string, hospitalReferenceId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/patients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          hospitalReferenceId: hospitalReferenceId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setPatients((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, ...data.patient } : p)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminNav />
      <h1 className="text-2xl font-semibold">Patients</h1>
      <p className="mt-1 text-sm text-muted">
        Search by phone, name, or reference ID. Link the hospital system ID here.
      </p>

      <form onSubmit={search} className="mt-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Phone or name"
          className="min-w-[16rem] flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <ul className="mt-6 space-y-4">
        {patients.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-border bg-card p-4 text-sm"
          >
            <p className="font-semibold">{p.full_name || "Unnamed"}</p>
            <p className="text-muted">{p.phone}</p>
            <p className="text-muted">
              DOB: {p.date_of_birth || "—"} · Gender: {p.gender || "—"}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="flex-1 text-xs">
                Hospital reference ID
                <input
                  defaultValue={p.hospital_reference_id ?? ""}
                  id={`ref-${p.id}`}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const el = document.getElementById(
                    `ref-${p.id}`,
                  ) as HTMLInputElement | null;
                  saveRef(p.id, el?.value ?? "");
                }}
                className="rounded-full border border-border px-3 py-2 text-sm font-medium"
              >
                Save
              </button>
            </div>
          </li>
        ))}
      </ul>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

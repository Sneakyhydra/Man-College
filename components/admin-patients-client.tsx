"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import {
  formatSlotRange,
  type AvailabilityRow,
  type Gender,
} from "@/lib/appointments";

type Patient = {
  id: string;
  phone: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  hospital_reference_id: string | null;
  profile_completed_at: string | null;
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function AdminPatientsClient({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createPhone, setCreatePhone] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDob, setCreateDob] = useState("");
  const [createGender, setCreateGender] = useState<Gender | "">("");
  const [createRef, setCreateRef] = useState("");

  const [bookingUserId, setBookingUserId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookDate, setBookDate] = useState("");
  const [busySlot, setBusySlot] = useState<number | null>(null);

  useEffect(() => {
    if (initialQuery.trim().length >= 3) {
      void search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for deep-link query
  }, []);

  const dateOptions = useMemo(
    () => [...new Set(availability.map((d) => d.appointment_date))],
    [availability],
  );

  const effectiveDate =
    bookDate && dateOptions.includes(bookDate)
      ? bookDate
      : (dateOptions[0] ?? "");
  const slots = availability.filter(
    (d) => d.appointment_date === effectiveDate,
  );

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
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

  async function createPatient(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!createGender) throw new Error("Please select a gender.");
      const res = await fetch("/api/admin/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: createPhone,
          fullName: createName,
          dateOfBirth: createDob,
          gender: createGender,
          hospitalReferenceId: createRef.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setMessage(`Created profile for ${data.patient?.full_name || "patient"}.`);
      setPatients((prev) => [data.patient, ...prev.filter((p) => p.id !== data.patient.id)]);
      setCreatePhone("");
      setCreateName("");
      setCreateDob("");
      setCreateGender("");
      setCreateRef("");
      if (data.patient?.phone) setQ(data.patient.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRef(userId: string, hospitalReferenceId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
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
      setMessage("Hospital reference ID saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function openBooking(userId: string) {
    setError(null);
    setMessage(null);
    setBookingUserId(userId);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/availability");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load slots");
      const days = (data.days ?? []) as AvailabilityRow[];
      setAvailability(days);
      const first = days[0]?.appointment_date ?? "";
      setBookDate(first);
    } catch (err) {
      setBookingUserId(null);
      setError(err instanceof Error ? err.message : "Could not load slots");
    } finally {
      setBusy(false);
    }
  }

  async function bookForPatient(slotId: number) {
    if (!bookingUserId || !effectiveDate) return;
    setBusySlot(slotId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: bookingUserId,
          date: effectiveDate,
          slotId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      const token = data.appointment?.token_number;
      setMessage(
        token != null
          ? `Appointment booked (token ${token}). Capacity limits do not apply to admin bookings.`
          : "Appointment booked.",
      );
      setBookingUserId(null);
      setAvailability([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="mx-auto my-auto w-full max-w-5xl py-8">
      <AdminNav />
      <h1 className="text-2xl font-semibold">Patients</h1>
      <p className="mt-1 text-sm text-muted">
        Create profiles, link hospital IDs, and book appointments on a
        patient&apos;s behalf (no capacity limit).
      </p>

      <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Create patient</h2>
        <form
          onSubmit={createPatient}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="text-xs sm:col-span-1">
            Phone
            <input
              required
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="10-digit mobile"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs sm:col-span-1">
            Full name
            <input
              required
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs sm:col-span-1">
            Date of birth
            <input
              required
              type="date"
              value={createDob}
              onChange={(e) => setCreateDob(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs sm:col-span-1">
            Gender
            <select
              required
              value={createGender}
              onChange={(e) => setCreateGender(e.target.value as Gender | "")}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs sm:col-span-2">
            Hospital reference ID (optional)
            <input
              value={createRef}
              onChange={(e) => setCreateRef(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Create profile
            </button>
          </div>
        </form>
      </section>

      <form onSubmit={search} className="mt-6 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Phone or name"
          className="min-w-[16rem] flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{p.full_name || "Unnamed"}</p>
                <p className="text-muted">{p.phone}</p>
                <p className="text-muted">
                  DOB: {p.date_of_birth || "—"} · Gender: {p.gender || "—"}
                </p>
                {!p.profile_completed_at ? (
                  <p className="mt-1 text-amber-700">Profile incomplete</p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={busy || !p.profile_completed_at}
                onClick={() => openBooking(p.id)}
                className="rounded-full border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Book appointment
              </button>
            </div>

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
                  void saveRef(p.id, el?.value ?? "");
                }}
                className="rounded-full border border-border px-3 py-2 text-sm font-medium"
              >
                Save
              </button>
            </div>

            {bookingUserId === p.id ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Book on behalf of patient</p>
                  <button
                    type="button"
                    className="text-sm text-muted underline-offset-2 hover:underline"
                    onClick={() => {
                      setBookingUserId(null);
                      setAvailability([]);
                    }}
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-muted">
                  Admin bookings ignore slot capacity. Patient self-booking
                  limits still apply.
                </p>
                {dateOptions.length === 0 ? (
                  <p className="text-muted">No bookable slots in the window.</p>
                ) : (
                  <>
                    <label className="block text-xs">
                      Date
                      <select
                        value={effectiveDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        className="mt-1 w-full max-w-xs rounded-xl border border-border px-3 py-2 text-sm"
                      >
                        {dateOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </label>
                    <ul className="space-y-2">
                      {slots.map((slot) => {
                        const full = slot.booked_count >= slot.capacity;
                        return (
                          <li
                            key={`${slot.appointment_date}-${slot.slot_id}`}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                          >
                            <div>
                              <p className="font-medium">
                                {formatSlotRange(slot.start_time, slot.end_time)}
                              </p>
                              <p className="text-xs text-muted">
                                {slot.booked_count}/{slot.capacity} booked
                                {full ? " · over capacity allowed" : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busySlot !== null}
                              onClick={() => void bookForPatient(slot.slot_id)}
                              className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {busySlot === slot.slot_id
                                ? "Booking…"
                                : full
                                  ? "Book anyway"
                                  : "Book"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {message ? <p className="mt-4 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AvailabilityMonthCalendar } from "@/components/availability-month-calendar";
import { usePatientLocale } from "@/components/patient-locale-provider";
import {
  formatSlotRange,
  type AvailabilityRow,
} from "@/lib/appointments";
import { createClient } from "@/lib/supabase/client";

export type UpcomingAppointment = {
  appointment_id: number;
  appointment_date: string;
  slot_id: number;
  start_time: string;
  end_time: string;
  token_number: number;
  hospital_reference_id: string | null;
  full_name: string | null;
  phone: string | null;
};

function normalizeUpcoming(data: unknown): UpcomingAppointment | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;

  const appointmentId = value.appointment_id ?? value.id;
  if (
    typeof appointmentId !== "number" ||
    typeof value.appointment_date !== "string" ||
    typeof value.slot_id !== "number" ||
    typeof value.token_number !== "number"
  ) {
    return null;
  }

  return {
    appointment_id: appointmentId,
    appointment_date: value.appointment_date,
    slot_id: value.slot_id,
    start_time: String(value.start_time ?? ""),
    end_time: String(value.end_time ?? ""),
    token_number: value.token_number,
    hospital_reference_id:
      typeof value.hospital_reference_id === "string"
        ? value.hospital_reference_id
        : null,
    full_name: typeof value.full_name === "string" ? value.full_name : null,
    phone: typeof value.phone === "string" ? value.phone : null,
  };
}

function sameAppointment(
  a: UpcomingAppointment | null,
  b: UpcomingAppointment | null,
) {
  if (a === null && b === null) return true;
  if (!a || !b) return false;
  return (
    a.appointment_id === b.appointment_id &&
    a.appointment_date === b.appointment_date &&
    a.slot_id === b.slot_id &&
    a.token_number === b.token_number
  );
}

async function waitForPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function fetchUpcomingAppointment() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_my_upcoming_appointment");
  if (error) throw error;
  return normalizeUpcoming(data);
}

async function fetchAvailability() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_availability");
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as AvailabilityRow[];
}

export function AppointmentManager({
  appointment,
  availability,
}: {
  appointment: UpcomingAppointment | null;
  availability: AvailabilityRow[];
}) {
  const { t } = usePatientLocale();
  const [current, setCurrent] = useState<UpcomingAppointment | null>(appointment);
  const [days, setDays] = useState<AvailabilityRow[]>(availability);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const dateOptions = useMemo(
    () => [...new Set(days.map((d) => d.appointment_date))],
    [days],
  );
  const [selectedDate, setSelectedDate] = useState(
    () => [...new Set(availability.map((d) => d.appointment_date))][0] ?? "",
  );
  const [busyAction, setBusyAction] = useState<"cancel" | "reschedule" | null>(
    null,
  );
  const [busySlotId, setBusySlotId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // After a mutation, ignore stale server props until they catch up.
  const trustClientRef = useRef(false);

  useEffect(() => {
    if (trustClientRef.current) {
      if (sameAppointment(appointment, current)) {
        trustClientRef.current = false;
      }
      return;
    }
    setCurrent(appointment);
    setDays(availability);
  }, [appointment, availability, current]);

  const effectiveDate =
    selectedDate && dateOptions.includes(selectedDate)
      ? selectedDate
      : (dateOptions[0] ?? "");
  const slots = days.filter((d) => d.appointment_date === effectiveDate);
  const busy = busyAction !== null;

  async function cancelAppt() {
    if (!current) return;
    if (!window.confirm(t.confirmCancel)) return;

    flushSync(() => {
      setBusyAction("cancel");
      setError(null);
      setSuccess(null);
    });
    await waitForPaint();

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("cancel_appointment", {
        p_appointment_id: current.appointment_id,
      });
      if (rpcError) throw rpcError;

      const [next, nextDays] = await Promise.all([
        fetchUpcomingAppointment(),
        fetchAvailability(),
      ]);
      trustClientRef.current = true;
      flushSync(() => {
        setCurrent(next);
        setDays(nextDays);
        setMode("view");
        setSuccess(t.successCancelled);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginError);
    } finally {
      setBusyAction(null);
      setBusySlotId(null);
    }
  }

  async function reschedule(slotId: number) {
    if (!current) return;

    flushSync(() => {
      setBusyAction("reschedule");
      setBusySlotId(slotId);
      setError(null);
      setSuccess(null);
    });
    await waitForPaint();

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("reschedule_appointment", {
        p_appointment_id: current.appointment_id,
        p_new_date: effectiveDate,
        p_new_slot_id: slotId,
      });
      if (rpcError) throw rpcError;

      const [next, nextDays] = await Promise.all([
        fetchUpcomingAppointment(),
        fetchAvailability(),
      ]);
      if (!next) {
        throw new Error(t.loginError);
      }

      trustClientRef.current = true;
      flushSync(() => {
        setCurrent(next);
        setDays(nextDays);
        setMode("view");
        setSuccess(t.successRescheduled);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginError);
    } finally {
      setBusyAction(null);
      setBusySlotId(null);
    }
  }

  return (
    <div className="relative space-y-6">
      {busy ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium shadow-lg">
            <span
              className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent"
              aria-hidden
            />
            {busyAction === "cancel" ? t.cancelling : t.rescheduling}
          </div>
        </div>
      ) : null}

      {!current ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{t.appointmentTitle}</h1>
          {success ? <p className="text-sm text-green-700">{success}</p> : null}
          <p className="text-sm text-muted">{t.noAppointment}</p>
          <Link
            href="/book"
            className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.bookNow}
          </Link>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold">{t.appointmentTitle}</h1>
            {success ? (
              <p className="mt-2 text-sm text-green-700">{success}</p>
            ) : null}
          </div>

          <dl className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                {t.token}
              </dt>
              <dd className="text-3xl font-semibold text-accent">
                {current.token_number}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                {t.date}
              </dt>
              <dd className="font-medium">{current.appointment_date}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                {t.time}
              </dt>
              <dd className="font-medium">
                {formatSlotRange(current.start_time, current.end_time)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                {t.referenceId}
              </dt>
              <dd className="font-medium">
                {current.hospital_reference_id || t.referencePending}
              </dd>
            </div>
          </dl>

          <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
            <p>{t.cashNote}</p>
            <p>{t.lateNote}</p>
          </div>

          {mode === "view" ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setSuccess(null);
                  setMode("reschedule");
                  void fetchAvailability()
                    .then(setDays)
                    .catch(() => {
                      /* keep existing days */
                    });
                }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {t.reschedule}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={cancelAppt}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">{t.pickNewSlot}</h2>
              <AvailabilityMonthCalendar
                days={days}
                selectedDate={effectiveDate}
                onSelectDate={setSelectedDate}
                disabled={busy}
              />
              <ul className="space-y-2">
                {slots.map((slot) => {
                  const slotBusy = busySlotId === slot.slot_id;
                  return (
                    <li
                      key={slot.slot_id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {formatSlotRange(slot.start_time, slot.end_time)}
                        </p>
                        <p className="text-sm text-muted">
                          {slot.can_book
                            ? `${slot.remaining_slots} ${t.remaining}`
                            : t.full}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!slot.can_book || busy}
                        onClick={() => reschedule(slot.slot_id)}
                        className="inline-flex min-w-28 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {slotBusy ? (
                          <>
                            <span
                              className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                              aria-hidden
                            />
                            {t.rescheduling}
                          </>
                        ) : (
                          t.confirmReschedule
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={busy}
                onClick={() => setMode("view")}
                className="text-sm text-muted underline-offset-2 hover:underline disabled:opacity-60"
              >
                ←
              </button>
            </div>
          )}
        </>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

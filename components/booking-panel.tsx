"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityMonthCalendar } from "@/components/availability-month-calendar";
import { usePatientLocale } from "@/components/patient-locale-provider";
import {
  formatSlotRange,
  type AvailabilityRow,
} from "@/lib/appointments";
import { createClient } from "@/lib/supabase/client";

export function BookingPanel({
  days: initialDays,
  hasUpcoming,
}: {
  days: AvailabilityRow[];
  hasUpcoming: boolean;
}) {
  const { t } = usePatientLocale();
  const router = useRouter();
  const [days, setDays] = useState(initialDays);

  useEffect(() => {
    setDays(initialDays);
  }, [initialDays]);

  const dateOptions = useMemo(() => {
    return [...new Set(days.map((d) => d.appointment_date))];
  }, [days]);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0] ?? "");
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const effectiveDate =
    selectedDate && dateOptions.includes(selectedDate)
      ? selectedDate
      : (dateOptions[0] ?? "");
  const slots = days.filter((d) => d.appointment_date === effectiveDate);

  async function book(slotId: number) {
    if (hasUpcoming) {
      setError(t.alreadyBooked);
      return;
    }
    setBusySlot(slotId);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("book_appointment", {
        p_date: effectiveDate,
        p_slot_id: slotId,
      });
      if (rpcError) throw rpcError;
      const appointmentId =
        data && typeof data === "object" && "id" in data
          ? Number((data as { id: number }).id)
          : null;
      if (appointmentId) {
        void fetch("/api/patient/sms-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId, kind: "booked" }),
        });
      }
      setMessage(t.successBooked);
      router.push("/appointments");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginError);
    } finally {
      setBusySlot(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.bookTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.bookSubtitle}</p>
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        <p>{t.cashNote}</p>
        <p>{t.lateNote}</p>
      </div>

      {hasUpcoming ? (
        <div className="rounded-2xl border border-accent/30 bg-accent-subtle p-4 text-sm">
          <p>{t.alreadyBooked}</p>
          <Link
            href="/appointments"
            className="mt-2 inline-flex font-semibold text-accent"
          >
            {t.viewAppointment} →
          </Link>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium">{t.selectDate}</p>
        {dateOptions.length === 0 ? (
          <p className="text-sm text-muted">{t.noSlotsAvailable}</p>
        ) : (
          <AvailabilityMonthCalendar
            days={days}
            selectedDate={effectiveDate}
            onSelectDate={setSelectedDate}
            disabled={hasUpcoming || busySlot !== null}
          />
        )}
      </div>

      {dateOptions.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold">
            {t.slotsFor} {effectiveDate}
          </h2>
          <ul className="mt-3 space-y-2">
            {slots.map((slot) => (
              <li
                key={`${slot.appointment_date}-${slot.slot_id}`}
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
                  disabled={!slot.can_book || hasUpcoming || busySlot !== null}
                  onClick={() => book(slot.slot_id)}
                  className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {busySlot === slot.slot_id ? t.booking : t.bookSlot}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
    </div>
  );
}

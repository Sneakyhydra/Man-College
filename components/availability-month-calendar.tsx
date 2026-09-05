"use client";

import { useMemo, useState } from "react";
import { usePatientLocale } from "@/components/patient-locale-provider";
import type { AvailabilityRow } from "@/lib/appointments";
import type { PatientLocale } from "@/lib/patient-i18n";

export type DayAvailability = {
  date: string;
  remaining: number;
  capacity: number;
  openSlots: number;
};

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function summarizeDays(rows: AvailabilityRow[]): Map<string, DayAvailability> {
  const map = new Map<string, DayAvailability>();
  for (const row of rows) {
    const existing = map.get(row.appointment_date) ?? {
      date: row.appointment_date,
      remaining: 0,
      capacity: 0,
      openSlots: 0,
    };
    existing.remaining += row.remaining_slots;
    existing.capacity += row.capacity;
    if (row.can_book && row.remaining_slots > 0) {
      existing.openSlots += 1;
    }
    map.set(row.appointment_date, existing);
  }
  return map;
}

function monthLabel(date: Date, locale: PatientLocale) {
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

export function AvailabilityMonthCalendar({
  days,
  selectedDate,
  onSelectDate,
  disabled = false,
}: {
  days: AvailabilityRow[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  disabled?: boolean;
}) {
  const { t, locale } = usePatientLocale();
  const dayMap = useMemo(() => summarizeDays(days), [days]);
  const bookableDates = useMemo(
    () =>
      [...dayMap.values()]
        .filter((d) => d.remaining > 0)
        .map((d) => d.date)
        .sort(),
    [dayMap],
  );

  const minDate = bookableDates[0] ?? [...dayMap.keys()].sort()[0];
  const maxDate =
    bookableDates[bookableDates.length - 1] ??
    [...dayMap.keys()].sort().at(-1);

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(parseIsoDate(selectedDate || minDate || toIsoDate(new Date()))),
  );

  const weekdays = locale === "hi" ? WEEKDAYS_HI : WEEKDAYS_EN;

  const cells = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(
      first.getFullYear(),
      first.getMonth() + 1,
      0,
    ).getDate();

    const grid: Array<{
      key: string;
      iso: string | null;
      dayNum: number | null;
      summary: DayAvailability | null;
      inWindow: boolean;
    }> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      grid.push({
        key: `pad-${i}`,
        iso: null,
        dayNum: null,
        summary: null,
        inWindow: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = toIsoDate(date);
      const summary = dayMap.get(iso) ?? null;
      grid.push({
        key: iso,
        iso,
        dayNum: day,
        summary,
        inWindow: Boolean(summary),
      });
    }

    while (grid.length % 7 !== 0) {
      grid.push({
        key: `tail-${grid.length}`,
        iso: null,
        dayNum: null,
        summary: null,
        inWindow: false,
      });
    }

    return grid;
  }, [visibleMonth, dayMap]);

  const canGoPrev =
    minDate &&
    addMonths(visibleMonth, -1) >= startOfMonth(parseIsoDate(minDate));
  const canGoNext =
    maxDate &&
    addMonths(visibleMonth, 1) <= startOfMonth(parseIsoDate(maxDate));

  return (
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={disabled || !canGoPrev}
          onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
          className="rounded-full border border-border px-3 py-1 text-sm disabled:opacity-40"
          aria-label={t.calendarPrev}
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize">
          {monthLabel(visibleMonth, locale)}
        </p>
        <button
          type="button"
          disabled={disabled || !canGoNext}
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="rounded-full border border-border px-3 py-1 text-sm disabled:opacity-40"
          aria-label={t.calendarNext}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted sm:text-xs">
        {weekdays.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.iso || cell.dayNum === null) {
            return <div key={cell.key} className="min-h-14" />;
          }

          const selected = cell.iso === selectedDate;
          const available = (cell.summary?.remaining ?? 0) > 0;
          const full = cell.inWindow && !available;
          const outside = !cell.inWindow;

          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled || outside || !available}
              onClick={() => onSelectDate(cell.iso!)}
              className={[
                "flex min-h-14 flex-col items-center justify-center rounded-xl border px-0.5 py-1 text-center transition",
                selected
                  ? "border-accent bg-accent text-white"
                  : available
                    ? "border-border bg-background hover:border-accent/50"
                    : full
                      ? "border-border/60 bg-stone-100 text-muted"
                      : "border-transparent text-muted/40",
              ].join(" ")}
            >
              <span className="text-sm font-semibold leading-none">
                {cell.dayNum}
              </span>
              {cell.summary ? (
                <span
                  className={[
                    "mt-1 text-[10px] leading-tight sm:text-[11px]",
                    selected ? "text-white/90" : "",
                  ].join(" ")}
                >
                  {available
                    ? `${cell.summary.remaining} ${t.calendarSeats}`
                    : t.full}
                </span>
              ) : (
                <span className="mt-1 text-[10px] opacity-0">-</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted">{t.calendarHint}</p>
    </div>
  );
}

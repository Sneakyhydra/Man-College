"use client";

import type { QueueLocale, QueueMessages } from "@/lib/queue-i18n";

export type AvailabilityDay = {
  queue_date: string;
  total_for_day: number;
  remaining_slots: number;
  can_join: boolean;
};

export function QueueAvailabilityCalendar({
  days,
  selectedDate,
  onSelectDate,
  messages,
  locale,
}: {
  days: AvailabilityDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  messages: QueueMessages;
  locale: QueueLocale;
}) {
  const dateLocale = locale === "hi" ? "hi-IN" : "en-IN";

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-serif-display text-xl font-semibold">
        {messages.calendarTitle}
      </h2>
      <p className="mt-2 text-sm text-muted">{messages.calendarHint}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {days.map((day) => {
          const date = new Date(`${day.queue_date}T00:00:00.000Z`);
          const label = date.toLocaleDateString(dateLocale, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          });
          const isSelected = selectedDate === day.queue_date;

          return (
            <button
              key={day.queue_date}
              type="button"
              disabled={!day.can_join}
              onClick={() => onSelectDate(day.queue_date)}
              className={`rounded-xl border p-3 text-left transition ${
                day.can_join
                  ? "cursor-pointer border-green-200 bg-green-50/50 hover:border-accent hover:bg-accent-subtle/40"
                  : "cursor-not-allowed border-red-200 bg-red-50/60 opacity-80"
              } ${isSelected ? "ring-2 ring-accent" : ""}`}
            >
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted">{day.queue_date}</p>
              <p className="mt-3 text-sm font-medium">
                {messages.remaining}:{" "}
                <span className="font-semibold">{day.remaining_slots}</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {messages.registered}: {day.total_for_day}
              </p>
              <p
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  day.can_join
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {day.can_join ? messages.open : messages.full}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import {
  QueueAvailabilityCalendar,
  type AvailabilityDay,
} from "@/components/queue-availability-calendar";
import { QueueForm } from "@/components/queue-form";
import type { QueueLocale, QueueMessages } from "@/lib/queue-i18n";

export function QueueBookingPanel({
  days,
  messages,
  locale,
}: {
  days: AvailabilityDay[];
  messages: QueueMessages;
  locale: QueueLocale;
}) {
  const formAnchorRef = useRef<HTMLDivElement>(null);
  const initialDate = useMemo(
    () => days.find((d) => d.can_join)?.queue_date ?? null,
    [days],
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    requestAnimationFrame(() => {
      formAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <>
      <QueueAvailabilityCalendar
        days={days}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        messages={messages}
        locale={locale}
      />
      <div ref={formAnchorRef} className="scroll-mt-28">
        <QueueForm selectedDate={selectedDate} messages={messages} />
      </div>
    </>
  );
}

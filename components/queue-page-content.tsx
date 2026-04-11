"use client";

import { useSyncExternalStore } from "react";
import { PageHeader } from "@/components/page-header";
import { QueueBookingPanel } from "@/components/queue-booking-panel";
import { QueueManageForm } from "@/components/queue-manage-form";
import type { AvailabilityDay } from "@/components/queue-availability-calendar";
import { site } from "@/lib/content";
import { BOOKING_WINDOW_DAYS, MAX_QUEUE_PER_DAY } from "@/lib/queue";
import {
  QUEUE_LOCALE_STORAGE_KEY,
  getQueueMessages,
  type QueueLocale,
} from "@/lib/queue-i18n";

const LOCALE_CHANGE_EVENT = "man-college-queue-locale-change";

function readLocaleFromStorage(): QueueLocale {
  try {
    const stored = localStorage.getItem(QUEUE_LOCALE_STORAGE_KEY);
    if (stored === "hi" || stored === "en") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "en";
}

function subscribeLocale(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => onChange();
  window.addEventListener(LOCALE_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getLocaleSnapshot(): QueueLocale {
  if (typeof window === "undefined") {
    return "en";
  }
  return readLocaleFromStorage();
}

function getServerLocaleSnapshot(): QueueLocale {
  return "en";
}

export function QueuePageContent({ days }: { days: AvailabilityDay[] }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  function persistLocale(next: QueueLocale) {
    try {
      localStorage.setItem(QUEUE_LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    }
  }

  const messages = getQueueMessages(locale);

  return (
    <>
      <PageHeader title={messages.pageTitle} subtitle={messages.pageSubtitle} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:py-16">
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          role="region"
          aria-label={messages.languageLabel}
        >
          <p className="text-sm font-medium text-foreground">
            {messages.languageLabel}
          </p>
          <div
            role="tablist"
            aria-label={messages.languageLabel}
            className="inline-flex rounded-xl border border-border bg-background p-1 shadow-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={locale === "en"}
              id="queue-lang-en"
              aria-controls="queue-main"
              onClick={() => persistLocale("en")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                locale === "en"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {messages.tabEnglish}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={locale === "hi"}
              id="queue-lang-hi"
              aria-controls="queue-main"
              onClick={() => persistLocale("hi")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                locale === "hi"
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {messages.tabHindi}
            </button>
          </div>
        </div>

        <div id="queue-main" className="grid gap-10" lang={locale}>
          <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="font-serif-display text-xl font-semibold">
              {messages.importantNotesTitle}
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
              {messages.importantNotes.map((text) => (
                <li key={text}>{text}</li>
              ))}
              <li>
                {messages.importantNotesHelpBefore}
                <a
                  href={site.phoneTel}
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  {site.phone}
                </a>
                {messages.importantNotesHelpAfter}
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="font-serif-display text-xl font-semibold">
              {messages.joinTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {messages.joinIntro(MAX_QUEUE_PER_DAY, BOOKING_WINDOW_DAYS)}
            </p>
            <QueueBookingPanel
              days={days}
              messages={messages}
              locale={locale}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="font-serif-display text-xl font-semibold">
              {messages.manageTitle}
            </h2>
            <p className="mt-2 text-sm text-muted">{messages.manageIntro}</p>
            <QueueManageForm messages={messages} />
          </section>
        </div>
      </div>
    </>
  );
}

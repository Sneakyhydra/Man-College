import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { QueueForm } from "@/components/queue-form";
import { BOOKING_WINDOW_DAYS, MAX_QUEUE_PER_DAY } from "@/lib/queue";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Patient queue",
  description: `Join ${site.name}'s patient queue for an available day in the next ${BOOKING_WINDOW_DAYS} days.`,
};

export default function QueuePage() {
  return (
    <>
      <PageHeader
        title="Patient queue"
        subtitle="Enter your patient ID, name, mobile number, and preferred date to reserve a place in the queue."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:py-16">
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-serif-display text-xl font-semibold">
            Join the queue
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Each day has its own queue with a maximum capacity of{" "}
            {MAX_QUEUE_PER_DAY} patients. You can reserve a day within the next{" "}
            {BOOKING_WINDOW_DAYS} days.
          </p>
          <QueueForm />
        </section>

        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-serif-display text-xl font-semibold">
            Important notes
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>
              Use the exact patient ID provided by your internal registration
              system.
            </li>
            <li>
              If this is a new patient, enable the new-patient option and leave
              patient ID blank.
            </li>
            <li>One patient ID can be queued only once per selected day.</li>
            <li>
              A patient cannot join queue again if they already have an upcoming
              queued visit.
            </li>
            <li>
              If the queue is full for a date, please choose a different day.
            </li>
            <li>
              For help, call{" "}
              <a
                href={site.phoneTel}
                className="font-medium text-accent hover:text-accent-hover"
              >
                {site.phone}
              </a>
              .
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

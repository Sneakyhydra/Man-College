"use client";

import { useMemo, useState } from "react";
import {
  BOOKING_WINDOW_DAYS,
  MAX_QUEUE_PER_DAY,
  dateToIsoDay,
  getDateWindowUtc,
} from "@/lib/queue";

type QueueSuccess = {
  queueDate: string;
  queueNumber: number;
  entryId: number;
  message: string;
  alreadyQueued: boolean;
};

export function QueueForm() {
  const [patientType, setPatientType] = useState<"new" | "existing" | null>(
    null,
  );
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [queueDate, setQueueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<QueueSuccess | null>(null);
  const [loading, setLoading] = useState(false);

  const { minDate, maxDate } = useMemo(() => {
    const { start, end } = getDateWindowUtc();
    return {
      minDate: dateToIsoDay(start),
      maxDate: dateToIsoDay(end),
    };
  }, []);

  const isNewPatient = patientType === "new";
  const isExistingPatient = patientType === "existing";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!patientType) {
      setError("Please select whether you are a new or existing patient.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          isNewPatient,
          name,
          mobile,
          queueDate,
        }),
      });

      const json = (await response.json()) as { error: string } | QueueSuccess;

      if (!response.ok || "error" in json) {
        setError("error" in json ? json.error : "Failed to join queue.");
        return;
      }

      setSuccess(json);
      setPatientType(null);
      setPatientId("");
      setName("");
      setMobile("");
      setQueueDate("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <fieldset className="rounded-lg border border-border bg-background p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Are you a new patient?
        </legend>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="patientType"
              value="existing"
              checked={isExistingPatient}
              onChange={() => setPatientType("existing")}
              className="size-4 border-border"
            />
            No, I am an existing patient
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="patientType"
              value="new"
              checked={isNewPatient}
              onChange={() => {
                setPatientType("new");
                setPatientId("");
              }}
              className="size-4 border-border"
            />
            Yes, I am a new patient
          </label>
        </div>
      </fieldset>

      {patientType ? (
        <>
          {isExistingPatient ? (
            <div>
              <label
                htmlFor="patient-id"
                className="text-sm font-medium text-foreground"
              >
                Patient ID
              </label>
              <input
                id="patient-id"
                name="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Example: MAN1234"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="queue-name"
              className="text-sm font-medium text-foreground"
            >
              Patient name
            </label>
            <input
              id="queue-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="queue-mobile"
              className="text-sm font-medium text-foreground"
            >
              Mobile number
            </label>
            <input
              id="queue-mobile"
              name="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="tel"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="queue-date"
              className="text-sm font-medium text-foreground"
            >
              Queue date
            </label>
            <input
              id="queue-date"
              name="queueDate"
              type="date"
              value={queueDate}
              onChange={(e) => setQueueDate(e.target.value)}
              min={minDate}
              max={maxDate}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-xs text-muted">
              You can book from {minDate} to {maxDate} ({BOOKING_WINDOW_DAYS}{" "}
              days).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Joining queue..." : "Join queue"}
          </button>
        </>
      ) : (
        <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
          Select patient type to continue.
        </p>
      )}

      <p className="text-xs text-muted">
        Each day allows a maximum of {MAX_QUEUE_PER_DAY} patients.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-accent-subtle bg-accent-subtle/40 px-3 py-3 text-sm text-foreground">
          <p className="font-semibold">
            {success.alreadyQueued
              ? "You have already entered the queue"
              : "Queue joined successfully"}
          </p>
          <p className="mt-1 text-muted-strong">{success.message}</p>
          <p className="mt-3 font-medium">Visit details</p>
          <p className="mt-1">Visit date: {success.queueDate}</p>
          <p>Queue number: {success.queueNumber}</p>
          <p className="text-xs text-muted">Reference ID: {success.entryId}</p>
        </div>
      ) : null}
    </form>
  );
}

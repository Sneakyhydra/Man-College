"use client";

import { useState } from "react";
import { MAX_QUEUE_PER_DAY } from "@/lib/queue";
import type { QueueMessages } from "@/lib/queue-i18n";

type QueueSuccess = {
  queueDate: string;
  queueNumber: number;
  entryId: number;
  message: string;
  alreadyQueued: boolean;
};

export function QueueForm({
  selectedDate,
  messages,
}: {
  selectedDate: string | null;
  messages: QueueMessages;
}) {
  const [patientType, setPatientType] = useState<"new" | "existing" | null>(
    null,
  );
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<QueueSuccess | null>(null);
  const [loading, setLoading] = useState(false);

  const isNewPatient = patientType === "new";
  const isExistingPatient = patientType === "existing";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!patientType) {
      setError(messages.formErrPatientType);
      return;
    }
    if (!selectedDate) {
      setError(messages.formErrNoDate);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          isNewPatient,
          name,
          mobile,
          queueDate: selectedDate,
        }),
      });

      const json = (await response.json()) as { error: string } | QueueSuccess;
      if (!response.ok || "error" in json) {
        setError("error" in json ? json.error : messages.formErrGeneric);
        return;
      }

      setSuccess(json);
      setPatientType(null);
      setPatientId("");
      setName("");
      setMobile("");
    } catch {
      setError(messages.formErrNetwork);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="selected-visit-date"
          className="text-sm font-medium text-foreground"
        >
          {messages.formVisitDate}
        </label>
        <input
          id="selected-visit-date"
          type="text"
          readOnly
          value={selectedDate ?? ""}
          placeholder={messages.formVisitDatePlaceholder}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <fieldset className="rounded-lg border border-border bg-background p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          {messages.formPatientTypeLegend}
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
            {messages.formExistingPatient}
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
            {messages.formNewPatient}
          </label>
        </div>
      </fieldset>

      {isExistingPatient ? (
        <div>
          <label
            htmlFor="patient-id"
            className="text-sm font-medium text-foreground"
          >
            {messages.formPatientId}
          </label>
          <input
            id="patient-id"
            name="patientId"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder={messages.formPatientIdPlaceholder}
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
          {messages.formPatientName}
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
          {messages.formMobile}
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

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? messages.formJoining : messages.formJoinQueue}
      </button>

      <p className="text-xs text-muted">
        {messages.formMaxPerDay(MAX_QUEUE_PER_DAY)}
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
              ? messages.formSuccessAlready
              : messages.formSuccessJoined}
          </p>
          <p className="mt-1 text-muted-strong">{success.message}</p>
          <p className="mt-3 font-medium">{messages.formVisitDetails}</p>
          <p className="mt-1">
            {messages.formVisitDateLabel}: {success.queueDate}
          </p>
          <p>
            {messages.formQueueNumber}: {success.queueNumber}
          </p>
          <p className="text-xs text-muted">
            {messages.formReferenceId}: {success.entryId}
          </p>
        </div>
      ) : null}
    </form>
  );
}

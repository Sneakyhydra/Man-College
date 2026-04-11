"use client";

import { useState } from "react";
import type { QueueMessages } from "@/lib/queue-i18n";

type ActionType = "cancel" | "reschedule";

type CancelResponse = {
  message: string;
  queueDate: string;
  queueNumber: number;
  entryId: number;
};

type RescheduleResponse = {
  message: string;
  oldQueueDate: string;
  newQueueDate: string;
  newQueueNumber: number;
  entryId: number;
};

export function QueueManageForm({ messages }: { messages: QueueMessages }) {
  const [patientType, setPatientType] = useState<"new" | "existing">(
    "existing",
  );
  const [action, setAction] = useState<ActionType>("cancel");
  const [patientId, setPatientId] = useState("");
  const [mobile, setMobile] = useState("");
  const [newQueueDate, setNewQueueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const isNewPatient = patientType === "new";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/queue/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          patientId,
          isNewPatient,
          mobile,
          newQueueDate: action === "reschedule" ? newQueueDate : undefined,
        }),
      });

      const json = (await response.json()) as
        | { error: string }
        | CancelResponse
        | RescheduleResponse;

      if (!response.ok || "error" in json) {
        setError("error" in json ? json.error : messages.manageErrGeneric);
        return;
      }

      if (action === "cancel") {
        const payload = json as CancelResponse;
        setResult(
          messages.manageResultCancel(
            payload.message,
            payload.queueDate,
            payload.queueNumber,
          ),
        );
      } else {
        const payload = json as RescheduleResponse;
        setResult(
          messages.manageResultReschedule(
            payload.message,
            payload.oldQueueDate,
            payload.newQueueDate,
            payload.newQueueNumber,
          ),
        );
      }
    } catch {
      setError(messages.manageErrNetwork);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="flex flex-col gap-4">
        <fieldset className="rounded-lg border border-border bg-background p-4">
          <legend className="px-1 text-xs font-medium text-muted">
            {messages.managePatientType}
          </legend>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="manage-patient-type"
                className="size-4 shrink-0 border-border text-accent focus:ring-accent"
                checked={!isNewPatient}
                onChange={() => setPatientType("existing")}
              />
              <span className="leading-snug">
                {messages.manageExistingPatient}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="manage-patient-type"
                className="size-4 shrink-0 border-border text-accent focus:ring-accent"
                checked={isNewPatient}
                onChange={() => {
                  setPatientType("new");
                  setPatientId("");
                }}
              />
              <span className="leading-snug">{messages.manageNewPatient}</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-border bg-background p-4">
          <legend className="px-1 text-xs font-medium text-muted">
            {messages.manageAction}
          </legend>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="manage-action"
                className="size-4 shrink-0 border-border text-accent focus:ring-accent"
                checked={action === "cancel"}
                onChange={() => setAction("cancel")}
              />
              <span className="leading-snug">{messages.manageCancel}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="manage-action"
                className="size-4 shrink-0 border-border text-accent focus:ring-accent"
                checked={action === "reschedule"}
                onChange={() => setAction("reschedule")}
              />
              <span className="leading-snug">{messages.manageReschedule}</span>
            </label>
          </div>
        </fieldset>
      </div>

      {!isNewPatient ? (
        <div>
          <label className="text-sm font-medium text-foreground">
            {messages.formPatientId}
          </label>
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-foreground">
          {messages.formMobile}
        </label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {action === "reschedule" ? (
        <div>
          <label className="text-sm font-medium text-foreground">
            {messages.manageNewVisitDate}
          </label>
          <input
            type="date"
            value={newQueueDate}
            onChange={(e) => setNewQueueDate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-70"
      >
        {loading
          ? messages.manageUpdating
          : action === "cancel"
            ? messages.manageCancel
            : messages.manageReschedule}
      </button>

      {result ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {result}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}

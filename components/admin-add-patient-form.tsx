"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAddPatientForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [patientType, setPatientType] = useState<"new" | "existing">(
    "existing",
  );
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [queueDate, setQueueDate] = useState(defaultDate);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isNewPatient = patientType === "new";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          isNewPatient,
          name,
          mobile,
          queueDate,
        }),
      });

      const json = (await response.json()) as {
        error?: string;
        queueDate?: string;
        queueNumber?: number;
      };

      if (!response.ok) {
        setError(json.error ?? "Failed to add patient.");
        return;
      }

      setSuccess(
        `Added successfully. Date: ${json.queueDate}, Queue #${json.queueNumber}`,
      );
      setPatientId("");
      setName("");
      setMobile("");
      router.push(`/admin?date=${queueDate}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <fieldset className="rounded-lg border border-border bg-background p-3">
        <legend className="px-1 text-xs font-medium text-muted">
          Patient type
        </legend>
        <div className="mt-1 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={!isNewPatient}
              onChange={() => setPatientType("existing")}
            />
            Existing
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={isNewPatient}
              onChange={() => {
                setPatientType("new");
                setPatientId("");
              }}
            />
            New
          </label>
        </div>
      </fieldset>

      {!isNewPatient ? (
        <div>
          <label className="text-sm font-medium text-foreground">
            Patient ID
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
          Patient name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">
          Mobile number
        </label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">
          Queue date
        </label>
        <input
          type="date"
          value={queueDate}
          onChange={(e) => setQueueDate(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-70"
      >
        {loading ? "Adding..." : "Add patient to queue"}
      </button>
      {success ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
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

"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin-nav";

type Slot = {
  id?: number;
  start_time: string;
  end_time: string;
  capacity: number;
  sort_order: number;
  is_active: boolean;
};

type Settings = {
  booking_window_days: number;
  reminder_day_before_hour: number;
  reminder_same_day_hour: number;
  reminders_enabled: boolean;
};

type ClosedDate = { date: string; note: string | null };

type ReminderRun = {
  id: number;
  started_at: string;
  finished_at: string | null;
  day_before_sent: number;
  same_day_sent: number;
  error_count: number;
};

export function AdminSlotsClient() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [lastReminderRun, setLastReminderRun] = useState<ReminderRun | null>(
    null,
  );
  const [newClosedDate, setNewClosedDate] = useState("");
  const [newClosedNote, setNewClosedNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/slots");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load");
    setSlots(data.slots ?? []);
    setSettings(data.settings);
    setClosedDates(data.closedDates ?? []);
    setLastReminderRun(data.lastReminderRun ?? null);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function save() {
    if (!settings) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, slots }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function addClosedDate(e: React.FormEvent) {
    e.preventDefault();
    if (!newClosedDate) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closedDates: {
            add: { date: newClosedDate, note: newClosedNote || null },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add closed date");
      setNewClosedDate("");
      setNewClosedNote("");
      setMessage("Closed date added.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeClosedDate(date: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closedDates: { remove: [date] } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function runRemindersNow() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reminders/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reminder run failed");
      setMessage(
        `Reminders: sent ${data.sent ?? 0} (day-before ${data.dayBeforeSent ?? 0}, same-day ${data.sameDaySent ?? 0}).`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reminder run failed");
    } finally {
      setBusy(false);
    }
  }

  function updateSlot(index: number, patch: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      {
        start_time: "14:00",
        end_time: "15:00",
        capacity: 15,
        sort_order: prev.length + 1,
        is_active: true,
      },
    ]);
  }

  async function removeSlot(index: number) {
    const slot = slots[index];
    if (slot.id) {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/slots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slots: [{ ...slot, _delete: true }],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Delete failed");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setBusy(false);
      }
    } else {
      setSlots((prev) => prev.filter((_, i) => i !== index));
    }
  }

  return (
    <div className="mx-auto my-auto w-full max-w-5xl py-8">
      <AdminNav />
      <h1 className="text-2xl font-semibold">Slots & settings</h1>
      <p className="mt-1 text-sm text-muted">
        Slots with future bookings are locked. Tokens are per-slot (1, 2, 3…) and
        never renumbered on cancel.
      </p>

      {settings ? (
        <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold">Booking & reminders</h2>
          <label className="block text-sm">
            Booking window (days)
            <input
              type="number"
              min={1}
              max={90}
              value={settings.booking_window_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  booking_window_days: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <p className="text-xs text-muted">
            Reminder hour fields are informational on Vercel Hobby (cron runs
            once daily ~08:00 IST and sends both reminder types).
          </p>
          <label className="block text-sm">
            Day-before reminder hour (IST 0–23)
            <input
              type="number"
              min={0}
              max={23}
              value={settings.reminder_day_before_hour}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminder_day_before_hour: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Same-day reminder hour (IST 0–23)
            <input
              type="number"
              min={0}
              max={23}
              value={settings.reminder_same_day_hour}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminder_same_day_hour: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.reminders_enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminders_enabled: e.target.checked,
                })
              }
            />
            Reminders enabled
          </label>
          <div className="rounded-xl border border-border bg-stone-50 px-3 py-2 text-xs text-muted">
            {lastReminderRun ? (
              <p>
                Last reminder run:{" "}
                {new Date(lastReminderRun.started_at).toLocaleString()} — sent{" "}
                {lastReminderRun.day_before_sent + lastReminderRun.same_day_sent}{" "}
                (errors: {lastReminderRun.error_count})
              </p>
            ) : (
              <p>No reminder runs recorded yet.</p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void runRemindersNow()}
              className="mt-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-60"
            >
              Run reminders now
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Closed dates</h2>
        <form onSubmit={addClosedDate} className="flex flex-wrap gap-2">
          <input
            type="date"
            required
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            className="rounded-xl border border-border px-3 py-2 text-sm"
          />
          <input
            value={newClosedNote}
            onChange={(e) => setNewClosedNote(e.target.value)}
            placeholder="Note (optional)"
            className="min-w-[12rem] flex-1 rounded-xl border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-border px-3 py-2 text-sm font-medium"
          >
            Add
          </button>
        </form>
        <ul className="space-y-2 text-sm">
          {closedDates.length === 0 ? (
            <li className="text-muted">No upcoming closed dates.</li>
          ) : (
            closedDates.map((c) => (
              <li
                key={c.date}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {c.date}
                  {c.note ? ` — ${c.note}` : ""}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeClosedDate(c.date)}
                  className="text-red-600"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daily slots</h2>
          <button
            type="button"
            onClick={addSlot}
            className="rounded-full border border-border px-3 py-1.5 text-sm"
          >
            Add slot
          </button>
        </div>
        {slots.map((slot, index) => (
          <div
            key={slot.id ?? `new-${index}`}
            className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-6"
          >
            <label className="text-xs sm:col-span-1">
              Start
              <input
                type="time"
                value={slot.start_time.slice(0, 5)}
                onChange={(e) =>
                  updateSlot(index, { start_time: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="text-xs sm:col-span-1">
              End
              <input
                type="time"
                value={slot.end_time.slice(0, 5)}
                onChange={(e) =>
                  updateSlot(index, { end_time: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="text-xs sm:col-span-1">
              Capacity
              <input
                type="number"
                min={1}
                value={slot.capacity}
                onChange={(e) =>
                  updateSlot(index, { capacity: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="text-xs sm:col-span-1">
              Order
              <input
                type="number"
                value={slot.sort_order}
                onChange={(e) =>
                  updateSlot(index, { sort_order: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5"
              />
            </label>
            <label className="flex items-end gap-2 text-xs sm:col-span-1">
              <input
                type="checkbox"
                checked={slot.is_active}
                onChange={(e) =>
                  updateSlot(index, { is_active: e.target.checked })
                }
              />
              Active
            </label>
            <div className="flex items-end sm:col-span-1">
              <button
                type="button"
                onClick={() => removeSlot(index)}
                className="text-sm text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={save}
        className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
      {message ? <p className="mt-2 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

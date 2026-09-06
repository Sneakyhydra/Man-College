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

export function AdminSlotsClient() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/slots");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load");
    setSlots(data.slots ?? []);
    setSettings(data.settings);
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
        </section>
      ) : null}

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

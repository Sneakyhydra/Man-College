export const BOOKING_TIMEZONE = "Asia/Kolkata";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type AvailabilityRow = {
  appointment_date: string;
  slot_id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  remaining_slots: number;
  token_base: number;
  can_book: boolean;
};

export function formatTimeLabel(time: string) {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

export function formatSlotRange(start: string, end: string) {
  return `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`;
}

export function toIsoDateInTimeZone(date = new Date(), timeZone = BOOKING_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function normalizeIndianPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (input.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export function isValidOtp(code: string) {
  return /^\d{6}$/.test(code.trim());
}

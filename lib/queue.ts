export const MAX_QUEUE_PER_DAY = 50;
export const BOOKING_WINDOW_DAYS = 30;

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

export function isValidMobileNumber(value: string) {
  return /^\+?[0-9]{10,15}$/.test(value);
}

export function isValidPatientId(value: string) {
  return /^[a-zA-Z0-9_-]{4,40}$/.test(value);
}

export function getDateWindowUtc() {
  const today = new Date();
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (BOOKING_WINDOW_DAYS - 1));

  return { start, end };
}

export function dateToIsoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isQueueDateWithinWindow(dateInput: string) {
  if (!YYYY_MM_DD.test(dateInput)) return false;
  const parsed = new Date(`${dateInput}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;

  const { start, end } = getDateWindowUtc();
  return parsed >= start && parsed <= end;
}

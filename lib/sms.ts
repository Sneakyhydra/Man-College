import { normalizeIndianPhone } from "@/lib/appointments";

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    throw new Error("Twilio environment variables are not configured.");
  }

  const e164 = normalizeIndianPhone(to);
  if (!e164) {
    throw new Error(`Invalid phone number for SMS: ${to}`);
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: e164, From: from, Body: body });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio SMS failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function reminderMessage(opts: {
  date: string;
  slotLabel: string;
  token: number;
  kind: "day_before" | "same_day";
}) {
  if (opts.kind === "day_before") {
    return `याद दिलाना: कल ${opts.date} को ${opts.slotLabel} आपका अपॉइंटमेंट है। टोकन: ${opts.token}. शुल्क नकद दें। Reminder: appointment tomorrow ${opts.date} ${opts.slotLabel}, token ${opts.token}.`;
  }
  return `आज ${opts.date} को ${opts.slotLabel} आपका अपॉइंटमेंट है। टोकन: ${opts.token}. समय पर पहुँचें। Today ${opts.date} ${opts.slotLabel}, token ${opts.token}.`;
}

export function bookingConfirmationMessage(opts: {
  date: string;
  slotLabel: string;
  token: number;
}) {
  return `अपॉइंटमेंट बुक: ${opts.date}, ${opts.slotLabel}, टोकन ${opts.token}. शुल्क नकद। Booked: ${opts.date} ${opts.slotLabel}, token ${opts.token}.`;
}

export function cancelConfirmationMessage(opts: {
  date: string;
  slotLabel: string;
  token: number;
}) {
  return `अपॉइंटमेंट रद्द: ${opts.date}, ${opts.slotLabel}, टोकन ${opts.token}. Cancelled: ${opts.date} ${opts.slotLabel}, token ${opts.token}.`;
}

export function rescheduleConfirmationMessage(opts: {
  date: string;
  slotLabel: string;
  token: number;
}) {
  return `अपॉइंटमेंट रीशेड्यूल: ${opts.date}, ${opts.slotLabel}, नया टोकन ${opts.token}. Rescheduled: ${opts.date} ${opts.slotLabel}, token ${opts.token}.`;
}

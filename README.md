# Appointments (clinic)

Phone OTP booking for patients, env-based admin desk tools, Twilio SMS reminders.

## Stack

- Next.js App Router + PWA
- Supabase Auth (phone OTP), Postgres RPCs, RLS
- Twilio for booking/reminder SMS (separate from Supabase Auth SMS provider)
- Vercel cron (Hobby: once daily)

## Token rules (go-live)

- Tokens are **per slot**: each slot is `1, 2, 3…` (not shared across the day).
- Always show **token + slot time**.
- Cancel **keeps** the token on the cancelled row; other patients are **not** renumbered.
- Cancelled seats free **capacity**, but the cancelled number is **never reused** (FCFS).
- Admin can overbook past capacity; tokens continue in that slot (`16, 17…`).
- **Sundays are always closed** (plus any dates in Closed dates).

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/server patient client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin APIs + cron (never expose to browser) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | Shared desk login (8h session, rate-limited) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | App SMS (confirmations + reminders) |
| `CRON_SECRET` | Bearer token for `/api/cron/reminders` |

Configure **Supabase Auth → Phone** with its own SMS provider (often Twilio again). That path is separate from `TWILIO_*` above.

## Migrations

Apply in order under `supabase/migrations/`, including:

- `20260907200000_clinic_golive.sql` — per-slot tokens, closed dates, statuses, admin cancel/status, reminder_runs

Deploy app only after migrations succeed.

## Admin

- `/admin` — day roster (check-in / complete / no-show / cancel)
- `/admin/patients` — create patient, link hospital ID, book on behalf
- `/admin/slots` — capacities, closed dates, reminder toggle, manual reminder run

Slots with active future bookings cannot be edited/deleted.

## Cron

`vercel.json` schedules `GET /api/cron/reminders` daily (`30 2 * * *` UTC ≈ 08:00 IST). Send header:

`Authorization: Bearer $CRON_SECRET`

Hobby runs once/day and sends both day-before and same-day reminders. Logs land in `reminder_runs`; desk can also **Run reminders now** from Slots & settings.

## Local smoke

```bash
npm run dev
# patient: /login → OTP → onboarding → /book
# admin: /admin/login
source .env.local && curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/reminders
```

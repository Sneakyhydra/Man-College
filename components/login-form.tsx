"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatientLocale } from "@/components/patient-locale-provider";
import { isValidOtp, normalizeIndianPhone } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const { t } = usePatientLocale();
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState("");
  const [e164, setE164] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeIndianPhone(phoneInput);
    if (!normalized) {
      setError(t.loginError);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });
      if (otpError) throw otpError;
      setE164(normalized);
    } catch {
      setError(t.loginError);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!e164 || !isValidOtp(otp)) {
      setError(t.loginError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164,
        token: otp.trim(),
        type: "sms",
      });
      if (verifyError) throw verifyError;
      router.replace("/");
      router.refresh();
    } catch {
      setError(t.loginError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.loginTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.loginSubtitle}</p>
      </div>

      {!e164 ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              {t.phoneLabel}
            </label>
            <input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={t.phonePlaceholder}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? t.sendingOtp : t.sendOtp}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-muted">{e164}</p>
          <div>
            <label htmlFor="otp" className="text-sm font-medium">
              {t.otpLabel}
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={t.otpPlaceholder}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? t.verifying : t.verifyOtp}
          </button>
          <button
            type="button"
            onClick={() => {
              setE164(null);
              setOtp("");
              setError(null);
            }}
            className="w-full text-sm text-muted underline-offset-2 hover:underline"
          >
            {t.changePhone}
          </button>
        </form>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

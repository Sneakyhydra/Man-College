"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatientLocale } from "@/components/patient-locale-provider";
import type { Gender } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/client";

export function OnboardingForm() {
  const { t, locale } = usePatientLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!gender) {
      setError(t.loginError);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("complete_profile", {
        p_full_name: fullName,
        p_date_of_birth: dob,
        p_gender: gender,
        p_preferred_locale: locale,
      });
      if (rpcError) throw rpcError;
      router.replace("/book");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.onboardingTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.onboardingSubtitle}</p>
      </div>

      <div>
        <label htmlFor="fullName" className="text-sm font-medium">
          {t.fullName}
        </label>
        <input
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label htmlFor="dob" className="text-sm font-medium">
          {t.dateOfBirth}
        </label>
        <input
          id="dob"
          type="date"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">{t.gender}</legend>
        <div className="mt-2 grid gap-2">
          {(
            [
              ["male", t.genderMale],
              ["female", t.genderFemale],
              ["other", t.genderOther],
              ["prefer_not_to_say", t.genderPreferNot],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="gender"
                value={value}
                checked={gender === value}
                onChange={() => setGender(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? t.saving : t.saveProfile}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

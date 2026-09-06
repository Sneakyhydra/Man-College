"use client";

import { usePatientLocale } from "@/components/patient-locale-provider";
import type { PatientLocale } from "@/lib/patient-i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = usePatientLocale();

  function select(next: PatientLocale) {
    setLocale(next);
  }

  return (
    <div className={`inline-flex items-center gap-2.5 text-sm ${className}`}>
      <span className="shrink-0 text-muted">{t.language}</span>
      <div
        role="group"
        aria-label={t.language}
        className="inline-flex items-center rounded-full bg-stone-100 p-0.5"
      >
        <button
          type="button"
          onClick={() => select("en")}
          className={`rounded-full px-3 py-1 transition ${
            locale === "en"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t.english}
        </button>
        <button
          type="button"
          onClick={() => select("hi")}
          className={`rounded-full px-3 py-1 transition ${
            locale === "hi"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t.hindi}
        </button>
      </div>
    </div>
  );
}

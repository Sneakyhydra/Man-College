"use client";

import { usePatientLocale } from "@/components/patient-locale-provider";
import type { PatientLocale } from "@/lib/patient-i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = usePatientLocale();

  function select(next: PatientLocale) {
    setLocale(next);
  }

  return (
    <div className={`inline-flex items-center gap-1 text-sm ${className}`}>
      <span className="text-muted">{t.language}</span>
      <button
        type="button"
        onClick={() => select("en")}
        className={`rounded-full px-2.5 py-1 ${
          locale === "en"
            ? "bg-accent text-white"
            : "text-foreground hover:bg-stone-100"
        }`}
      >
        {t.english}
      </button>
      <button
        type="button"
        onClick={() => select("hi")}
        className={`rounded-full px-2.5 py-1 ${
          locale === "hi"
            ? "bg-accent text-white"
            : "text-foreground hover:bg-stone-100"
        }`}
      >
        {t.hindi}
      </button>
    </div>
  );
}

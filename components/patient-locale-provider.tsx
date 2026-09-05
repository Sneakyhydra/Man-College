"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getPatientMessages,
  PATIENT_LOCALE_STORAGE_KEY,
  type PatientLocale,
  type PatientMessages,
} from "@/lib/patient-i18n";

type LocaleContextValue = {
  locale: PatientLocale;
  setLocale: (locale: PatientLocale) => void;
  t: PatientMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function PatientLocaleProvider({
  children,
  initialLocale = "hi",
}: {
  children: ReactNode;
  initialLocale?: PatientLocale;
}) {
  const [locale, setLocaleState] = useState<PatientLocale>(initialLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(PATIENT_LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "hi") {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: PatientLocale) {
    setLocaleState(next);
    window.localStorage.setItem(PATIENT_LOCALE_STORAGE_KEY, next);
  }

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: getPatientMessages(locale) }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function usePatientLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("usePatientLocale must be used within PatientLocaleProvider");
  }
  return ctx;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { usePatientLocale } from "@/components/patient-locale-provider";
import { createClient } from "@/lib/supabase/client";

export function PatientShell({ children }: { children: React.ReactNode }) {
  const { t } = usePatientLocale();
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const hideNav =
    pathname === "/login" || pathname === "/onboarding";

  return (
    <div className="mx-auto my-auto w-full max-w-lg py-8 pb-24">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-accent">{t.appName}</p>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageToggle />
          {!hideNav ? (
            <button
              type="button"
              onClick={logout}
              className="text-sm text-muted underline-offset-2 hover:underline"
            >
              {t.logout}
            </button>
          ) : null}
        </div>
      </header>

      <div>{children}</div>

      {!hideNav ? (
        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-3 text-sm font-medium">
            <Link
              href="/book"
              className={
                pathname.startsWith("/book") ? "text-accent" : "text-muted"
              }
            >
              {t.navBook}
            </Link>
            <Link
              href="/appointments"
              className={
                pathname.startsWith("/appointments")
                  ? "text-accent"
                  : "text-muted"
              }
            >
              {t.navAppointment}
            </Link>
            <PwaInstallButton className="text-sm" />
          </div>
        </nav>
      ) : null}
    </div>
  );
}

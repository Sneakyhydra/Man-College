"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showFallbackHelp, setShowFallbackHelp] = useState(false);
  const runtimeInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true));

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowFallbackHelp(false);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowFallbackHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (isInstalled || runtimeInstalled) return;

    if (!deferredPrompt) {
      setShowFallbackHelp(true);
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalled || runtimeInstalled}
        className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isInstalled || runtimeInstalled ? "App installed" : "Download app"}
      </button>
      {showFallbackHelp ? (
        <p className="mt-1 max-w-xs text-xs text-muted">
          Install prompt unavailable. In browser menu, use &quot;Install
          app&quot; or &quot;Add to Home Screen&quot;.
        </p>
      ) : null}
    </div>
  );
}

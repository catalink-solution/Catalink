"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

const DISMISS_KEY = "catalink_pwa_dismiss";

/** Bandeau visible dans le dashboard pour installer Catalink en PWA. */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [androidHelp, setAndroidHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw && Date.now() - Number(raw) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  if (!mounted || installed || dismissed) return null;

  const canNativeInstall = !!deferred;
  const showIos = isIos();
  const showMobileHint = isMobileDevice();

  // Desktop : uniquement si Chrome propose l'installation native
  // Mobile : toujours visible (iOS = guide manuel, Android = bouton natif ou hint)
  if (!canNativeInstall && !showMobileHint) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if (showIos) {
      setIosHelp(true);
      return;
    }
    if (showMobileHint) {
      setAndroidHelp(true);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  return (
    <>
      <div className="border-b border-violet-500/20 bg-gradient-to-r from-violet-600/15 to-blue-600/10 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/25 text-violet-300">
            <Smartphone size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Installer Catalink</p>
            <p className="text-xs text-white/50">
              Accède à ton dashboard comme une app, directement depuis ton écran d&apos;accueil.
            </p>
          </div>
          <button
            onClick={install}
            type="button"
            className="btn-touch inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Download size={15} />
            {showIos ? "Comment ?" : canNativeInstall ? "Installer" : "Installer l'app"}
          </button>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {iosHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setIosHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0e1a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Installer sur iPhone</h3>
            <ol className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                1. Appuie sur <strong className="text-white">Partager</strong> (icône carré + flèche)
                en bas de Safari.
              </li>
              <li>
                2. Choisis <strong className="text-white">Sur l&apos;écran d&apos;accueil</strong>.
              </li>
              <li>
                3. Appuie sur <strong className="text-white">Ajouter</strong>.
              </li>
            </ol>
            <p className="mt-4 text-xs text-white/40">
              Catalink s&apos;ouvrira en plein écran, comme une vraie app.
            </p>
            <button
              onClick={() => setIosHelp(false)}
              type="button"
              className="btn-touch mt-5 w-full min-h-[44px] rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {androidHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setAndroidHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0e1a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Installer sur Android</h3>
            <ol className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                1. Ouvre Catalink dans <strong className="text-white">Chrome</strong>.
              </li>
              <li>
                2. Appuie sur le menu <strong className="text-white">⋮</strong> (en haut à droite).
              </li>
              <li>
                3. Choisis <strong className="text-white">Installer l&apos;application</strong> ou{" "}
                <strong className="text-white">Ajouter à l&apos;écran d&apos;accueil</strong>.
              </li>
            </ol>
            <button
              onClick={() => setAndroidHelp(false)}
              type="button"
              className="btn-touch mt-5 w-full min-h-[44px] rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Carte compacte pour le Hub Social. */
export function PwaInstallCard() {
  const [state, setState] = useState<"loading" | "installable" | "ios" | "installed">("loading");

  useEffect(() => {
    if (isStandalone()) {
      setState("installed");
      return;
    }
    if (isIos()) {
      setState("ios");
      return;
    }
    const onInstall = (e: Event) => {
      e.preventDefault();
      setState("installable");
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    setState("installable");
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  if (state === "loading") return null;

  if (state === "installed") {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
        <p className="text-sm font-semibold text-green-300">App installée ✓</p>
        <p className="mt-1 text-xs text-white/50">Catalink tourne en mode application.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        <Smartphone size={20} className="mt-0.5 shrink-0 text-violet-300" />
        <div>
          <p className="font-semibold">App mobile Catalink</p>
          <p className="mt-1 text-xs text-white/50">
            {state === "ios"
              ? "Safari → Partager → Sur l'écran d'accueil pour installer Catalink."
              : "Installe Catalink sur ton téléphone pour un accès rapide au dashboard."}
          </p>
        </div>
      </div>
    </div>
  );
}

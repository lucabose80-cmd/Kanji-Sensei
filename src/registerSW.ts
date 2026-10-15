/**
 * Service Worker Registration and PWA Install Prompt helper
 */

type RegisterSWConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: unknown) => void;
};

export function registerServiceWorker(config?: RegisterSWConfig): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        config?.onSuccess?.(registration);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available, execute update callback
                console.log('[PWA] Neuer Inhalt verf\u00fcgbar; bitte Seite neu laden.');
                config?.onUpdate?.(registration);
              } else {
                // Content cached for offline use
                console.log('[PWA] Inhalte wurden f\u00fcr Offline-Nutzung zwischengespeichert.');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('[PWA] Fehler bei Service Worker Registrierung:', error);
        config?.onError?.(error);
      });
  });
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[PWA] Fehler beim Abmelden des Service Workers:', error);
      });
  }
}

/**
 * Hook into beforeinstallprompt event for "Aufs Handy ziehen" / "App installieren" buttons
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    installListeners.forEach((listener) => listener(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installListeners.forEach((listener) => listener(false));
    console.log('[PWA] App wurde erfolgreich installiert.');
  });
}

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export async function promptInstallApp(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if (choice.outcome === 'accepted') {
    deferredPrompt = null;
    installListeners.forEach((listener) => listener(false));
    return true;
  }
  return false;
}

export function onInstallAvailabilityChange(callback: (canInstall: boolean) => void): () => void {
  installListeners.add(callback);
  callback(deferredPrompt !== null);
  return () => {
    installListeners.delete(callback);
  };
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isMatchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isIosStandalone || isMatchMediaStandalone;
}

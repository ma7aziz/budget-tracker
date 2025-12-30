export interface ServiceWorkerCallbacks {
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onUpdateFound?: (registration: ServiceWorkerRegistration) => void;
}

export function registerServiceWorker(callbacks: ServiceWorkerCallbacks = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        callbacks.onRegistered?.(registration);

        registration.addEventListener("updatefound", () => {
          callbacks.onUpdateFound?.(registration);
        });
      })
      .catch(() => {
        // Ignore registration errors to avoid blocking the app shell.
      });
  });
}

export function requestServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Listens for push notification messages forwarded by the service worker
 * and surfaces them as in-app toasts.
 */
export function useServiceWorkerMessages() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "PUSH_RECEIVED" && msg.payload) {
        const title = msg.payload.title || "ZenSolar";
        const description = msg.payload.body || "You have a new notification";
        toast(title, { description });
      }
    };

    if (navigator.serviceWorker.controller || navigator.serviceWorker.ready) {
      navigator.serviceWorker.addEventListener("message", onMessage);
      return () => navigator.serviceWorker.removeEventListener("message", onMessage);
    }
  }, []);
}

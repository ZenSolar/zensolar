// Small helper utilities for iOS/PWA where `navigator.serviceWorker.ready` can hang indefinitely.

export async function waitForServiceWorkerReady(
  timeoutMs = 1500
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const timeout = new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    });

    const reg = (await Promise.race([
      navigator.serviceWorker.ready,
      timeout,
    ])) as ServiceWorkerRegistration | null;

    return reg ?? null;
  } catch {
    return null;
  }
}

export async function getPushSubscription(timeoutMs = 1500): Promise<PushSubscription | null> {
  const reg = await waitForServiceWorkerReady(timeoutMs);
  if (!reg) return null;

  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

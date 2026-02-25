import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Suppress the browser's native PWA install prompt on all pages.
// The Install page captures and re-triggers it when the user explicitly visits /install.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
});

// Register our custom push service worker on app load
// This is critical for iOS PWA - the SW must be registered early
// and stay active, otherwise push notifications won't work
if ('serviceWorker' in navigator) {
  // Wait for page load to avoid blocking initial render
  window.addEventListener('load', async () => {
    try {
      // Unregister any legacy caching SWs (e.g. workbox/pwa-sw.js) so the UI can't get stuck on an old build.
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs.map(async (reg) => {
          const scriptURL = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
          if (scriptURL && !scriptURL.endsWith('/sw.js')) {
            const ok = await reg.unregister();
            if (ok) console.log('[App] Unregistered legacy SW:', scriptURL);
          }
        })
      );

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[App] Service worker registered:', registration.scope);

      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        registration.update().catch((err) => {
          console.error('[App] SW update check failed:', err);
        });
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error('[App] Service worker registration failed:', error);
    }
  });
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Dismiss splash after React's first paint using a double-rAF to ensure
// the browser has actually composited the first frame before fading out.
if (typeof window !== 'undefined' && typeof (window as any).hideSplashScreen === 'function') {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      (window as any).hideSplashScreen();
    });
  });
}

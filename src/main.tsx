import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const isPreviewHost = () => {
  const hostname = window.location.hostname;
  return hostname.includes("id-preview--") || hostname.endsWith(".lovableproject.com");
};

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// Suppress the browser's native PWA install prompt on all pages.
// The Install page captures and re-triggers it when the user explicitly visits /install.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
});

// Register our custom push service worker only outside Lovable preview/iframe contexts.
// Preview-host SW registration can trigger zero-byte download prompts in mobile Safari.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const shouldRegisterPushSw = !isPreviewHost() && !isInIframe();
      const regs = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        regs.map(async (reg) => {
          const scriptURL = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
          const isPushSw = scriptURL.endsWith('/sw.js');

          if (!shouldRegisterPushSw || (scriptURL && !isPushSw)) {
            const ok = await reg.unregister();
            if (ok) console.log('[App] Unregistered service worker:', scriptURL || '(unknown)');
          }
        })
      );

      if (!shouldRegisterPushSw) {
        console.log('[App] Skipping service worker registration in preview/iframe context');
        return;
      }

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

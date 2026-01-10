import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register our custom push service worker on app load
// This is critical for iOS PWA - the SW must be registered early
// and stay active, otherwise push notifications won't work
if ('serviceWorker' in navigator) {
  // Wait for page load to avoid blocking initial render
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[App] Service worker registered:', registration.scope);
      
      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        registration.update().catch(err => {
          console.error('[App] SW update check failed:', err);
        });
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error('[App] Service worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

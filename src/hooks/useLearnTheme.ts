import { useEffect, useState } from "react";
import { getStoredLearnTheme, type LearnTheme } from "@/lib/learnThemes";

/**
 * Inject Google Fonts on demand for learn pages. Default home/app routes
 * never trigger this, keeping LCP cheap for the 99% case.
 */
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
function ensureLearnFontsLoaded() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-zen-theme-fonts]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.dataset.zenThemeFonts = "1";
  l.href = FONTS_HREF;
  document.head.appendChild(l);
}

/** Subscribes to the persisted learn-theme and returns the current value. */
export function useLearnTheme(): LearnTheme {
  const [theme, setTheme] = useState<LearnTheme>(() => getStoredLearnTheme());

  useEffect(() => {
    ensureLearnFontsLoaded();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LearnTheme>).detail;
      if (detail) setTheme(detail);
    };
    window.addEventListener("learn-theme-change", handler);
    // Also re-sync on storage changes from another tab
    const onStorage = () => setTheme(getStoredLearnTheme());
    window.addEventListener("storage", onStorage);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("zen.learn.theme") : null;
    if (channel) {
      channel.onmessage = (event: MessageEvent<LearnTheme>) => {
        if (event.data) setTheme(event.data);
      };
    }
    return () => {
      window.removeEventListener("learn-theme-change", handler);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  return theme;
}

import { useEffect, useState } from "react";
import { getStoredLearnTheme, type LearnTheme } from "@/lib/learnThemes";

/** Subscribes to the persisted learn-theme and returns the current value. */
export function useLearnTheme(): LearnTheme {
  const [theme, setTheme] = useState<LearnTheme>(() => getStoredLearnTheme());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LearnTheme>).detail;
      if (detail) setTheme(detail);
    };
    window.addEventListener("learn-theme-change", handler);
    // Also re-sync on storage changes from another tab
    const onStorage = () => setTheme(getStoredLearnTheme());
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("learn-theme-change", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return theme;
}

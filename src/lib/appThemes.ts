// App-wide theme system. Applies a `data-app-theme` attribute to <html>
// so the CSS in src/styles/app-themes.css remaps semantic HSL tokens.
//
// Persistence rules:
//   - Theme choice persists ONLY inside preview hosts (lovable.app /
//     lovableproject.com / localhost / Vite dev). On production / custom
//     domains, the stored value is ignored and the app loads in DEFAULT.
//   - Users can additionally toggle "session-only" mode, which clears
//     the stored theme on every full page load even inside preview.
//
// We deliberately skip writing to localStorage when not in preview so
// nothing leaks into the live app.

import { isPreviewMode } from "./previewMode";

export type AppTheme = "default" | "cupertino-cryo" | "tesla-whitepaper" | "linear-docs";

export const APP_THEMES: {
  id: AppTheme;
  name: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "default",
    name: "ZenSolar (Default)",
    tagline: "Production look",
    description: "Emerald primary on near-black. The shipping app theme.",
  },
  {
    id: "cupertino-cryo",
    name: "Cupertino Cryo",
    tagline: "Apple × Web3",
    description: "Frosted glass on near-black, aurora gradients, glacial cyan accent.",
  },
  {
    id: "tesla-whitepaper",
    name: "Tesla Whitepaper",
    tagline: "Engineering brutalism",
    description: "Mono everywhere, schematic grid, signal red accent. Dense and authoritative.",
  },
  {
    id: "linear-docs",
    name: "Linear Docs",
    tagline: "Frictionless reading",
    description: "Flat slate surfaces, indigo accent, perfect typography. Speed is the design.",
  },
];

const THEME_KEY = "zen.app.theme";
const PERSISTENCE_KEY = "zen.app.theme.persistence"; // "preview" | "session"
export const DEFAULT_APP_THEME: AppTheme = "default";

export type PersistenceMode = "preview" | "session";

export function isAppTheme(v: unknown): v is AppTheme {
  return typeof v === "string" && APP_THEMES.some((t) => t.id === v);
}

export function getStoredPersistenceMode(): PersistenceMode {
  if (typeof window === "undefined") return "preview";
  try {
    const v = localStorage.getItem(PERSISTENCE_KEY);
    return v === "session" ? "session" : "preview";
  } catch {
    return "preview";
  }
}

export function setStoredPersistenceMode(mode: PersistenceMode) {
  try {
    localStorage.setItem(PERSISTENCE_KEY, mode);
  } catch {
    /* noop */
  }
}

/**
 * Resolve the theme to apply on initial load. Always returns DEFAULT
 * outside preview hosts so production never picks up a stored test theme.
 */
export function getInitialAppTheme(): AppTheme {
  if (typeof window === "undefined") return DEFAULT_APP_THEME;
  if (!isPreviewMode()) return DEFAULT_APP_THEME;

  // Session-only mode: ignore stored value.
  if (getStoredPersistenceMode() === "session") return DEFAULT_APP_THEME;

  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (isAppTheme(stored)) return stored;
  } catch {
    /* noop */
  }
  return DEFAULT_APP_THEME;
}

/** Write the theme to <html data-app-theme> (or remove for default). */
export function applyAppTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "default") {
    root.removeAttribute("data-app-theme");
  } else {
    root.setAttribute("data-app-theme", theme);
  }
}

/**
 * Persist if (a) we're in preview AND (b) persistence mode allows it.
 * Outside preview we never write — this keeps production clean.
 */
export function persistAppTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  if (!isPreviewMode()) return;
  if (getStoredPersistenceMode() === "session") return;
  try {
    if (theme === "default") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    /* noop */
  }
}

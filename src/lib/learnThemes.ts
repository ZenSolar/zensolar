// Learn-section theme system. Scoped via [data-learn-theme="..."] wrapper —
// never affects the rest of the app. Persisted in localStorage so the admin's
// chosen theme survives reloads.

export type LearnTheme = "cupertino-cryo" | "tesla-whitepaper" | "linear-docs";

export const LEARN_THEMES: {
  id: LearnTheme;
  name: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "cupertino-cryo",
    name: "Cupertino Cryo",
    tagline: "Apple, upgraded for Web3",
    description:
      "Frosted glass on near-black, oversized display type, slow aurora gradients. Premium and confident.",
  },
  {
    id: "tesla-whitepaper",
    name: "Tesla Whitepaper",
    tagline: "Engineering brutalism",
    description:
      "Mono fonts, visible grid, numbered sections, schematic feel. Dense and authoritative.",
  },
  {
    id: "linear-docs",
    name: "Linear Docs",
    tagline: "Frictionless reading",
    description:
      "Flat surfaces, perfect typography, sticky TOC, ⌘K palette. Speed is the design.",
  },
];

const STORAGE_KEY = "zen.learn.theme";
export const DEFAULT_LEARN_THEME: LearnTheme = "cupertino-cryo";

export function getStoredLearnTheme(): LearnTheme {
  if (typeof window === "undefined") return DEFAULT_LEARN_THEME;
  try {
    const v = localStorage.getItem(STORAGE_KEY) as LearnTheme | null;
    if (v && LEARN_THEMES.some((t) => t.id === v)) return v;
  } catch {
    /* noop */
  }
  return DEFAULT_LEARN_THEME;
}

export function setStoredLearnTheme(theme: LearnTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent("learn-theme-change", { detail: theme }));
  } catch {
    /* noop */
  }
}

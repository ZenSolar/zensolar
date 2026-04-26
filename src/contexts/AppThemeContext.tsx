import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyAppTheme,
  DEFAULT_APP_THEME,
  getInitialAppTheme,
  getStoredPersistenceMode,
  persistAppTheme,
  setStoredPersistenceMode,
  type AppTheme,
  type PersistenceMode,
} from "@/lib/appThemes";

interface AppThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  persistenceMode: PersistenceMode;
  setPersistenceMode: (mode: PersistenceMode) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const initial = getInitialAppTheme();
    // Apply synchronously on mount to avoid a flash.
    applyAppTheme(initial);
    return initial;
  });
  const [persistenceMode, setPersistenceModeState] = useState<PersistenceMode>(() =>
    getStoredPersistenceMode()
  );

  // Keep <html> attribute in sync if theme changes outside our setter
  useEffect(() => {
    applyAppTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    applyAppTheme(next);
    persistAppTheme(next);
  }, []);

  const setPersistenceMode = useCallback((mode: PersistenceMode) => {
    setPersistenceModeState(mode);
    setStoredPersistenceMode(mode);
    // If switching to session-only, clear any persisted theme
    if (mode === "session") {
      try {
        localStorage.removeItem("zen.app.theme");
      } catch {
        /* noop */
      }
    } else {
      // Switching back to preview-persistent: write current theme.
      persistAppTheme(theme);
    }
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, persistenceMode, setPersistenceMode }),
    [theme, setTheme, persistenceMode, setPersistenceMode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    // Safe fallback so non-wrapped trees don't crash during transitions.
    return {
      theme: DEFAULT_APP_THEME as AppTheme,
      setTheme: () => {},
      persistenceMode: "preview" as PersistenceMode,
      setPersistenceMode: () => {},
    };
  }
  return ctx;
}

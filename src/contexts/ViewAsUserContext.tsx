import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface ViewAsUserState {
  /** The user_id we're currently viewing as (null = viewing as self) */
  targetUserId: string | null;
  /** Display name of the user being viewed */
  targetDisplayName: string | null;
  /** Email of the user being viewed */
  targetEmail: string | null;
}

interface ViewAsUserContextValue extends ViewAsUserState {
  /** Start viewing as another user */
  startViewingAs: (userId: string, displayName: string | null, email: string | null) => void;
  /** Stop viewing as another user (return to self) */
  stopViewingAs: () => void;
  /** Whether we're currently viewing as another user */
  isViewingAsOther: boolean;
}

const ViewAsUserContext = createContext<ViewAsUserContextValue | null>(null);

const STORAGE_KEY = 'zs_view_as_user';

function readPersisted(): ViewAsUserState {
  if (typeof window === 'undefined') {
    return { targetUserId: null, targetDisplayName: null, targetEmail: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { targetUserId: null, targetDisplayName: null, targetEmail: null };
    const parsed = JSON.parse(raw) as Partial<ViewAsUserState>;
    return {
      targetUserId: parsed.targetUserId ?? null,
      targetDisplayName: parsed.targetDisplayName ?? null,
      targetEmail: parsed.targetEmail ?? null,
    };
  } catch {
    return { targetUserId: null, targetDisplayName: null, targetEmail: null };
  }
}

function persist(state: ViewAsUserState) {
  if (typeof window === 'undefined') return;
  try {
    if (state.targetUserId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* noop */
  }
}

export function ViewAsUserProvider({ children }: { children: ReactNode }) {
  // Hydrate from localStorage so a page refresh / boot-recover doesn't drop
  // the admin back into their own dashboard mid-impersonation.
  const [state, setState] = useState<ViewAsUserState>(() => readPersisted());

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setState(readPersisted());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const startViewingAs = useCallback((userId: string, displayName: string | null, email: string | null) => {
    const next = { targetUserId: userId, targetDisplayName: displayName, targetEmail: email };
    persist(next);
    setState(next);
  }, []);

  const stopViewingAs = useCallback(() => {
    const next = { targetUserId: null, targetDisplayName: null, targetEmail: null };
    persist(next);
    setState(next);
  }, []);

  const value: ViewAsUserContextValue = {
    ...state,
    startViewingAs,
    stopViewingAs,
    isViewingAsOther: state.targetUserId !== null,
  };

  return (
    <ViewAsUserContext.Provider value={value}>
      {children}
    </ViewAsUserContext.Provider>
  );
}

export function useViewAsUser() {
  const ctx = useContext(ViewAsUserContext);
  if (!ctx) {
    throw new Error('useViewAsUser must be used within ViewAsUserProvider');
  }
  return ctx;
}

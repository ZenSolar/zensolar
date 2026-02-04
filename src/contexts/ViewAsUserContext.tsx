import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

export function ViewAsUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViewAsUserState>({
    targetUserId: null,
    targetDisplayName: null,
    targetEmail: null,
  });

  const startViewingAs = useCallback((userId: string, displayName: string | null, email: string | null) => {
    setState({
      targetUserId: userId,
      targetDisplayName: displayName,
      targetEmail: email,
    });
  }, []);

  const stopViewingAs = useCallback(() => {
    setState({
      targetUserId: null,
      targetDisplayName: null,
      targetEmail: null,
    });
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

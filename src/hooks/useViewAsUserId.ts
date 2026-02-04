import { useContext, createContext } from 'react';

/**
 * Context to provide a target user ID for "View as User" functionality.
 * When set, data-fetching hooks should fetch data for this user instead of the current user.
 */
const ViewAsUserIdContext = createContext<string | null>(null);

export const ViewAsUserIdProvider = ViewAsUserIdContext.Provider;

/**
 * Hook to get the current "view as" target user ID.
 * Returns null if viewing as self (normal mode).
 */
export function useViewAsUserId(): string | null {
  return useContext(ViewAsUserIdContext);
}

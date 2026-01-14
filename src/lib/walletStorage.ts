/**
 * Utility functions for clearing all wallet-related storage
 * including localStorage, sessionStorage, and IndexedDB
 */

const WALLET_STORAGE_PATTERNS = [
  /^wagmi/i,
  /^rk-/i,
  /^wc@2:/i,
  /^walletconnect/i,
  /^reown/i,
  /^@walletconnect/i,
  /^@reown/i,
  /^WALLETCONNECT/i,
  /^wc_/i,
];

const INDEXEDDB_DATABASES = [
  'WALLET_CONNECT_V2_INDEXED_DB',
  'walletconnect',
  'WalletConnect',
  'reown',
  '@walletconnect',
  '@reown/appkit',
];

function matchesWalletPattern(key: string): boolean {
  return WALLET_STORAGE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Clear all wallet-related keys from localStorage
 */
export function clearWalletLocalStorage(): number {
  if (typeof window === 'undefined') return 0;
  
  let cleared = 0;
  try {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (matchesWalletPattern(key)) {
        window.localStorage.removeItem(key);
        cleared++;
      }
    }
  } catch (e) {
    console.warn('[walletStorage] Failed to clear localStorage:', e);
  }
  return cleared;
}

/**
 * Clear all wallet-related keys from sessionStorage
 */
export function clearWalletSessionStorage(): number {
  if (typeof window === 'undefined') return 0;
  
  let cleared = 0;
  try {
    const keys = Object.keys(window.sessionStorage);
    for (const key of keys) {
      if (matchesWalletPattern(key)) {
        window.sessionStorage.removeItem(key);
        cleared++;
      }
    }
  } catch (e) {
    console.warn('[walletStorage] Failed to clear sessionStorage:', e);
  }
  return cleared;
}

/**
 * Clear all WalletConnect/Reown IndexedDB databases
 */
export async function clearWalletIndexedDB(): Promise<number> {
  if (typeof window === 'undefined' || !window.indexedDB) return 0;
  
  let cleared = 0;
  
  // First, try to get all database names (not supported in all browsers)
  try {
    const databases = await window.indexedDB.databases?.();
    if (databases) {
      for (const db of databases) {
        if (db.name && (matchesWalletPattern(db.name) || INDEXEDDB_DATABASES.some(n => db.name?.includes(n)))) {
          try {
            await deleteDatabase(db.name);
            cleared++;
          } catch {
            // Continue with other databases
          }
        }
      }
    }
  } catch {
    // databases() not supported, try known database names
  }
  
  // Also try to delete known database names directly
  for (const dbName of INDEXEDDB_DATABASES) {
    try {
      await deleteDatabase(dbName);
      cleared++;
    } catch {
      // Database might not exist
    }
  }
  
  return cleared;
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn(`[walletStorage] Database ${name} delete blocked`);
      resolve(); // Resolve anyway, database might be deleted later
    };
  });
}

/**
 * Perform a complete hard reset of all wallet storage
 */
export async function hardResetWalletStorage(): Promise<{
  localStorage: number;
  sessionStorage: number;
  indexedDB: number;
}> {
  const localCleared = clearWalletLocalStorage();
  const sessionCleared = clearWalletSessionStorage();
  const indexedCleared = await clearWalletIndexedDB();
  
  console.log('[walletStorage] Hard reset complete:', {
    localStorage: localCleared,
    sessionStorage: sessionCleared,
    indexedDB: indexedCleared,
  });
  
  return {
    localStorage: localCleared,
    sessionStorage: sessionCleared,
    indexedDB: indexedCleared,
  };
}

/**
 * Get storage statistics for diagnostics
 */
export function getWalletStorageStats(): {
  localStorageKeys: string[];
  sessionStorageKeys: string[];
  totalLocalStorage: number;
  totalSessionStorage: number;
} {
  const localStorageKeys: string[] = [];
  const sessionStorageKeys: string[] = [];
  
  if (typeof window !== 'undefined') {
    try {
      const localKeys = Object.keys(window.localStorage);
      for (const key of localKeys) {
        if (matchesWalletPattern(key)) {
          localStorageKeys.push(key);
        }
      }
    } catch { /* ignore */ }
    
    try {
      const sessionKeys = Object.keys(window.sessionStorage);
      for (const key of sessionKeys) {
        if (matchesWalletPattern(key)) {
          sessionStorageKeys.push(key);
        }
      }
    } catch { /* ignore */ }
  }
  
  return {
    localStorageKeys,
    sessionStorageKeys,
    totalLocalStorage: localStorageKeys.length,
    totalSessionStorage: sessionStorageKeys.length,
  };
}

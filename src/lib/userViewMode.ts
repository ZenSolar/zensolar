// New user view mode management - allows admins to preview as a brand new user
const NEW_USER_VIEW_KEY = 'zensolar_new_user_view_mode';

export function getNewUserViewMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(NEW_USER_VIEW_KEY) === 'true';
}

export function setNewUserViewMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NEW_USER_VIEW_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent('newUserViewModeChange', { detail: enabled }));
}

// Legacy exports for backwards compatibility (maps to new user view)
export function getUserViewMode(): boolean {
  return getNewUserViewMode();
}

export function setUserViewMode(enabled: boolean): void {
  setNewUserViewMode(enabled);
}

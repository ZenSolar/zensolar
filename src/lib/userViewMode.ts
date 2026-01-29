// User view mode management - allows admins to see the app as regular users
const USER_VIEW_KEY = 'zensolar_user_view_mode';

export function getUserViewMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(USER_VIEW_KEY) === 'true';
}

export function setUserViewMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_VIEW_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent('userViewModeChange', { detail: enabled }));
}

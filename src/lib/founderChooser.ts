// Lightweight pub/sub so any founder page can pop the destination chooser.
// Used by the compass button in headers + the ⌘K / Ctrl+K shortcut.

const EVT = "zen:founder-chooser-open";

export function openFounderChooser() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT));
}

export function onFounderChooserOpen(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  const listener = () => handler();
  window.addEventListener(EVT, listener);
  return () => window.removeEventListener(EVT, listener);
}

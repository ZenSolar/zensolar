/**
 * Native (Capacitor) boot polish — splash screen, status bar, keyboard.
 *
 * Web build: every call is a no-op (the plugins gracefully detect non-native
 * platforms and return). Safe to call from main.tsx unconditionally.
 */

export async function initCapacitorRuntime() {
  // Only run inside an actual native shell. `Capacitor.isNativePlatform()`
  // returns false in browsers, including Lovable preview, so this is a no-op
  // for the web build.
  try {
    const { Capacitor } = await import('@capacitor/core').catch(() => ({
      Capacitor: { isNativePlatform: () => false },
    } as { Capacitor: { isNativePlatform: () => boolean } }));

    if (!Capacitor.isNativePlatform()) return;

    // Status bar — translucent dark, web view draws under it so safe-area CSS works.
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch (err) {
      console.debug('[capacitor] StatusBar unavailable:', err);
    }

    // Keyboard — resize the web view natively so inputs scroll into view.
    try {
      const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      await Keyboard.setScroll({ isDisabled: false });
    } catch (err) {
      console.debug('[capacitor] Keyboard unavailable:', err);
    }

    // Splash — auto-hide is already set in capacitor.config.ts; this is the
    // explicit fallback so we never get stuck on splash if React boots fast.
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      // Hide once React has painted (called from main.tsx after first frame).
      await SplashScreen.hide({ fadeOutDuration: 250 });
    } catch (err) {
      console.debug('[capacitor] SplashScreen unavailable:', err);
    }
  } catch (err) {
    console.debug('[capacitor] runtime init skipped:', err);
  }
}

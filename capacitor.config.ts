import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c0faa0dc7beb49f0bf0877c8c4973435',
  appName: 'zensolar',
  webDir: 'dist',
  server: {
    url: 'https://c0faa0dc-7beb-49f0-bf08-77c8c4973435.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  // iOS-level polish: respect safe areas, render under status bar so our
  // CSS env(safe-area-inset-*) does the layout work consistently.
  ios: {
    contentInset: 'never',
    backgroundColor: '#0F172A',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#0F172A',
    // Keep web view drawing edge-to-edge so safe-area CSS applies.
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
};

export default config;

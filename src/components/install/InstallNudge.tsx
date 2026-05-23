import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Web-first install nudge.
 *
 * Listens for `zs:mint-success` events and, on the user's first qualifying
 * mint, surfaces a soft "Add ZenSolar to your home screen" toast — the
 * highest-intent moment to convert browser users into installed-PWA users.
 *
 * Dismissal is sticky (localStorage). We never force the prompt; if the
 * browser's beforeinstallprompt isn't available (e.g. iOS Safari), we
 * route the user to /install for the manual Share → Add to Home Screen
 * walkthrough.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'zs:installNudgeDismissed:v1';
const SHOWN_KEY = 'zs:installNudgeShown:v1';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    (window.navigator as any)?.standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function InstallNudge() {
  useEffect(() => {
    const onMint = () => {
      if (isStandalone()) return;
      try {
        if (localStorage.getItem(DISMISS_KEY) === '1') return;
        if (localStorage.getItem(SHOWN_KEY) === '1') return;
      } catch {
        /* storage blocked — show anyway */
      }

      const prompt = (window as any).__zsInstallPrompt as
        | BeforeInstallPromptEvent
        | undefined;

      // Delay slightly so the mint celebration lands first.
      window.setTimeout(() => {
        try { localStorage.setItem(SHOWN_KEY, '1'); } catch { /* ignore */ }

        toast('Add ZenSolar to your home screen', {
          description: 'Full-screen, faster, and one tap away — no app store needed.',
          duration: 10000,
          action: {
            label: 'Add',
            onClick: async () => {
              if (prompt) {
                try {
                  await prompt.prompt();
                  await prompt.userChoice;
                  (window as any).__zsInstallPrompt = undefined;
                } catch {
                  window.location.assign('/install');
                }
              } else {
                // iOS Safari has no programmatic prompt — show the guide.
                window.location.assign('/install');
              }
            },
          },
          onDismiss: () => {
            try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
          },
        });

        // iOS gets a softer hint that mentions the Share menu.
        if (isIOS() && !prompt) {
          // The toast above already covers it; the /install page has full instructions.
        }
      }, 6000);
    };

    window.addEventListener('zs:mint-success', onMint);
    return () => window.removeEventListener('zs:mint-success', onMint);
  }, []);

  return null;
}

/**
 * Deason handoff for OAuth / status-check failures.
 *
 * When a provider connection fails, we map the error to a hand-written
 * "playbook" — a short, plain-English diagnosis + fix steps in Deason's voice.
 * The toast's "Ask Deason" button calls openDeasonWithError(...) which opens
 * the floating bubble and seeds Deason with that playbook as the first
 * assistant message. The user can then ask follow-up questions naturally.
 */

import { trackEvent } from '@/hooks/useGoogleAnalytics';

/** sessionStorage key used to remember a recent seed per provider so the
 *  OAuth success path can fire a `deason_seeded_connection_success` event. */
const SEED_TS_KEY = (provider: string) => `deason_seed_ts_${provider}`;
const SEED_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Note that Deason just seeded a playbook for this provider. */
function markSeed(provider: string) {
  try {
    sessionStorage.setItem(SEED_TS_KEY(provider), String(Date.now()));
  } catch {
    /* private mode / storage disabled — ignore */
  }
}

/** Returns true if Deason seeded a playbook for this provider in the last
 *  5 minutes. Consumed (and cleared) by the OAuth success path so we only
 *  count one assisted success per failure. */
export function consumeRecentDeasonSeed(provider: string): boolean {
  try {
    const raw = sessionStorage.getItem(SEED_TS_KEY(provider));
    if (!raw) return false;
    const ts = Number(raw);
    sessionStorage.removeItem(SEED_TS_KEY(provider));
    return Number.isFinite(ts) && Date.now() - ts < SEED_WINDOW_MS;
  } catch {
    return false;
  }
}



export type Provider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';
export type OAuthStage = 'start' | 'exchange' | 'sites' | 'validate' | 'login' | 'status';

const BRAND: Record<Provider, string> = {
  tesla: 'Tesla',
  enphase: 'Enphase',
  solaredge: 'SolarEdge',
  wallbox: 'Wallbox',
};

interface Playbook {
  /** Markdown body Deason will speak as the seeded assistant message. */
  body: string;
}

/**
 * Classify a raw error string into a high-level error code so we can pick
 * a playbook. Order matters — first match wins.
 */
function classify(rawMessage: string | undefined): string {
  const m = (rawMessage ?? '').toLowerCase();
  if (m.includes('popup blocked')) return 'popup_blocked';
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('timeout')) return 'network';
  if (m.includes('429') || m.includes('rate') || m.includes('too many')) return 'rate_limited';
  if (m.includes('500') || m.includes('502') || m.includes('503') || m.includes('unavailable')) return 'provider_down';
  if (m.includes('no sites') || m.includes('not found') || m.includes('404')) return 'no_sites';
  if (
    m.includes('unauthorized') ||
    m.includes('invalid_grant') ||
    m.includes('invalid credentials') ||
    m.includes('401') ||
    m.includes('403')
  ) {
    return 'unauthorized';
  }
  return 'unknown';
}

function playbook(provider: Provider, stage: OAuthStage, code: string, raw?: string): Playbook {
  const brand = BRAND[provider];

  // Status check (not a single provider — connected accounts overview failed)
  if (stage === 'status') {
    return {
      body:
        `Hi — I noticed the app couldn't load the status of your connected energy accounts. ` +
        `That usually means a brief network hiccup, not a real problem with your accounts.\n\n` +
        `**Try this:**\n` +
        `1. Check that you have a signal or Wi-Fi.\n` +
        `2. Pull down to refresh, or tap the **Retry** button on the notification.\n` +
        `3. If it keeps failing, sign out and back in to refresh your session.\n\n` +
        `Your connected accounts and earnings are safe either way. Want me to walk you through anything else?`,
    };
  }

  switch (code) {
    case 'popup_blocked':
      return {
        body:
          `Your browser blocked the **${brand}** login popup before it could open. This is a one-tap fix.\n\n` +
          `**On iPhone / Safari:**\n` +
          `1. Tap **AA** (or the puzzle icon) on the left of the address bar.\n` +
          `2. Choose **Website Settings**.\n` +
          `3. Set **Pop-ups** to **Allow**.\n` +
          `4. Come back and tap **Connect ${brand}** again.\n\n` +
          `**On Android / Chrome:**\n` +
          `1. Tap the 🔒 icon next to the URL.\n` +
          `2. Choose **Permissions** → **Pop-ups and redirects** → **Allow**.\n` +
          `3. Try connecting again.\n\n` +
          `Want me to wait here while you do that?`,
      };

    case 'network':
      return {
        body:
          `Your phone couldn't reach **${brand}** just now. Almost always a Wi-Fi or cellular hiccup, not a problem with your account.\n\n` +
          `**Try this in order:**\n` +
          `1. Check you have a signal or Wi-Fi bar.\n` +
          `2. Open ${brand === 'SolarEdge' ? 'monitoring.solaredge.com' : `the ${brand} app`} to confirm it loads.\n` +
          `3. Pull down to refresh ZenSolar, then tap **Connect ${brand}** again.\n\n` +
          `If everything else loads except this, let me know and I'll dig deeper.`,
      };

    case 'rate_limited':
      return {
        body:
          `**${brand}** is briefly rate-limiting requests from ZenSolar. This is normal when many users connect at the same time.\n\n` +
          `**What to do:** wait about a minute, then tap **Connect ${brand}** again. Your data and progress are safe — you don't need to start over.`,
      };

    case 'provider_down':
      return {
        body:
          `**${brand}'s** service is having trouble responding right now. This isn't something on your end.\n\n` +
          `**What to do:**\n` +
          `1. Wait 5–10 minutes.\n` +
          `2. If you want to check, ${
            provider === 'tesla'
              ? '[Tesla status](https://status.tesla.com)'
              : provider === 'enphase'
                ? '[Enphase status](https://status.enphaseenergy.com)'
                : provider === 'solaredge'
                  ? 'check monitoring.solaredge.com — if that\'s slow too, it\'s their side'
                  : 'open the Wallbox app — if it\'s slow too, it\'s their side'
          }.\n` +
          `3. Try **Connect ${brand}** again afterward.\n\n` +
          `Want me to ping you when their status looks good? (Just ask — I'll keep watch.)`,
      };

    case 'no_sites':
      return {
        body:
          `We connected to **${brand}** successfully, but the account doesn't show any sites. ` +
          `The most common reason: you signed in with a personal account, but your installer set up monitoring under a **different email** — usually theirs or one you used at install.\n\n` +
          `**Try this:**\n` +
          `1. Check the email on your install paperwork or first ${brand} welcome email.\n` +
          `2. Disconnect ${brand} from the **Connected Accounts** card.\n` +
          `3. Reconnect using that other email.\n\n` +
          `If you're not sure which email, I can help you figure it out — just tell me your installer's name.`,
      };

    case 'unauthorized':
      if (provider === 'solaredge') {
        return {
          body:
            `**SolarEdge** didn't accept your API key or Site ID. Both have to match exactly.\n\n` +
            `**Get a fresh API key:**\n` +
            `1. Sign in at **monitoring.solaredge.com**.\n` +
            `2. Open **Admin** → **Site Access** → **API Access**.\n` +
            `3. Tap **Generate New Key** and copy the whole string (no spaces).\n\n` +
            `**Find your Site ID:**\n` +
            `It's the number in the URL when you're on your site dashboard — looks like \`1234567\`.\n\n` +
            `Paste both back into ZenSolar and try again. Want me to wait?`,
        };
      }
      if (provider === 'wallbox') {
        return {
          body:
            `**Wallbox** didn't accept your email and password.\n\n` +
            `**Two things to double-check:**\n` +
            `1. Use the **same email and password you use in the Wallbox app** (not your installer's login).\n` +
            `2. If you reset your password recently, log in to the Wallbox app once first to confirm it works there.\n\n` +
            `Tap **Connect Wallbox** again with the right details. I'm here if you get stuck.`,
        };
      }
      // Tesla / Enphase — token expired or denied
      return {
        body:
          `Your **${brand}** authorization expired or was denied. This is normal if it's been a while or if you tapped Cancel on the login screen.\n\n` +
          `**Fix in 10 seconds:**\n` +
          `1. Tap **Connect ${brand}** again.\n` +
          `2. Sign in with your ${brand} credentials on their official login page.\n` +
          `3. Tap **Allow** when ${brand} asks if ZenSolar can read your energy data.\n\n` +
          `That's it — you'll be back in. Want me to stay open while you do it?`,
      };

    case 'unknown':
    default:
      return {
        body:
          `Something went wrong connecting **${brand}**, but the error wasn't one I immediately recognize.\n\n` +
          (raw ? `**Raw message from ${brand}:**\n\`\`\`\n${raw}\n\`\`\`\n\n` : '') +
          `**Try this first:**\n` +
          `1. Tap **Try again** on the notification.\n` +
          `2. If it fails the same way, sign out and back into ZenSolar to refresh your session.\n` +
          `3. Open the ${brand} app to confirm your account is healthy.\n\n` +
          `If you can copy the exact error message above and paste it here, I'll dig in and tell you exactly what to do.`,
      };
  }
}

/**
 * Severity check — only auto-open Deason for hard failures the user is
 * actively staring at (popup blocked, bad creds, wrong account, outage).
 * Skip auto-open for transient/background issues so we don't hijack the screen.
 */
function isCriticalCode(code: string): boolean {
  return (
    code === 'popup_blocked' ||
    code === 'unauthorized' ||
    code === 'no_sites' ||
    code === 'provider_down'
  );
}

/**
 * Open the Deason floating bubble and seed it with a hand-written diagnosis
 * + fix for the given OAuth failure. Safe to call from anywhere.
 */
export function openDeasonWithError(opts: {
  provider: Provider;
  stage: OAuthStage;
  rawMessage?: string;
}) {
  const code = classify(opts.rawMessage);
  const { body } = playbook(opts.provider, opts.stage, code, opts.rawMessage);

  if (typeof window === 'undefined') return;

  // Clear any pending nudge — we're opening now.
  window.dispatchEvent(new Event('deason:nudge:clear'));

  // Open the bubble first
  window.dispatchEvent(new Event('deason:open'));

  // Then seed — small delay so DeasonChat is mounted and listening
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('deason:seed', {
        detail: { assistant: body, meta: { provider: opts.provider, stage: opts.stage, code } },
      }),
    );
  }, 60);

  markSeed(opts.provider);
}


/**
 * Auto-open Deason immediately when an error is "critical" (something the
 * user can't proceed past without help — popup blocked, bad creds, wrong
 * account, provider outage). For softer errors (network blip, rate limit,
 * unknown) we stay quiet and let the toast handle it.
 *
 * Returns true if Deason was auto-opened.
 */
export function maybeAutoOpenDeason(opts: {
  provider: Provider;
  stage: OAuthStage;
  rawMessage?: string;
}): boolean {
  const code = classify(opts.rawMessage);
  if (opts.stage === 'status') return false; // background check, never auto-open
  if (!isCriticalCode(code)) return false;
  trackEvent('deason_auto_opened', {
    provider: opts.provider,
    stage: opts.stage,
    code,
  });
  openDeasonWithError(opts);
  return true;
}

/**
 * Schedule a proactive nudge: if the user hasn't taken action on a failed
 * connection within `delayMs`, pulse the Deason bubble with a badge so they
 * know help is one tap away. Returns a cancel function.
 *
 * The nudge does NOT auto-open the chat (that would hijack the screen).
 * Tapping the bubble opens it and seeds the same playbook.
 */
export function scheduleDeasonNudge(opts: {
  provider: Provider;
  stage: OAuthStage;
  rawMessage?: string;
  delayMs?: number;
}): () => void {
  if (typeof window === 'undefined') return () => {};
  const delay = opts.delayMs ?? 30_000;
  const code = classify(opts.rawMessage);
  const { body } = playbook(opts.provider, opts.stage, code, opts.rawMessage);
  let fired = false;

  const timer = window.setTimeout(() => {
    fired = true;
    trackEvent('deason_nudge_shown', {
      provider: opts.provider,
      stage: opts.stage,
      code,
    });
    markSeed(opts.provider);
    window.dispatchEvent(
      new CustomEvent('deason:nudge', {
        detail: {
          assistant: body,
          meta: { provider: opts.provider, stage: opts.stage, code },
        },
      }),
    );
  }, delay);

  const cancel = () => {
    window.clearTimeout(timer);
    window.removeEventListener('deason:nudge:clear', cancel);
    if (fired) {
      // Nudge was visible but is now being cleared without a tap.
      trackEvent('deason_nudge_dismissed', {
        provider: opts.provider,
        stage: opts.stage,
        code,
      });
    }
  };
  window.addEventListener('deason:nudge:clear', cancel, { once: true });

  return cancel;
}

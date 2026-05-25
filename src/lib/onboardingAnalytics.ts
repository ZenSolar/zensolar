import { trackEvent } from '@/hooks/useGoogleAnalytics';

export type WalletChoiceType = 'zensolar' | 'external' | 'skip';

/**
 * Track when user views the wallet choice screen
 */
export function trackWalletChoiceViewed() {
  trackEvent('onboarding_wallet_choice_viewed', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when user selects a wallet option
 */
export function trackWalletChoiceSelected(choice: WalletChoiceType) {
  trackEvent('wallet_choice_selected', {
    choice,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when wallet is successfully connected/created
 */
export function trackWalletConnected(params: {
  walletType: 'zensolar' | 'external';
  walletAddress: string;
}) {
  trackEvent('wallet_connected', {
    wallet_type: params.walletType,
    wallet_address_prefix: params.walletAddress.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when user skips wallet setup
 */
export function trackWalletSkipped() {
  trackEvent('wallet_skipped', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track onboarding completion
 */
export function trackOnboardingComplete(params: {
  walletType: WalletChoiceType;
  hasWallet: boolean;
}) {
  trackEvent('onboarding_complete', {
    wallet_type: params.walletType,
    has_wallet: params.hasWallet,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track when user returns to complete wallet setup later
 */
export function trackWalletSetupResumed(source: 'dashboard' | 'profile' | 'settings') {
  trackEvent('wallet_setup_resumed', {
    source,
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Passkey ceremony funnel — measure wallet-choice → passkey-complete drop-off.
// Stages: viewed → selected → setup_viewed → passkey_started → (succeeded |
// cancelled | failed) → completed (post-success branded screen dismissed).
// ---------------------------------------------------------------------------

let _passkeySessionId: string | null = null;
let _passkeyStartedAt: number | null = null;

function newPasskeySession() {
  _passkeySessionId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `pk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  _passkeyStartedAt = Date.now();
  return _passkeySessionId;
}

function elapsedMs() {
  return _passkeyStartedAt ? Date.now() - _passkeyStartedAt : null;
}

export function trackWalletSetupViewed() {
  trackEvent('wallet_setup_viewed', {
    session_id: _passkeySessionId,
    timestamp: new Date().toISOString(),
  });
}

export function trackPasskeyStarted() {
  newPasskeySession();
  trackEvent('passkey_started', {
    session_id: _passkeySessionId,
    timestamp: new Date().toISOString(),
  });
}

export function trackPasskeySucceeded(walletAddress: string) {
  trackEvent('passkey_succeeded', {
    session_id: _passkeySessionId,
    elapsed_ms: elapsedMs(),
    wallet_address_prefix: walletAddress.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}

export function trackPasskeyCancelled(reason?: string | null) {
  trackEvent('passkey_cancelled', {
    session_id: _passkeySessionId,
    elapsed_ms: elapsedMs(),
    reason: reason ?? 'user_cancelled',
    timestamp: new Date().toISOString(),
  });
}

export function trackPasskeyFailed(error: string | null) {
  trackEvent('passkey_failed', {
    session_id: _passkeySessionId,
    elapsed_ms: elapsedMs(),
    error: error?.slice(0, 200) ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
}

export function trackPasskeyRetried() {
  trackEvent('passkey_retried', {
    session_id: _passkeySessionId,
    timestamp: new Date().toISOString(),
  });
}

export function trackPasskeyCompleted(walletAddress: string) {
  trackEvent('passkey_completed', {
    session_id: _passkeySessionId,
    elapsed_ms: elapsedMs(),
    wallet_address_prefix: walletAddress.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}

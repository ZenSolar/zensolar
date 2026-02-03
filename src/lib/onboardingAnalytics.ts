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

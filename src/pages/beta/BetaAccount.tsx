import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BetaShell } from './BetaShell';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { useCoinbaseSmartWallet } from '@/hooks/useCoinbaseSmartWallet';
import { supabase } from '@/integrations/supabase/client';
import {
  QCButton,
  QCGlyph,
} from '@/components/onboarding/quiet/QuietCurrent';

/**
 * Secure ZenSolar account — biometric activation moment, not wallet setup.
 * Primary path uses Coinbase Smart Wallet passkey behind neutral copy.
 * Secondary path (I already have a wallet) is intentionally more technical.
 */
export default function BetaAccount() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const { step, error, createWallet, walletAddress } = useCoinbaseSmartWallet();
  const [showExternal, setShowExternal] = useState(false);
  const activating = step === 'connecting' || step === 'authenticating';
  const activated = step === 'success' || !!walletAddress;

  const persistAccount = async (state: 'secured' | 'skipped', address?: string) => {
    const patch = { ...(flow.status as Record<string, unknown>), account: { state } };
    await flow.setStatus(patch as never);
    if (address) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('profiles').update({ wallet_address: address }).eq('id', user.id);
      } catch { /* self-heal handles it later */ }
    }
  };

  const activate = async () => {
    const address = await createWallet();
    if (address) {
      await persistAccount('secured', address);
      setTimeout(async () => {
        await flow.setStep('done');
        navigate('/onboarding/done');
      }, 900);
    }
  };

  const skip = async () => {
    await persistAccount('skipped');
    await flow.setStep('done');
    navigate('/onboarding/done');
  };

  return (
    <BetaShell stage="account" eyebrow="Secure">
      <h1 className="text-[28px] leading-tight font-semibold qc-text mb-2 tracking-tight">
        Secure your account.
      </h1>
      <p className="text-[14px] qc-muted mb-10">
        A single tap with Face ID. No passwords. No seed phrases.
      </p>

      {/* Central seal glyph — idle → pulse (activating) → filled hold (activated) */}
      <div className="mx-auto mb-10 relative" style={{ width: 168, height: 168 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activated ? 'active' : activating ? 'pulse' : 'idle'}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className={
                'w-40 h-40 rounded-full flex items-center justify-center qc-elevated ' +
                (activated
                  ? 'qc-current-border qc-glow-strong'
                  : 'border qc-border')
              }
            >
              <QCGlyph
                name="signal"
                state={activated ? 'active' : activating ? 'live' : 'idle'}
                size={72}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="text-center mb-8 min-h-[24px]">
        {activated && <span className="text-[14px] qc-current-text font-medium">Account activated.</span>}
        {activating && <span className="text-[13px] qc-muted">Waiting for Face ID…</span>}
        {error && !activated && <span className="text-[13px] text-red-400/90">{error}</span>}
      </div>

      {!activated && (
        <>
          <QCButton onClick={activate} disabled={activating}>
            {activating ? 'Activating…' : 'Activate account'}
          </QCButton>

          <div className="mt-5 text-center">
            <button
              onClick={() => setShowExternal((v) => !v)}
              className="text-[13px] qc-muted hover:qc-text transition-colors"
            >
              I already have a wallet
            </button>
          </div>

          <AnimatePresence>
            {showExternal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-xl qc-elevated border qc-border p-4 text-[13px] qc-muted">
                  Connect an existing wallet (MetaMask, Coinbase, WalletConnect) from your profile after
                  onboarding. This preserves your existing keys and network preferences.
                  <button
                    onClick={skip}
                    className="mt-3 block w-full text-left qc-current-text hover:opacity-80"
                  >
                    Continue and connect later →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <button
              onClick={skip}
              className="text-[12px] qc-muted hover:qc-text transition-colors py-2"
            >
              Skip for now
            </button>
          </div>
        </>
      )}
    </BetaShell>
  );
}

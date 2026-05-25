import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecurityGuarantees, SECURITY_TAGLINE } from '@/components/security/SecurityGuarantees';

/**
 * Full security details page. Linked from the SecuritySheet, Settings,
 * and the wallet card. Designed to make a curious user fully confident.
 */
export default function Security() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="max-w-lg mx-auto px-5 pt-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1 text-muted-foreground hover:text-foreground">
            <Link to="/settings">
              <ArrowLeft className="w-4 h-4" /> Back to Settings
            </Link>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" strokeWidth={1.75} />
          </div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight mb-3">
            How ZenSolar protects you
          </h1>
          <p className="text-sm text-muted-foreground max-w-[340px] mx-auto leading-relaxed">
            {SECURITY_TAGLINE}
          </p>
        </motion.div>

        <SecurityGuarantees />

        {/* Honest disclosures */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3 tracking-tight">
            What we want to be honest about
          </h2>
          <ul className="space-y-2.5 text-[13px] text-muted-foreground leading-relaxed">
            <li>
              <span className="text-foreground font-medium">Energy data is not end-to-end encrypted.</span>{' '}
              We have to read your kWh production to mint $ZSOLAR. It's encrypted in
              transit and at rest, but our backend can see it.
            </li>
            <li>
              <span className="text-foreground font-medium">Beta runs on Base Sepolia.</span>{' '}
              We anchor mints on a public testnet today and will flip to Base mainnet
              before public launch.
            </li>
            <li>
              <span className="text-foreground font-medium">You can leave at any time.</span>{' '}
              Because your wallet is self-custodial, you can export it, sign with any
              wallet that supports the same passkey standard, or simply stop using
              ZenSolar — your tokens stay yours.
            </li>
          </ul>
        </motion.section>

        {/* Audit / standards links */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 grid grid-cols-2 gap-3"
        >
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-3.5 py-3 text-[12px] hover:border-primary/40 transition-colors"
          >
            <span className="text-foreground font-medium">Basescan</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
          <a
            href="https://fidoalliance.org/passkeys/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-3.5 py-3 text-[12px] hover:border-primary/40 transition-colors"
          >
            <span className="text-foreground font-medium">Passkeys (FIDO)</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </motion.section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
          Have a security concern? Email{' '}
          <a href="mailto:security@zen.solar" className="underline hover:text-foreground">
            security@zen.solar
          </a>
        </p>
      </div>
    </div>
  );
}

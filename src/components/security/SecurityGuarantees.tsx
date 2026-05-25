import { motion } from 'framer-motion';
import {
  Fingerprint,
  Lock,
  ShieldCheck,
  KeySquare,
  ServerCog,
  LinkIcon,
} from 'lucide-react';

interface Guarantee {
  icon: typeof Fingerprint;
  title: string;
  body: string;
  proof: string;
}

export const GUARANTEES: Guarantee[] = [
  {
    icon: Fingerprint,
    title: 'Your Face ID, your keys',
    body: 'Your wallet\'s private key is generated and stored inside your device\'s Secure Enclave — the same hardware chip that protects Apple Pay.',
    proof: 'Hardware-backed passkey · WebAuthn / FIDO2',
  },
  {
    icon: KeySquare,
    title: 'We can never touch your money',
    body: 'Because the key lives on your device, no one at ZenSolar — and no attacker who breaches our servers — can access, freeze, or move your funds.',
    proof: 'True self-custody · provable on-chain',
  },
  {
    icon: Lock,
    title: 'Bank-grade encryption',
    body: 'Everything in transit is protected with TLS 1.3. Everything at rest — your energy data, connection tokens, profile — is encrypted with AES-256.',
    proof: 'TLS 1.3 in transit · AES-256 at rest',
  },
  {
    icon: ShieldCheck,
    title: 'Only you see your data',
    body: 'Row-Level Security policies on our database mean even our own backend can only return your data when authenticated as you.',
    proof: 'PostgreSQL Row-Level Security (RLS)',
  },
  {
    icon: ServerCog,
    title: 'SOC 2 Type II infrastructure',
    body: 'Our backend runs on infrastructure that\'s independently audited to SOC 2 Type II — the same standard used by banks and healthcare platforms.',
    proof: 'SOC 2 Type II · ISO 27001 · GDPR-aligned',
  },
  {
    icon: LinkIcon,
    title: 'Every mint is verifiable',
    body: 'Each $ZSOLAR reward is anchored on the Base blockchain. Anyone, anywhere, can verify your mint history — it cannot be altered, deleted, or faked.',
    proof: 'Public Base L2 anchoring · open audit trail',
  },
];

interface SecurityGuaranteesProps {
  compact?: boolean;
}

export function SecurityGuarantees({ compact = false }: SecurityGuaranteesProps) {
  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      {GUARANTEES.map((g, i) => {
        const Icon = g.icon;
        return (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-3.5"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-primary" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-foreground leading-snug">
                {g.title}
              </h3>
              <p className={`text-[12.5px] text-muted-foreground leading-relaxed mt-1 ${compact ? '' : ''}`}>
                {g.body}
              </p>
              <p className="text-[10.5px] font-mono text-primary/80 mt-1.5 tracking-tight">
                {g.proof}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * The single, honest one-line promise. Use this in trust footers anywhere.
 */
export const SECURITY_TAGLINE = 'We can never touch your money. Your data is encrypted and only visible to you.';

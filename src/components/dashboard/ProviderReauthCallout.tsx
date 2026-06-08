import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';

export type ReauthProvider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

const LABELS: Record<ReauthProvider, string> = {
  tesla: 'Tesla',
  enphase: 'Enphase',
  solaredge: 'SolarEdge',
  wallbox: 'Wallbox',
};

export interface ProviderReauthCalloutProps {
  provider: ReauthProvider;
  className?: string;
}

/**
 * Inline banner shown when an OEM refresh token has been rejected. Links to
 * the Profile → Integrations surface where users can disconnect + reconnect.
 */
export function ProviderReauthCallout({ provider, className }: ProviderReauthCalloutProps) {
  const basePath = useBasePath();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        'flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30 ' +
        (className ?? '')
      }
    >
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-foreground font-medium">{LABELS[provider]} connection expired</span>
      </div>
      <Link
        to={`${basePath}/profile`}
        className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
      >
        Reconnect
        <ChevronRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

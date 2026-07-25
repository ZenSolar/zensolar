import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface Props {
  children: ReactNode;
  onBack?: () => void;
  eyebrow?: string;
}

/**
 * Shared chrome for every /beta/* screen — logo header, optional back,
 * and a centered content column. Kept intentionally minimal so each screen
 * can focus on its single decision.
 */
export function BetaShell({ children, onBack, eyebrow }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 h-9">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        ) : (
          <div className="w-16" />
        )}
        <img src={zenLogo} alt="ZenSolar" className="h-6 w-auto opacity-90" />
        <div className="w-16" />
      </header>
      <main className="flex-1 flex flex-col px-6 pt-6 pb-10 max-w-md w-full mx-auto">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/80 mb-2">
            {eyebrow}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}

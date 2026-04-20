import { useState } from 'react';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const JOE_PHONE = '+17202246234';
const SMS_BODY = encodeURIComponent(
  "Hey Joe — I'm in the ZenSolar live demo and I want to try minting $ZSOLAR for real. Can you flip my account?"
);
// iOS uses '&', Android uses '?' — this format works on both modern platforms.
const SMS_HREF = `sms:${JOE_PHONE}?&body=${SMS_BODY}`;

interface MintRequestFABProps {
  accessCode?: string | null;
}

/**
 * Floating action button shown inside the LiveMirrorDashboard so VIP viewers
 * (Todd, etc.) can request real mint access in one tap. Logs the request
 * server-side AND opens the user's SMS app pre-filled to Joe.
 */
export function MintRequestFAB({ accessCode }: MintRequestFABProps) {
  const [pulsing, setPulsing] = useState(true);

  const handleTap = async () => {
    setPulsing(false);
    // Fire-and-forget log + admin notification — don't block opening SMS.
    supabase.functions
      .invoke('notify-mint-access-request', {
        body: {
          access_code: accessCode ?? null,
          source: 'live_mirror_fab',
          user_agent: navigator.userAgent,
        },
      })
      .then(({ error }) => {
        if (error) console.warn('mint request log failed:', error);
      });

    toast.success("Opening your texts to Joe…", {
      description: "He'll flip your account so you can mint for real.",
    });

    // Navigate to SMS link
    window.location.href = SMS_HREF;
  };

  return (
    <a
      href={SMS_HREF}
      onClick={(e) => {
        e.preventDefault();
        handleTap();
      }}
      aria-label="Want to mint? Text Joe"
      className={cn(
        "fixed bottom-6 right-4 z-50",
        "flex items-center gap-2 px-4 h-12 rounded-full",
        "bg-primary text-primary-foreground font-semibold text-sm",
        "shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.6)]",
        "border border-primary/40",
        "active:scale-95 transition-transform",
        "hover:brightness-110",
        pulsing && "animate-pulse-slow"
      )}
      style={{
        // Sit above iOS home indicator
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
      }}
    >
      <Zap className="h-4 w-4 fill-current" />
      <span>Want to mint? Text Joe</span>
    </a>
  );
}

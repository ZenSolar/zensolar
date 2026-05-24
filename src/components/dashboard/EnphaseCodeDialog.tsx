import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clipboard,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { DialogSwipeHandle } from '@/components/onboarding/DialogSwipeHandle';

interface EnphaseCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<boolean>;
  authUrl?: string | null;
}

// Enphase authorization codes are 5-10 alphanumeric chars
const ENPHASE_CODE_REGEX = /^[A-Za-z0-9]{5,10}$/;

export function EnphaseCodeDialog({ open, onOpenChange, onSubmit, authUrl }: EnphaseCodeDialogProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Steps: 1 = open Enphase, 2 = paste code, 3 = done
  const [step, setStep] = useState<1 | 2>(1);
  const [openedAuth, setOpenedAuth] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastClipboardContent = useRef<string>('');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setCode('');
    setStep(1);
    setOpenedAuth(false);
    setAutoDetected(false);
    lastClipboardContent.current = '';
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // NOTE: We intentionally do NOT auto-poll the clipboard.
  // iOS Safari shows a system "Allow Paste?" prompt on every
  // navigator.clipboard.readText() call that isn't a direct user gesture.
  // The explicit Paste button below handles clipboard reads on user tap only.

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleOpenEnphase = () => {
    if (!authUrl) {
      toast.error('Authorization link not ready — close and tap Enphase again.');
      return;
    }
    // Direct user gesture → bypasses popup blockers
    window.open(authUrl, '_blank', 'noopener,noreferrer');
    setOpenedAuth(true);
    setStep(2);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.trim());
        setAutoDetected(false);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsSubmitting(true);
    const success = await onSubmit(code.trim());
    setIsSubmitting(false);
    if (success) {
      setCode('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogSwipeHandle onDismiss={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <ExternalLink className="h-4 w-4 text-primary" />
            </span>
            Connect Enphase
          </DialogTitle>
          <DialogDescription>
            Two quick steps — we'll guide you through it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* STEP 1 — Open Enphase */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              step === 1
                ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.12)]'
                : 'border-border bg-card/40 opacity-80'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  openedAuth
                    ? 'bg-primary text-primary-foreground'
                    : step === 1
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/40'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {openedAuth ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Open Enphase & approve access</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We'll send you straight to Enphase. Log in, tap <strong>Allow</strong>, and Enphase will
                  show you a short code to copy.
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="w-full mt-3 h-12 text-sm font-semibold"
                  onClick={handleOpenEnphase}
                  disabled={!authUrl || isSubmitting}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {openedAuth ? 'Re-open Enphase' : 'Open Enphase Login'}
                </Button>
                {openedAuth && (
                  <p className="text-[11px] text-primary mt-2 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Enphase opened in a new tab. Come back here after copying the code.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2 — Paste the code */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              step === 2
                ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.12)]'
                : 'border-border bg-card/40 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  code
                    ? 'bg-primary text-primary-foreground'
                    : step === 2
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/40'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {code ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Paste the authorization code</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap <strong>Paste</strong> below — or just copy it on the Enphase tab and we'll grab it
                  automatically.
                </p>

                {autoDetected && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 border border-primary/30 p-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs font-medium text-primary">Code detected from your clipboard</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      placeholder="e.g., AbCd1234"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setAutoDetected(false);
                      }}
                      disabled={isSubmitting || step !== 2}
                      className={`pr-20 font-mono h-12 text-center text-base tracking-wider ${
                        autoDetected ? 'border-primary bg-primary/5' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-3 text-xs"
                      onClick={handlePaste}
                      disabled={isSubmitting || step !== 2}
                    >
                      <Clipboard className="h-3 w-3 mr-1" />
                      Paste
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 font-semibold"
                    disabled={!code.trim() || isSubmitting || step !== 2}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Connect Enphase
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ExternalLink, Copy, CheckCircle2, Circle, Clipboard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface EnphaseCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<boolean>;
}

const steps = [
  { id: 1, text: 'Log in to your Enphase account' },
  { id: 2, text: 'Authorize ZenSolar to access your data' },
  { id: 3, text: 'Copy the authorization code shown' },
  { id: 4, text: 'Code detected! Click Connect' },
];

// Regex to match Enphase authorization codes (typically 6-8 alphanumeric characters)
const ENPHASE_CODE_REGEX = /^[A-Za-z0-9]{5,10}$/;

export function EnphaseCodeDialog({ open, onOpenChange, onSubmit }: EnphaseCodeDialogProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [autoDetected, setAutoDetected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastClipboardContent = useRef<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect clipboard content that looks like an Enphase code
  const checkClipboard = useCallback(async () => {
    if (!open || isSubmitting || code.length > 0) return;
    
    try {
      // Only works if user has granted clipboard permission
      const text = await navigator.clipboard.readText();
      const trimmed = text?.trim();
      
      // Avoid re-processing the same content
      if (trimmed && trimmed !== lastClipboardContent.current) {
        lastClipboardContent.current = trimmed;
        
        // Check if it looks like an Enphase auth code
        if (ENPHASE_CODE_REGEX.test(trimmed)) {
          setCode(trimmed);
          setCurrentStep(4);
          setAutoDetected(true);
          toast.success('Authorization code detected!', {
            description: 'Click "Connect Account" to complete the connection.',
            icon: <Sparkles className="h-4 w-4" />,
          });
        }
      }
    } catch {
      // Clipboard access denied - that's fine, user can paste manually
    }
  }, [open, isSubmitting, code.length]);

  // Start polling clipboard when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setAutoDetected(false);
      lastClipboardContent.current = '';
      
      // Initial clipboard check after a short delay
      const initialCheck = setTimeout(() => checkClipboard(), 500);
      
      // Poll clipboard every 1.5 seconds
      pollIntervalRef.current = setInterval(checkClipboard, 1500);
      
      // Progress through steps automatically
      const timer1 = setTimeout(() => setCurrentStep(2), 2000);
      const timer2 = setTimeout(() => setCurrentStep(3), 5000);
      
      return () => {
        clearTimeout(initialCheck);
        clearTimeout(timer1);
        clearTimeout(timer2);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    } else {
      setCode('');
      setCurrentStep(1);
      setAutoDetected(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [open, checkClipboard]);

  // Stop polling once code is entered
  useEffect(() => {
    if (code.length > 0 && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [code.length]);

  // Auto-advance to step 4 when code is pasted
  useEffect(() => {
    if (code.length > 0) {
      setCurrentStep(4);
    }
  }, [code]);

  // Focus input when reaching step 3 or 4
  useEffect(() => {
    if (currentStep >= 3 && inputRef.current && !autoDetected) {
      inputRef.current.focus();
    }
  }, [currentStep, autoDetected]);

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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.trim());
        setCurrentStep(4);
        setAutoDetected(false);
      }
    } catch {
      // Clipboard access denied, user can paste manually
      inputRef.current?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <ExternalLink className="h-4 w-4 text-primary" />
            </span>
            Connect Enphase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-detection notice */}
          {autoDetected && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary">Code auto-detected!</p>
                <p className="text-xs text-muted-foreground">We found your authorization code in your clipboard.</p>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  step.id < currentStep
                    ? 'text-primary'
                    : step.id === currentStep
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                ) : step.id === currentStep ? (
                  <div className="relative">
                    <Circle className="h-5 w-5 shrink-0" />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                      {step.id}
                    </span>
                  </div>
                ) : (
                  <Circle className="h-5 w-5 shrink-0 opacity-40" />
                )}
                <span className={`text-sm ${step.id === currentStep ? 'font-medium' : ''}`}>
                  {step.id === 4 && autoDetected ? 'Code detected! Click Connect' : step.text}
                </span>
              </div>
            ))}
          </div>

          {/* Code Input Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Paste authorization code here..."
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setAutoDetected(false);
                }}
                disabled={isSubmitting}
                className={`pr-20 font-mono text-sm h-12 ${autoDetected ? 'border-primary bg-primary/5' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
                onClick={handlePaste}
                disabled={isSubmitting}
              >
                <Clipboard className="h-3 w-3 mr-1" />
                Paste
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={!code.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Account'
                )}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p className="flex items-center justify-center gap-1">
              <Clipboard className="h-3 w-3" />
              We'll automatically detect when you copy the code
            </p>
            <p>
              The Enphase authorization window should have opened. If not,{' '}
              <button
                type="button"
                className="text-primary underline hover:no-underline"
                onClick={() => onOpenChange(false)}
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

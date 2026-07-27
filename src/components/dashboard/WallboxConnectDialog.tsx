import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DialogSwipeHandle } from '@/components/onboarding/DialogSwipeHandle';

interface WallboxConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string, password: string) => Promise<boolean>;
}

export function WallboxConnectDialog({ open, onOpenChange, onSubmit }: WallboxConnectDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consented) {
      setError('Please review and accept the credential storage notice to continue.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(email.trim(), password);
    setIsSubmitting(false);

    if (success) {
      setEmail('');
      setPassword('');
      setConsented(false);
      onOpenChange(false);
    } else {
      setError('Failed to connect. Please check your credentials and try again.');
    }
  };

  const handleClose = (open: boolean) => {
    if (!isSubmitting) {
      setEmail('');
      setPassword('');
      setConsented(false);
      setError(null);
      onOpenChange(open);
    }
  };

  const canSubmit = consented && !!email.trim() && !!password && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md lg:max-w-2xl">
        <DialogSwipeHandle onDismiss={() => handleClose(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
              <Zap className="h-5 w-5 text-primary" />
            </span>
            <span>Connect Wallbox</span>
          </DialogTitle>
          <DialogDescription className="pt-1">
            Wallbox doesn't offer a one-click login for third-party apps, so we need your Wallbox account credentials to keep the connection alive.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Explicit consent — must be checked before password field is usable */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 mt-0.5 text-amber-400 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-amber-100">How ZenSolar stores your Wallbox credentials</p>
                <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                  <li>To keep your Wallbox connected, ZenSolar stores your Wallbox email and password on our servers so we can refresh your access token when it expires.</li>
                  <li>Credentials are stored server-side only, encrypted at rest, and never exposed to the app or shared with third parties.</li>
                  <li>You can disconnect Wallbox at any time from Settings, which permanently deletes the stored credentials.</li>
                </ul>
                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <Checkbox
                    checked={consented}
                    onCheckedChange={(v) => setConsented(v === true)}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <span className="text-[13px] text-foreground">
                    I understand and consent to ZenSolar storing my Wallbox credentials server-side to maintain the connection.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallbox-email">Wallbox account email</Label>
            <Input
              id="wallbox-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || !consented}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallbox-password">Wallbox account password</Label>
            <div className="relative">
              <Input
                id="wallbox-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={consented ? 'Enter your password' : 'Accept the notice above first'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || !consented}
                autoComplete="current-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || !consented}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying with Wallbox…
                </>
              ) : (
                'Connect Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

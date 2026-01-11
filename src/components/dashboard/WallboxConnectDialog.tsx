import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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
      onOpenChange(false);
    } else {
      setError('Failed to connect. Please check your credentials and try again.');
    }
  };

  const handleClose = (open: boolean) => {
    if (!isSubmitting) {
      setEmail('');
      setPassword('');
      setError(null);
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </span>
            Connect Wallbox
          </DialogTitle>
          <DialogDescription>
            Enter your Wallbox account credentials to connect your home EV charger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="wallbox-email">Email Address</Label>
            <Input
              id="wallbox-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallbox-password">Password</Label>
            <div className="relative">
              <Input
                id="wallbox-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p>
                Your credentials are securely transmitted and only used to connect to your Wallbox account.
                We never store your password.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!email.trim() || !password || isSubmitting}
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
      </DialogContent>
    </Dialog>
  );
}

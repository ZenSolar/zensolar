import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sun, ExternalLink, Eye, EyeOff, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SolarEdgeConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (apiKey: string, siteId: string) => Promise<boolean>;
}

export function SolarEdgeConnectDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: SolarEdgeConnectDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [siteId, setSiteId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const siteIdRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !siteId.trim()) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(apiKey.trim(), siteId.trim());
    setIsSubmitting(false);
    
    if (success) {
      setApiKey('');
      setSiteId('');
      onOpenChange(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setApiKey('');
      setSiteId('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sun className="h-4 w-4 text-primary" />
            </span>
            Connect SolarEdge
          </DialogTitle>
          <DialogDescription>
            Enter your SolarEdge API credentials to connect your solar system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Instructions */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                ?
              </span>
              How to find your credentials
            </h4>
            <ol className="text-sm text-muted-foreground space-y-2 ml-7 list-decimal">
              <li>
                Log in to your{' '}
                <a 
                  href="https://monitoring.solaredge.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline inline-flex items-center gap-1"
                >
                  SolarEdge Monitoring Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Go to <strong>Admin</strong> → <strong>Site Access</strong></li>
              <li>Find your <strong>Site ID</strong> in the URL or site details</li>
              <li>Generate or copy your <strong>API Key</strong> from the API Access section</li>
            </ol>
          </div>

          {/* Site ID Input */}
          <div className="space-y-2">
            <Label htmlFor="siteId" className="flex items-center gap-2">
              Site ID
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Your Site ID is a numeric value found in your SolarEdge portal URL or site details page.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="siteId"
              ref={siteIdRef}
              placeholder="e.g., 1234567"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              disabled={isSubmitting}
              className="font-mono"
            />
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              API Key
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Generate an API key from your SolarEdge portal under Admin → Site Access → API Access.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                ref={apiKeyRef}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your SolarEdge API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isSubmitting}
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
                disabled={isSubmitting}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={!apiKey.trim() || !siteId.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect SolarEdge'
              )}
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center">
            Your API key is securely stored and only used to fetch your solar data.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { 
  Loader2, 
  Sun, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SolarEdgeConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (apiKey: string, siteId: string) => Promise<boolean>;
}

// Validation helpers
function validateSiteId(siteId: string): { valid: boolean; error?: string } {
  const trimmed = siteId.trim();
  if (!trimmed) {
    return { valid: false, error: 'Site ID is required' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Site ID should contain only numbers (e.g., 1234567)' };
  }
  if (trimmed.length < 5 || trimmed.length > 10) {
    return { valid: false, error: 'Site ID is typically 5-10 digits long' };
  }
  return { valid: true };
}

function validateApiKey(apiKey: string): { valid: boolean; error?: string } {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { valid: false, error: 'API key is required' };
  }
  if (trimmed.length < 20) {
    return { valid: false, error: 'API key appears too short. It should be a 32-character alphanumeric string.' };
  }
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'API key should only contain letters and numbers' };
  }
  return { valid: true };
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ siteId: false, apiKey: false });
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const siteIdRef = useRef<HTMLInputElement>(null);

  const siteIdValidation = validateSiteId(siteId);
  const apiKeyValidation = validateApiKey(apiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ siteId: true, apiKey: true });
    setErrorMessage(null);
    
    if (!siteIdValidation.valid || !apiKeyValidation.valid) {
      return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit(apiKey.trim(), siteId.trim());
    setIsSubmitting(false);
    
    if (success) {
      setApiKey('');
      setSiteId('');
      setTouched({ siteId: false, apiKey: false });
      onOpenChange(false);
    } else {
      setErrorMessage('Could not connect to SolarEdge. Please verify your Site ID and API key are correct, and that API access is enabled for your site.');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setApiKey('');
      setSiteId('');
      setErrorMessage(null);
      setTouched({ siteId: false, apiKey: false });
      setHelpOpen(false);
      setTroubleshootOpen(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sun className="h-4 w-4 text-primary" />
            </span>
            Connect SolarEdge
          </DialogTitle>
          <DialogDescription>
            Connect your SolarEdge solar system to start earning rewards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Quick Start Instructions */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium text-sm">Quick Setup (3 steps)</h4>
            <ol className="text-sm text-muted-foreground space-y-2.5 ml-0 list-none">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                <span>
                  Open the{' '}
                  <a 
                    href="https://monitoring.solaredge.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline inline-flex items-center gap-1"
                  >
                    SolarEdge Monitoring Portal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {' '}and log in
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
                <span>
                  Your <strong>Site ID</strong> is in the URL after you log in
                  <br />
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    monitoring.solaredge.com/.../site/<strong className="text-primary">1234567</strong>/...
                  </code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
                <span>
                  For <strong>API Key</strong>: Click <strong>Admin</strong> → <strong>Site Access</strong> → <strong>API Access</strong> → Generate or copy your key
                </span>
              </li>
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
                  <p>A numeric ID (e.g., 1234567) found in your SolarEdge portal URL after logging in.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="relative">
              <Input
                id="siteId"
                ref={siteIdRef}
                placeholder="e.g., 1234567"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, siteId: true }))}
                disabled={isSubmitting}
                className={`font-mono ${touched.siteId && !siteIdValidation.valid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {touched.siteId && siteId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {siteIdValidation.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </span>
              )}
            </div>
            {touched.siteId && !siteIdValidation.valid && siteIdValidation.error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {siteIdValidation.error}
              </p>
            )}
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
                  <p>A 32-character alphanumeric key generated from your SolarEdge portal.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                ref={apiKeyRef}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your 32-character API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, apiKey: true }))}
                disabled={isSubmitting}
                className={`pr-20 font-mono text-sm ${touched.apiKey && !apiKeyValidation.valid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {touched.apiKey && apiKey && (
                  apiKeyValidation.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
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
            {touched.apiKey && !apiKeyValidation.valid && apiKeyValidation.error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {apiKeyValidation.error}
              </p>
            )}
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
              disabled={!siteIdValidation.valid || !apiKeyValidation.valid || isSubmitting}
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

          {/* Expandable Help Section */}
          <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Need help finding your credentials?
                </span>
                {helpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="rounded-lg border p-4 space-y-3 text-sm">
                <h5 className="font-medium">Finding your Site ID</h5>
                <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
                  <li>Log in to <a href="https://monitoring.solaredge.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">monitoring.solaredge.com</a></li>
                  <li>Once logged in, look at your browser's address bar</li>
                  <li>The Site ID is the number in the URL, e.g., <code className="bg-muted px-1 rounded">.../site/<strong>1234567</strong>/...</code></li>
                  <li>Alternatively: Click on any site → the Site ID appears in the site details</li>
                </ol>
              </div>

              <div className="rounded-lg border p-4 space-y-3 text-sm">
                <h5 className="font-medium">Generating your API Key</h5>
                <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
                  <li>In the SolarEdge portal, click <strong>Admin</strong> in the top menu</li>
                  <li>Select <strong>Site Access</strong> from the dropdown</li>
                  <li>Scroll down to find the <strong>API Access</strong> section</li>
                  <li>If you see an existing key, copy it. If not, click <strong>Generate API Key</strong></li>
                  <li>Accept the terms if prompted, then copy the generated key</li>
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Troubleshooting Section */}
          <Collapsible open={troubleshootOpen} onOpenChange={setTroubleshootOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Troubleshooting
                </span>
                {troubleshootOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 space-y-2 text-sm">
                <h5 className="font-medium text-amber-800 dark:text-amber-200">Can't find API Access?</h5>
                <p className="text-amber-700 dark:text-amber-300">
                  API access may not be enabled for your account. This depends on your installer's settings. 
                  Contact your solar installer or SolarEdge support to request API access for your site.
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h5 className="font-medium">Connection Failed?</h5>
                <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                  <li>Double-check that your Site ID contains only numbers</li>
                  <li>Ensure the API key is copied completely (32 characters)</li>
                  <li>Make sure your SolarEdge system is online and reporting data</li>
                  <li>Try generating a new API key if the current one isn't working</li>
                </ul>
              </div>

              <div className="text-center">
                <a 
                  href="https://www.solaredge.com/service/support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline hover:no-underline inline-flex items-center gap-1"
                >
                  Contact SolarEdge Support
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center">
            🔒 Your API key is securely stored and only used to fetch your solar production data.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

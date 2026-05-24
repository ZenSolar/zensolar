import { useState, useRef, useCallback } from 'react';
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
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Clipboard,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';

interface SolarEdgeConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (apiKey: string, siteId: string) => Promise<boolean>;
}

type SiteOption = { id: string; name: string; status?: string; peakPower?: number };

function isLikelyApiKey(s: string) {
  const t = s.trim();
  return /^[A-Za-z0-9]{20,}$/.test(t);
}

export function SolarEdgeConnectDialog({
  open,
  onOpenChange,
  onSubmit,
}: SolarEdgeConnectDialogProps) {
  const { listSolarEdgeSites } = useEnergyOAuth();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState(false);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [siteId, setSiteId] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setApiKey('');
    setShowApiKey(false);
    setDiscovering(false);
    setDiscovered(false);
    setSites([]);
    setSiteId('');
    setManualMode(false);
    setErrorMessage(null);
    setHelpOpen(false);
  };

  const discoverSites = useCallback(async (key: string) => {
    if (!isLikelyApiKey(key)) return;
    setDiscovering(true);
    setErrorMessage(null);
    const result = await listSolarEdgeSites(key.trim());
    setDiscovering(false);
    if (!result) {
      // Lookup failed entirely → let user enter Site ID manually as fallback
      setManualMode(true);
      return;
    }
    setSites(result);
    setDiscovered(true);
    if (result.length === 1) {
      setSiteId(result[0].id);
    } else if (result.length === 0) {
      setManualMode(true);
    }
  }, [listSolarEdgeSites]);

  const handlePasteKey = async () => {
    try {
      const text = (await navigator.clipboard.readText())?.trim() ?? '';
      if (text) {
        setApiKey(text);
        if (isLikelyApiKey(text)) await discoverSites(text);
      }
    } catch {
      apiKeyRef.current?.focus();
    }
  };

  const handleKeyChange = (v: string) => {
    setApiKey(v);
    setDiscovered(false);
    setSites([]);
    setSiteId('');
    setManualMode(false);
    setErrorMessage(null);
  };

  const handleKeyBlur = () => {
    if (isLikelyApiKey(apiKey) && !discovered && !discovering) {
      discoverSites(apiKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!apiKey.trim() || !siteId.trim()) return;
    setIsSubmitting(true);
    const success = await onSubmit(apiKey.trim(), siteId.trim());
    setIsSubmitting(false);
    if (success) {
      reset();
      onOpenChange(false);
    } else {
      setErrorMessage('Could not connect. Verify the API key and Site ID, then try again.');
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const canSubmit = !!apiKey.trim() && !!siteId.trim() && !isSubmitting;

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
            Two quick steps — open SolarEdge, then paste your key.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* STEP 1 — Open SolarEdge portal directly to API Access */}
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 shadow-[0_0_20px_hsl(var(--primary)/0.12)]">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold ring-2 ring-primary/40">
                1
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Open SolarEdge & grab your API key</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We'll send you to the SolarEdge Monitoring Portal. Log in, then go to{' '}
                  <strong>Admin → Site Access → API Access</strong> and copy the key.
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="w-full mt-3 h-12 text-sm font-semibold"
                  onClick={() => {
                    window.open(
                      'https://monitoring.solaredge.com/solaredge-web/p/login',
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                  disabled={isSubmitting}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open SolarEdge Portal
                </Button>
              </div>
            </div>
          </div>

          {/* STEP 2 — Paste API key */}
          <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                2
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Paste your API key</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We'll auto-detect your site — no Site ID hunting required.
                </p>
              </div>
            </div>

            <div className="relative">
              <Input
                id="apiKey"
                ref={apiKeyRef}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Paste your 32-character API key"
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                onBlur={handleKeyBlur}
                disabled={isSubmitting}
                className="pr-28 font-mono text-sm h-11"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={handlePasteKey}
                  disabled={isSubmitting}
                >
                  <Clipboard className="h-3 w-3 mr-1" />
                  Paste
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowApiKey((v) => !v)}
                  disabled={isSubmitting}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get it from{' '}
              <a
                href="https://monitoring.solaredge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                monitoring.solaredge.com
                <ExternalLink className="h-3 w-3" />
              </a>
              {' '}→ Admin → Site Access → API Access.
            </p>
          </div>

          {/* Step 2: site discovery / picker */}
          {(discovering || discovered || manualMode) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</span>
                Your site
              </Label>

              {discovering && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border border-dashed border-border p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Looking up your SolarEdge sites…
                </div>
              )}

              {!discovering && discovered && sites.length === 1 && (
                <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sites[0].name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Site ID {sites[0].id}
                      {sites[0].peakPower ? ` · ${sites[0].peakPower} kW` : ''}
                    </p>
                  </div>
                </div>
              )}

              {!discovering && discovered && sites.length > 1 && (
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Pick one of ${sites.length} sites`} />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!discovering && manualMode && (
                <>
                  <Input
                    placeholder="Site ID (e.g., 1234567)"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value.replace(/\D/g, ''))}
                    disabled={isSubmitting}
                    className="font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Auto-discovery didn't find a site for this key. You can paste the Site ID from your monitoring URL ({' '}
                    <code className="bg-muted px-1 rounded">.../site/<strong>1234567</strong>/…</code>).
                  </p>
                </>
              )}
            </div>
          )}

          {/* Action */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Connect SolarEdge
                </>
              )}
            </Button>
          </div>

          {/* Compact help */}
          <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />
                  How to find your API key
                </span>
                {helpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal ml-5">
                <li>Log in to <a href="https://monitoring.solaredge.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">monitoring.solaredge.com</a></li>
                <li>Click <strong>Admin</strong> → <strong>Site Access</strong> → <strong>API Access</strong></li>
                <li>Accept the terms, click <strong>Generate API Key</strong>, then copy it</li>
                <li>Paste here — we'll find your site automatically</li>
              </ol>
              <p className="text-[11px] text-muted-foreground mt-2">
                If API Access isn't visible, ask your installer to enable it on your account.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <p className="text-[11px] text-muted-foreground text-center">
            🔒 Your API key is encrypted and only used to fetch your production data.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

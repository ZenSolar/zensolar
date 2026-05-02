import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileLock2 } from "lucide-react";
import { toast } from "sonner";
// Vite raw import — bundles the markdown file as a string at build time
import ssotRaw from "../../.lovable/memory/CANONICAL_SSOT.md?raw";

export default function AdminSSOT() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(ssotRaw).then(() => {
      setCopied(true);
      toast.success("Copied SSOT to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Pull the version line if present (e.g. "Version: 2.1")
  const versionMatch = ssotRaw.match(/version[:\s]+v?(\d+\.\d+)/i);
  const version = versionMatch ? `v${versionMatch[1]}` : "live";

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <FileLock2 className="h-6 w-6 text-primary" />
            Canonical SSOT
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Single Source of Truth — locked parameters for ZenSolar
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {version}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy All"}
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">
            .lovable/memory/CANONICAL_SSOT.md
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <pre className="text-xs sm:text-sm text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed">
            {ssotRaw}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

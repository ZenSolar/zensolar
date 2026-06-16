import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Satellite, Upload, Camera, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Attestation {
  id: string;
  reading_download_gb: number;
  reading_upload_gb: number;
  delta_gb: number;
  tokens_credited: number;
  ocr_confidence: number | null;
  created_at: string;
  notes: string | null;
}

interface MintSummary {
  download_gb: number;
  upload_gb: number;
  total_gb: number;
  previous_total_gb: number;
  delta_gb: number;
  tokens_credited: number;
  confidence: number;
}

export default function StarlinkMint() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualDl, setManualDl] = useState("");
  const [manualUp, setManualUp] = useState("");
  const [notes, setNotes] = useState("");
  const [lastResult, setLastResult] = useState<MintSummary | null>(null);
  const [history, setHistory] = useState<Attestation[]>([]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("starlink_attestations")
      .select("id,reading_download_gb,reading_upload_gb,delta_gb,tokens_credited,ocr_confidence,created_at,notes")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as Attestation[]) ?? []);
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const onFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const toDataUrl = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const submit = async (mode: "ocr" | "manual") => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (mode === "ocr" && !file) {
      toast.error("Pick a Starlink screenshot first");
      return;
    }
    if (mode === "manual" && !manualDl) {
      toast.error("Enter your total downloaded GB");
      return;
    }
    setBusy(true);
    try {
      let storagePath: string | undefined;
      let imageDataUrl: string | undefined;

      if (mode === "ocr" && file) {
        // Upload to private bucket for proof-of-record
        const ext = file.name.split(".").pop() || "png";
        storagePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("starlink-attestations")
          .upload(storagePath, file, { contentType: file.type });
        if (upErr) console.warn("[starlink] upload failed (continuing with inline OCR)", upErr);
        imageDataUrl = await toDataUrl(file);
      }

      const body =
        mode === "ocr"
          ? { imageDataUrl, storagePath, notes: notes || undefined }
          : {
              manualDownloadGb: Number(manualDl),
              manualUploadGb: manualUp ? Number(manualUp) : 0,
              notes: notes || undefined,
            };

      const { data, error } = await supabase.functions.invoke("starlink-mint", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLastResult(data.summary as MintSummary);
      toast.success(
        data.summary.delta_gb > 0
          ? `Credited ${data.summary.delta_gb.toFixed(2)} $ZSOLAR for ${data.summary.delta_gb.toFixed(2)} GB`
          : "Reading recorded — no new GB since last attestation",
      );
      // reset image so the next reading doesn't accidentally re-submit
      setFile(null);
      setPreview(null);
      setManualDl("");
      setManualUp("");
      setNotes("");
      loadHistory();
    } catch (e: any) {
      console.error("[starlink] mint failed", e);
      toast.error(e?.message ?? "Mint failed");
    } finally {
      setBusy(false);
    }
  };

  const totalCredited = history.reduce((s, h) => s + Number(h.tokens_credited || 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Satellite className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Starlink Mint</h1>
          <Badge variant="outline">Beta · Manual Attestation</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Snap your Starlink app's <strong>Data Usage</strong> screen. We OCR the cumulative GB,
          compute the delta from your last reading, and credit{" "}
          <strong className="text-foreground">1 GB = 1 $ZSOLAR</strong>.
          {" "}First reading is capped at 200 GB to avoid surprise mega-credits.
        </p>
      </header>

      {history.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="text-xs text-muted-foreground">Total credited so far</div>
              <div className="text-2xl font-bold">{totalCredited.toFixed(2)} $ZSOLAR</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Attestations</div>
              <div className="text-2xl font-bold">{history.length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Upload screenshot</CardTitle>
          <CardDescription>
            Open the Starlink app → Statistics → Data Usage. Screenshot the cumulative total.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Label htmlFor="starlink-file" className="flex-1">
              <div className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                {file ? file.name : "Choose file"}
              </div>
              <Input
                id="starlink-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </Label>
            <Label htmlFor="starlink-camera" className="flex-1 sm:max-w-[180px]">
              <div className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground hover:bg-muted/50">
                <Camera className="h-4 w-4" />
                Camera
              </div>
              <Input
                id="starlink-camera"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </Label>
          </div>
          {preview && (
            <img
              src={preview}
              alt="Starlink screenshot preview"
              className="max-h-72 w-full rounded-md border object-contain"
            />
          )}
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button onClick={() => submit("ocr")} disabled={busy || !file} className="w-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            OCR & Mint
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Or 2. Enter manually</CardTitle>
          <CardDescription>If OCR misreads it, type the cumulative totals from the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dl">Total downloaded (GB)</Label>
              <Input
                id="dl"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="e.g. 124.5"
                value={manualDl}
                onChange={(e) => setManualDl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="up">Total uploaded (GB)</Label>
              <Input
                id="up"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="optional"
                value={manualUp}
                onChange={(e) => setManualUp(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => submit("manual")}
            disabled={busy || !manualDl}
            className="w-full"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Record manual reading & mint delta
          </Button>
        </CardContent>
      </Card>

      {lastResult && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">Last mint result</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Stat label="Downloaded" value={`${lastResult.download_gb.toFixed(2)} GB`} />
            <Stat label="Uploaded" value={`${lastResult.upload_gb.toFixed(2)} GB`} />
            <Stat label="Prev total" value={`${lastResult.previous_total_gb.toFixed(2)} GB`} />
            <Stat label="Delta" value={`${lastResult.delta_gb.toFixed(2)} GB`} highlight />
            <Stat label="Credited" value={`${lastResult.tokens_credited.toFixed(2)} $ZSOLAR`} highlight />
            <Stat label="OCR confidence" value={`${Math.round(lastResult.confidence * 100)}%`} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Attestation history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attestations yet — submit your first reading above.</p>
          ) : (
            <div className="divide-y">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">
                      {Number(h.delta_gb).toFixed(2)} GB → {Number(h.tokens_credited).toFixed(2)} $ZSOLAR
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()} · DL {Number(h.reading_download_gb).toFixed(1)} GB / UL {Number(h.reading_upload_gb).toFixed(1)} GB
                      {h.ocr_confidence != null ? ` · ${Math.round(Number(h.ocr_confidence) * 100)}%` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border bg-card/50 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={highlight ? "text-base font-bold text-primary" : "text-sm font-medium"}>{value}</div>
    </div>
  );
}

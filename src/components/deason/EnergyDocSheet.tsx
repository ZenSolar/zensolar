import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Banknote, FileSignature, X, Loader2, ShieldCheck } from "lucide-react";
import type { EnergyDocInput, EnergyDocKind } from "@/hooks/useEnergyReport";

interface Slot {
  kind: EnergyDocKind;
  label: string;
  hint: string;
  icon: React.ReactNode;
  required: boolean;
}

const SLOTS: Slot[] = [
  { kind: "utility_bill", label: "Utility bill", hint: "Most recent PDF or photo", icon: <Receipt className="h-4 w-4" />, required: true },
  { kind: "installer_contract", label: "Installer contract", hint: "Agreement from the company that installed your panels or battery", icon: <FileText className="h-4 w-4" />, required: false },
  { kind: "ppa", label: "PPA / lease agreement", hint: "Power Purchase Agreement or lease (Sunrun, Sunnova, etc.) — if you have one", icon: <FileSignature className="h-4 w-4" />, required: false },
  { kind: "loan", label: "Loan paperwork", hint: "Only if you financed the system separately (Mosaic, GoodLeap, Sunlight, etc.)", icon: <Banknote className="h-4 w-4" />, required: false },
];

const MAX_MB = 12;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (docs: EnergyDocInput[]) => Promise<void> | void;
  loading?: boolean;
}

/**
 * Bottom-sheet style modal for collecting the docs that power the Solar
 * Concierge analysis. Mobile-first, trusted-advisor framing. The utility
 * bill is required; contract + loan are optional but unlock deeper analysis.
 */
export function EnergyDocSheet({ open, onOpenChange, onSubmit, loading }: Props) {
  const [docs, setDocs] = useState<Partial<Record<EnergyDocKind, EnergyDocInput>>>({});
  const inputRefs = useRef<Record<EnergyDocKind, HTMLInputElement | null>>({
    utility_bill: null, installer_contract: null, ppa: null, loan: null,
  });
  });

  const reset = () => { setDocs({}); setError(null); };

  const handleFile = (kind: EnergyDocKind, file: File | undefined) => {
    if (!file) return;
    setError(null);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) { setError("Please upload a PDF or image."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File too large (max ${MAX_MB}MB).`); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setDocs((prev) => ({
        ...prev,
        [kind]: { kind, dataUrl: String(reader.result), filename: file.name },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const list = Object.values(docs).filter(Boolean) as EnergyDocInput[];
    if (!list.find((d) => d.kind === "utility_bill")) {
      setError("A utility bill is required for the analysis.");
      return;
    }
    await onSubmit(list);
  };

  const filledCount = Object.keys(docs).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">Solar Concierge Analysis</DialogTitle>
          <DialogDescription className="text-xs">
            I'll read your documents and write you a personalized energy report — rate plan, ROI, contract risks, and savings opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-3 space-y-2">
          {SLOTS.map((slot) => {
            const doc = docs[slot.kind];
            return (
              <div key={slot.kind}>
                <input
                  ref={(el) => { inputRefs.current[slot.kind] = el; }}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(slot.kind, e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => inputRefs.current[slot.kind]?.click()}
                  className={`w-full flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    doc ? "border-amber-500/60 bg-amber-500/5" : "border-border/60 bg-card hover:bg-accent"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    {slot.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {slot.label}
                      {slot.required && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">required</span>}
                    </div>
                    {doc ? (
                      <div className="mt-0.5 truncate text-xs text-amber-500">{doc.filename}</div>
                    ) : (
                      <div className="mt-0.5 text-xs text-muted-foreground">{slot.hint}</div>
                    )}
                  </div>
                  {doc && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setDocs((p) => { const c = { ...p }; delete c[slot.kind]; return c; }); }}
                      className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="px-5 pb-2 text-xs text-destructive">{error}</div>
        )}

        <div className="border-t border-border/60 bg-muted/30 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Documents stay private to you.
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || filledCount === 0}
            className="bg-amber-500 text-black hover:bg-amber-400"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : "Generate report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

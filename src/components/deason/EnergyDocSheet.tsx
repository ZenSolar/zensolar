import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Banknote, FileSignature, X, Loader2, ShieldCheck } from "lucide-react";
import type { EnergyDocInput, EnergyDocKind } from "@/hooks/useEnergyReport";

type FinancingChoice = "ppa" | "loan";

interface Slot {
  // The kind we actually emit; for the financing slot this is resolved from `financingChoice`.
  resolvedKind: EnergyDocKind | "financing";
  label: string;
  hint: string;
  icon: React.ReactNode;
  required: boolean;
}

const SLOTS: Slot[] = [
  {
    resolvedKind: "utility_bill",
    label: "Most recent utility bill",
    hint: "PDF or photo — required for any analysis",
    icon: <Receipt className="h-4 w-4" />,
    required: true,
  },
  {
    resolvedKind: "installer_contract",
    label: "Solar installation contract",
    hint: "The agreement from your installer (recommended)",
    icon: <FileText className="h-4 w-4" />,
    required: false,
  },
  {
    resolvedKind: "financing",
    label: "PPA or loan paperwork",
    hint: "Whichever applies — most homeowners have one, not both",
    icon: <FileSignature className="h-4 w-4" />,
    required: false,
  },
];

const MAX_MB = 12;

export interface EnergyDocMeta {
  esid?: string;
  state_code?: string;
  utility_name?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (docs: EnergyDocInput[], meta?: EnergyDocMeta) => Promise<void> | void;
  loading?: boolean;
  defaultMeta?: EnergyDocMeta;
}

/**
 * Mobile-first bottom-sheet for the Deason document analysis flow.
 * Three slots: utility bill (required), installer contract (recommended),
 * and a single PPA-or-loan slot the user labels themselves.
 */
export function EnergyDocSheet({ open, onOpenChange, onSubmit, loading }: Props) {
  const [docs, setDocs] = useState<Partial<Record<EnergyDocKind, EnergyDocInput>>>({});
  const [financingChoice, setFinancingChoice] = useState<FinancingChoice>("ppa");
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const reset = () => { setDocs({}); setError(null); };

  const resolveKind = (slot: Slot): EnergyDocKind =>
    slot.resolvedKind === "financing" ? financingChoice : slot.resolvedKind;

  const handleFile = (slot: Slot, file: File | undefined) => {
    if (!file) return;
    setError(null);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) { setError("Please upload a PDF or image."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File too large (max ${MAX_MB}MB).`); return; }
    const kind = resolveKind(slot);
    const reader = new FileReader();
    reader.onload = () => {
      setDocs((prev) => {
        // For the financing slot, drop the other variant so we never send both.
        const next: Partial<Record<EnergyDocKind, EnergyDocInput>> = { ...prev };
        if (slot.resolvedKind === "financing") {
          delete next.ppa;
          delete next.loan;
        }
        next[kind] = { kind, dataUrl: String(reader.result), filename: file.name };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const clearSlot = (slot: Slot) => {
    setDocs((prev) => {
      const next = { ...prev };
      if (slot.resolvedKind === "financing") {
        delete next.ppa;
        delete next.loan;
      } else {
        delete next[slot.resolvedKind as EnergyDocKind];
      }
      return next;
    });
  };

  const slotFilename = (slot: Slot): string | undefined => {
    if (slot.resolvedKind === "financing") {
      return docs.ppa?.filename ?? docs.loan?.filename;
    }
    return docs[slot.resolvedKind as EnergyDocKind]?.filename;
  };

  const handleSubmit = async () => {
    const list = Object.values(docs).filter(Boolean) as EnergyDocInput[];
    if (!list.find((d) => d.kind === "utility_bill")) {
      setError("Your utility bill is required so the analysis is grounded in real numbers.");
      return;
    }
    await onSubmit(list);
  };

  const filledCount = Object.keys(docs).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">Analyze my energy setup</DialogTitle>
          <DialogDescription className="text-xs">
            Deason will read your documents and write a personalized analysis — rate plan, ROI, contract fairness, and the highest-impact savings actions.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-3 space-y-2">
          {SLOTS.map((slot) => {
            const filename = slotFilename(slot);
            const filled = !!filename;
            const refKey = slot.resolvedKind;
            return (
              <div key={refKey}>
                <input
                  ref={(el) => { inputRefs.current[refKey] = el; }}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(slot, e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => inputRefs.current[refKey]?.click()}
                  className={`w-full flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    filled ? "border-amber-500/60 bg-amber-500/5" : "border-border/60 bg-card hover:bg-accent"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    {slot.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {slot.label}
                      {slot.required && (
                        <span className="text-[10px] uppercase tracking-wide text-amber-500/80">required</span>
                      )}
                    </div>
                    {filled ? (
                      <div className="mt-0.5 truncate text-xs text-amber-500">{filename}</div>
                    ) : (
                      <div className="mt-0.5 text-xs text-muted-foreground">{slot.hint}</div>
                    )}

                    {slot.resolvedKind === "financing" && (
                      <div className="mt-2 flex items-center gap-3 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        <FinancingRadio
                          checked={financingChoice === "ppa"}
                          onChange={() => setFinancingChoice("ppa")}
                          label="PPA / lease"
                        />
                        <FinancingRadio
                          checked={financingChoice === "loan"}
                          onChange={() => setFinancingChoice("loan")}
                          label="Solar loan"
                        />
                      </div>
                    )}
                  </div>
                  {filled && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); clearSlot(slot); }}
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
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : "Run analysis"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FinancingRadio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input
        type="radio"
        className="h-3 w-3 accent-amber-500"
        checked={checked}
        onChange={onChange}
      />
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </label>
  );
}

// Re-import the icon types so Banknote/Loader2 stay referenced for parent imports.
// (Keep these to avoid accidental tree-shake regressions if SLOTS evolves.)
void Banknote;

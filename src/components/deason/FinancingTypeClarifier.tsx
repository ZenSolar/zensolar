import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Banknote, FileSignature, HandCoins, Home, HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FinancingType } from "@/hooks/useEnergyReport";

export interface ClarifyTarget {
  /** deason_documents row ids to tag with the same financing type. */
  docIds: string[];
  /** Short hint shown above the buttons (e.g. filenames). */
  fileLabels?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ClarifyTarget;
  onSaved?: (choice: FinancingType) => void;
}

const OPTIONS: Array<{ value: FinancingType; label: string; sub: string; icon: React.ReactNode }> = [
  { value: "cash", label: "Cash purchase", sub: "Owned outright — no loan or PPA", icon: <Banknote className="h-4 w-4" /> },
  { value: "loan", label: "Loan / financed", sub: "Through a solar lender", icon: <HandCoins className="h-4 w-4" /> },
  { value: "ppa", label: "PPA", sub: "Power Purchase Agreement — pay per kWh", icon: <FileSignature className="h-4 w-4" /> },
  { value: "lease", label: "Lease", sub: "Fixed monthly payment", icon: <Home className="h-4 w-4" /> },
  { value: "unsure", label: "Other / not sure", sub: "Deason will treat numbers as ranges", icon: <HelpCircle className="h-4 w-4" /> },
];

/**
 * Friendly one-tap clarification shown right after a contract / PPA / loan
 * upload. Stores the answer on every matching `deason_documents` row so
 * future analyses and chats can reference it. Fully skippable.
 */
export function FinancingTypeClarifier({ open, onOpenChange, target, onSaved }: Props) {
  const [saving, setSaving] = useState<FinancingType | null>(null);

  const save = async (choice: FinancingType) => {
    if (!target.docIds.length) {
      onOpenChange(false);
      return;
    }
    setSaving(choice);
    try {
      await supabase.from("deason_documents").update({ financing_type: choice }).in("id", target.docIds);
      onSaved?.(choice);
      onOpenChange(false);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base">One quick question</DialogTitle>
          <DialogDescription className="text-xs">
            To give you the most accurate advice, can you confirm what type of installation this is?
            Deason will remember your answer.
          </DialogDescription>
        </DialogHeader>

        {target.fileLabels && target.fileLabels.length > 0 && (
          <div className="px-5 pb-2 text-[11px] text-muted-foreground">
            Files: {target.fileLabels.slice(0, 3).join(", ")}
            {target.fileLabels.length > 3 ? ` (+${target.fileLabels.length - 3} more)` : ""}
          </div>
        )}

        <div className="space-y-1.5 px-5 pb-3">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={!!saving}
              onClick={() => void save(o.value)}
              className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent disabled:opacity-60"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                {o.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-[11px] text-muted-foreground">{o.sub}</span>
              </span>
              {saving === o.value && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-5 py-3 text-[11px] text-muted-foreground">
          <span>Totally optional — you can answer later from the Document Library.</span>
          <button
            type="button"
            disabled={!!saving}
            onClick={() => onOpenChange(false)}
            className="font-medium text-foreground hover:underline disabled:opacity-60"
          >
            Skip
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

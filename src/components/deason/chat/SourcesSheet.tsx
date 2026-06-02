import { X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { kindIcon, type DocIndexEntry } from "./CitationChip";

const KIND_LABEL: Record<DocIndexEntry["kind"], string> = {
  utility_bill: "Utility bill",
  installer_contract: "Installer contract",
  ppa: "PPA / lease",
  loan: "Solar loan",
  other: "Document",
  energy_analysis: "Energy analysis",
};

/**
 * Bottom-sheet listing the documents Deason cited in a given message.
 * "Open Document Library" navigates to /deason.
 */
export function SourcesSheet({
  entries,
  onClose,
}: {
  entries: DocIndexEntry[] | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  if (!entries) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close sources"
        onClick={onClose}
        className="absolute inset-0 z-40 bg-background/70 backdrop-blur-sm animate-in fade-in duration-150"
      />
      <div className="absolute inset-x-0 bottom-0 z-50 flex max-h-[70%] flex-col rounded-t-2xl border-t border-amber-500/40 bg-card shadow-xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <div className="text-sm font-semibold">
            Sources <span className="ml-1 text-xs text-muted-foreground">({entries.length})</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent/60"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30">
                <span className="text-[10px] font-bold">{e.index > 0 ? e.index : "?"}</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-sm font-medium">
                  <span className="text-amber-500">{kindIcon(e.kind)}</span>
                  <span className="truncate">{e.label}</span>
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {KIND_LABEL[e.kind]}
                  {e.uploadedAt && ` · ${new Date(e.uploadedAt).toLocaleDateString()}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border/60 p-2">
          <Button
            variant="outline"
            className="w-full justify-center gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            onClick={() => {
              onClose();
              // Deep-link to the first known cited doc so DocumentLibrary can highlight + scroll to it.
              const firstKnown = entries.find((e) => e.index > 0);
              navigate(firstKnown ? `/deason?doc=${encodeURIComponent(firstKnown.id)}` : "/deason");
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Document Library
          </Button>
        </div>
      </div>
    </>
  );
}

export default SourcesSheet;

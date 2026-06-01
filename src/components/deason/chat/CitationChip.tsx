import { FileText, Receipt, FileSignature } from "lucide-react";
import type { LibraryDoc } from "@/hooks/useDeasonHub";

export interface DocIndexEntry {
  id: string;
  index: number; // 1-based display number
  kind: LibraryDoc["kind"] | "energy_analysis";
  label: string;
  uploadedAt?: string;
}

export function kindIcon(kind: DocIndexEntry["kind"]) {
  if (kind === "utility_bill") return <Receipt className="h-2.5 w-2.5" />;
  if (kind === "installer_contract" || kind === "ppa" || kind === "loan")
    return <FileSignature className="h-2.5 w-2.5" />;
  return <FileText className="h-2.5 w-2.5" />;
}

/**
 * Inline numbered citation chip. Rendered in place of `[doc:<id>]` markers.
 * Consecutive citations group visually into "[1][2]".
 */
export function CitationChip({
  entries,
  onOpen,
}: {
  entries: DocIndexEntry[];
  onOpen: (entries: DocIndexEntry[]) => void;
}) {
  if (!entries.length) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(entries)}
      title={entries.map((e) => `[${e.index}] ${e.label}`).join("\n")}
      className="ml-0.5 inline-flex h-4 items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 align-middle text-[10px] font-semibold text-amber-500 ring-1 ring-amber-500/30 transition-colors hover:bg-amber-500/25"
    >
      {entries.map((e, i) => (
        <span key={e.id} className="inline-flex items-center gap-0.5">
          {i === 0 && kindIcon(e.kind)}
          <span>{e.index}</span>
          {i < entries.length - 1 && <span className="opacity-40">·</span>}
        </span>
      ))}
    </button>
  );
}

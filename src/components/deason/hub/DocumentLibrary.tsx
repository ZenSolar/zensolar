import { FileText, Receipt, FileSignature, FilePlus2 } from "lucide-react";
import type { LibraryDoc } from "@/hooks/useDeasonHub";

const KIND_META: Record<LibraryDoc["kind"], { label: string; icon: React.ReactNode }> = {
  utility_bill: { label: "Utility bills", icon: <Receipt className="h-4 w-4" /> },
  installer_contract: { label: "Installer contracts", icon: <FileText className="h-4 w-4" /> },
  ppa: { label: "PPAs / leases", icon: <FileSignature className="h-4 w-4" /> },
  loan: { label: "Solar loans", icon: <FileSignature className="h-4 w-4" /> },
  other: { label: "Other documents", icon: <FileText className="h-4 w-4" /> },
};

export function DocumentLibrary({ docs, onUpload }: { docs: LibraryDoc[]; onUpload?: () => void }) {
  const grouped = docs.reduce<Record<string, LibraryDoc[]>>((acc, d) => {
    (acc[d.kind] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Your document library</div>
          <div className="text-xs text-muted-foreground">Permanent. Deason references these on every chat.</div>
        </div>
        {onUpload && (
          <button
            type="button"
            onClick={onUpload}
            className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/15"
          >
            <FilePlus2 className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
          No documents yet. Upload your utility bill to get started.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {(Object.keys(KIND_META) as LibraryDoc["kind"][]).map((kind) => {
            const items = grouped[kind] ?? [];
            if (!items.length) return null;
            const meta = KIND_META[kind];
            return (
              <div key={kind}>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span className="text-amber-500">{meta.icon}</span>
                  {meta.label} · {items.length}
                </div>
                <ul className="mt-1 space-y-1">
                  {items.slice(0, 4).map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-md bg-background px-2.5 py-1.5 text-xs">
                      <span className="truncate">{d.label ?? d.storage_path.split("/").pop()}</span>
                      <span className="ml-2 flex-shrink-0 text-[10px] text-muted-foreground">{new Date(d.uploaded_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

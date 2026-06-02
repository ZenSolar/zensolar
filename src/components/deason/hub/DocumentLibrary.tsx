import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Receipt,
  FileSignature,
  FilePlus2,
  Search,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import type { LibraryDoc } from "@/hooks/useDeasonHub";
import { cn } from "@/lib/utils";

type Kind = LibraryDoc["kind"];

const KIND_META: Record<Kind, { label: string; short: string; icon: React.ReactNode; tag: string }> = {
  utility_bill:        { label: "Utility bills",        short: "Bill",     icon: <Receipt className="h-3.5 w-3.5" />,        tag: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  installer_contract:  { label: "Installer contracts",  short: "Contract", icon: <FileText className="h-3.5 w-3.5" />,       tag: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  ppa:                 { label: "PPAs / leases",        short: "PPA",      icon: <FileSignature className="h-3.5 w-3.5" />,  tag: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  loan:                { label: "Solar loans",          short: "Loan",     icon: <FileSignature className="h-3.5 w-3.5" />,  tag: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  other:               { label: "Other documents",      short: "Other",    icon: <FileText className="h-3.5 w-3.5" />,       tag: "bg-muted text-muted-foreground border-border" },
};

const FILTERS: Array<{ id: "all" | Kind; label: string }> = [
  { id: "all", label: "All" },
  { id: "utility_bill", label: "Bills" },
  { id: "installer_contract", label: "Contracts" },
  { id: "ppa", label: "PPAs" },
  { id: "loan", label: "Loans" },
  { id: "other", label: "Other" },
];

const STICKER_KEY = "deason_doc_stickers_v1";
const STICKER_TTL_MS = 24 * 60 * 60 * 1000;

type Sticker = { docId: string; bullets: string[]; ts: number };

function loadStickers(): Record<string, Sticker> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STICKER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Sticker>;
    const now = Date.now();
    const fresh: Record<string, Sticker> = {};
    Object.entries(parsed).forEach(([k, v]) => {
      if (v && now - v.ts < STICKER_TTL_MS) fresh[k] = v;
    });
    return fresh;
  } catch {
    return {};
  }
}

export function DocumentLibrary({
  docs,
  onUpload,
  onAsk,
}: {
  docs: LibraryDoc[];
  onUpload?: (file?: File) => void;
  onAsk?: (doc: LibraryDoc) => void;
}) {
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [stickers, setStickers] = useState<Record<string, Sticker>>({});
  const dropRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Re-hydrate stickers whenever the doc set actually changes (not just length —
  // a replace at the same count would otherwise miss).
  const docIdsKey = useMemo(() => docs.map((d) => d.id).join("|"), [docs]);
  useEffect(() => { setStickers(loadStickers()); }, [docIdsKey]);

  // Deep-link: SourcesSheet → /deason?doc=<id> scrolls + highlights the card.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("doc");
    if (!id) return;
    const exists = docs.some((d) => d.id === id);
    if (!exists) return;
    setHighlightedId(id);
    requestAnimationFrame(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const t = window.setTimeout(() => {
      setHighlightedId(null);
      // Clean the query so a reload doesn't re-trigger the highlight.
      navigate(location.pathname, { replace: true });
    }, 2400);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.search, docIdsKey, docs, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (filter !== "all" && d.kind !== filter) return false;
      if (!q) return true;
      const name = (d.label ?? d.storage_path.split("/").pop() ?? "").toLowerCase();
      return name.includes(q);
    });
  }, [docs, filter, query]);

  const countByKind = useMemo(() => {
    const c: Partial<Record<Kind, number>> = {};
    docs.forEach((d) => { c[d.kind] = (c[d.kind] ?? 0) + 1; });
    return c;
  }, [docs]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    onUpload?.(file);
  }, [onUpload]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Your document library</div>
          <div className="text-xs text-muted-foreground">Permanent · Deason references these on every chat</div>
        </div>
        {onUpload && (
          <button
            type="button"
            onClick={() => onUpload()}
            className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/15"
          >
            <FilePlus2 className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>

      {/* Persistent dropzone */}
      {onUpload && (
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => onUpload()}
          className={cn(
            "mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-3 text-xs transition-colors",
            dragOver
              ? "border-amber-500/70 bg-amber-500/10 text-amber-400"
              : "border-border/60 bg-background/60 text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/5"
          )}
        >
          <UploadCloud className="h-4 w-4" />
          <span>{dragOver ? "Drop to upload" : "Drag a PDF or photo here, or tap to add"}</span>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm font-medium">Start with one utility bill</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Deason needs real numbers to ground every answer. A single PDF unlocks everything.
          </p>
          {onUpload && (
            <button
              type="button"
              onClick={() => onUpload()}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload bill
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Search + filter pills */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
                className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs outline-none placeholder:text-muted-foreground focus:border-amber-500/60"
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              const count = f.id === "all" ? docs.length : (countByKind[f.id as Kind] ?? 0);
              if (f.id !== "all" && count === 0) return null;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                    active
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label} <span className="ml-1 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Card grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {filtered.map((d) => {
              const meta = KIND_META[d.kind];
              const name = d.label ?? d.storage_path.split("/").pop() ?? "Document";
              const sticker = stickers[d.id];
              return (
                <div
                  key={d.id}
                  ref={(el) => { cardRefs.current[d.id] = el; }}
                  className={cn(
                    "group relative flex flex-col rounded-xl border bg-background p-2.5 transition-all",
                    highlightedId === d.id
                      ? "border-amber-500 ring-2 ring-amber-500/60 shadow-lg shadow-amber-500/20"
                      : "border-border hover:border-amber-500/40"
                  )}
                >
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
                      meta.tag
                    )}
                  >
                    {meta.icon}
                    {meta.short}
                  </span>
                  <div className="mt-5 flex-1 truncate text-xs font-medium" title={name}>
                    {name}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(d.uploaded_at).toLocaleDateString()}
                  </div>
                  {sticker && sticker.bullets.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 rounded-md bg-amber-500/5 px-1.5 py-1 text-[10px] text-foreground/80">
                      {sticker.bullets.slice(0, 3).map((b, i) => (
                        <li key={i} className="flex gap-1">
                          <span className="text-amber-500">•</span>
                          <span className="line-clamp-1">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {onAsk && (
                    <button
                      type="button"
                      onClick={() => onAsk(d)}
                      className="mt-1.5 inline-flex items-center gap-1 self-start rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/15"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Ask Deason
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="mt-3 rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
              No documents match that filter.
            </div>
          )}
        </>
      )}
    </div>
  );
}

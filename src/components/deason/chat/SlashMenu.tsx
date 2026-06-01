import { Receipt, Zap, FileSignature, MapPin } from "lucide-react";

export interface SlashItem {
  cmd: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const ITEMS: SlashItem[] = [
  {
    cmd: "/bill",
    label: "Analyze my latest bill",
    prompt: "Walk through my most recent utility bill line-by-line and tell me the top 3 ways to save.",
    icon: <Receipt className="h-3.5 w-3.5" />,
  },
  {
    cmd: "/rate",
    label: "Optimize my rate plan",
    prompt: "Given my utility and load shape, what rate plan should I be on and why?",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  {
    cmd: "/contract",
    label: "Review my contract",
    prompt: "Review my installer contract / PPA / loan and flag anything risky, vague, or above market.",
    icon: <FileSignature className="h-3.5 w-3.5" />,
  },
  {
    cmd: "/texas",
    label: "Texas grid context",
    prompt: "Given my ESID and REP, what Texas-specific optimizations should I be making?",
    icon: <MapPin className="h-3.5 w-3.5" />,
  },
];

/** Filters slash items by the query (the input after `/`). */
export function filterSlashItems(query: string): SlashItem[] {
  const q = query.toLowerCase().replace(/^\//, "");
  if (!q) return ITEMS;
  return ITEMS.filter((i) => i.cmd.includes(q) || i.label.toLowerCase().includes(q)).slice(0, 4);
}

export function SlashMenu({
  items,
  activeIndex,
  onPick,
}: {
  items: SlashItem[];
  activeIndex: number;
  onPick: (item: SlashItem) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-xl border border-amber-500/40 bg-card shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="border-b border-border/60 bg-amber-500/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
        Quick prompts
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={it.cmd}>
            <button
              type="button"
              onClick={() => onPick(it)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === activeIndex ? "bg-amber-500/15" : "hover:bg-accent"
              }`}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                {it.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{it.label}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{it.cmd}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SlashMenu;

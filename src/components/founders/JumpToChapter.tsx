import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Compass,
  Rocket,
  Megaphone,
  Coins,
  Shield,
  Gem,
  Bitcoin,
  type LucideIcon,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

// Mirrors the SECTIONS array in FounderPack.tsx
const CHAPTERS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "evolution", label: "Evolution", icon: Compass },
  { id: "strategy", label: "Strategy", icon: Rocket },
  { id: "press", label: "Press Cascade", icon: Megaphone },
  { id: "tokenomics", label: "Tokenomics", icon: Coins },
  { id: "halving", label: "Halving", icon: Coins },
  { id: "moat", label: "Patent Moat", icon: Shield },
  { id: "growth", label: "Growth", icon: Rocket },
  { id: "salary", label: "Salary", icon: Coins },
  { id: "flywheel", label: "Flywheel", icon: Coins },
  { id: "networth", label: "Net Worth", icon: Gem },
  { id: "eclipse", label: "Eclipsing BTC", icon: Bitcoin },
  { id: "pact", label: "The Pact", icon: Shield },
];

export function JumpToChapter() {
  const [open, setOpen] = useState(false);
  const { lightTap } = useHaptics();

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          void lightTap();
          setOpen((o) => !o);
        }}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-card/70 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Jump to Chapter
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            · 12 chapters
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-1.5 p-3 pt-0 animate-fade-in">
          {CHAPTERS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                to={`/founder-pack#${c.id}`}
                onClick={() => void lightTap()}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-[12px] hover:border-primary/40 hover:bg-card transition-all active:scale-[0.98]"
              >
                <span className="text-[10px] tabular-nums text-muted-foreground/70 w-4">
                  {i + 1}
                </span>
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{c.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

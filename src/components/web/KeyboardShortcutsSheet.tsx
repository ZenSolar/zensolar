import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Pass B · #5 — Keyboard shortcuts cheat sheet.
 *
 * Press "?" anywhere outside an input to open. Standard web-app convention.
 * Lists every shortcut registered in the app so power users can learn them.
 */
export function KeyboardShortcutsSheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isEditable = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      return (el as HTMLElement).isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      // "?" is Shift+/ on US keyboards. e.key === "?" is reliable across layouts.
      if (e.key !== "?") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(document.activeElement)) return;
      e.preventDefault();
      setOpen(true);
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-shortcuts-sheet", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-shortcuts-sheet", onCustom);
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription>
            Move faster across the Clean Energy Center.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 text-sm">
          <Group title="Global">
            <Row keys={["⌘", "K"]} label="Quick jump to a page" />
            <Row keys={["/"]} label="Global search (pages, devices, mints, energy)" />
            <Row keys={["?"]} label="Show this cheat sheet" />
          </Group>

          <Group title="Dashboard actions">
            <Row keys={["M"]} label="Open mint sheet" />
            <Row keys={["R"]} label="Refresh energy sync" />
          </Group>

          <Group title="Go to (press g, then…)">
            <Row keys={["g", "d"]} label="Dashboard" />
            <Row keys={["g", "w"]} label="Wallet" />
            <Row keys={["g", "p"]} label="Profile" />
            <Row keys={["g", "s"]} label="Settings" />
            <Row keys={["g", "e"]} label="Energy log" />
            <Row keys={["g", "m"]} label="Mint history" />
            <Row keys={["g", "n"]} label="NFT collection" />
            <Row keys={["g", "r"]} label="Referrals" />
            <Row keys={["g", "l"]} label="Learn" />
          </Group>

          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
            Shortcuts are disabled while typing in inputs.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-foreground/85">{label}</span>
      <span className="flex items-center gap-1 shrink-0">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border/70 bg-muted/40 px-1.5 font-mono text-[11px] text-foreground/80"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}

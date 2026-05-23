import { useState } from "react";
import { Bookmark, BookmarkPlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useViewPresets, type ViewPreset } from "@/hooks/useViewPresets";
import { cn } from "@/lib/utils";

interface SavedViewsMenuProps<F extends Record<string, unknown>> {
  viewKey: string;
  /** The page's current filter state — saved when the user clicks "Save current view". */
  currentFilters: F;
  /** Called when the user picks a preset. */
  onApply: (filters: F) => void;
  className?: string;
}

/**
 * Pass D · #4 — saved-views dropdown.
 *
 * Pure presentational shell wired to `useViewPresets`. Lets users save the
 * current page filters under a name and pick from existing presets. RLS
 * scopes everything per user automatically.
 */
export function SavedViewsMenu<F extends Record<string, unknown>>({
  viewKey,
  currentFilters,
  onApply,
  className,
}: SavedViewsMenuProps<F>) {
  const { presets, isLoading, savePreset, deletePreset } = useViewPresets<F>(viewKey);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name your view first");
      return;
    }
    setSaving(true);
    try {
      await savePreset(trimmed, currentFilters);
      toast.success(`Saved "${trimmed}"`);
      setName("");
    } catch (err) {
      console.error(err);
      toast.error("Could not save view");
    } finally {
      setSaving(false);
    }
  };

  const handleApply = (preset: ViewPreset<F>) => {
    onApply(preset.filters);
    setOpen(false);
    toast.success(`Loaded "${preset.name}"`);
  };

  const handleDelete = async (e: React.MouseEvent, preset: ViewPreset<F>) => {
    e.stopPropagation();
    try {
      await deletePreset(preset.id);
      toast.success(`Deleted "${preset.name}"`);
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-1.5", className)}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Views</span>
          {presets.length > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {presets.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Saved views</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : presets.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            No saved views yet.
          </div>
        ) : (
          presets.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={(e) => {
                e.preventDefault();
                handleApply(p);
              }}
              className="flex items-center justify-between gap-2 group"
            >
              <span className="truncate">{p.name}</span>
              <button
                type="button"
                onClick={(e) => handleDelete(e, p)}
                aria-label={`Delete ${p.name}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 space-y-2">
          <p className="text-[11px] text-muted-foreground">Save current view</p>
          <div className="flex items-center gap-1.5">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Solar · This month"
              maxLength={60}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="h-8 px-2"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

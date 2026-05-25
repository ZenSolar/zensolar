import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { KNOWN_INSTALLERS, type KnownInstaller } from "@/data/solarInstallers";

interface InstallerSearchProps {
  /** Currently selected installer name (free-text or picked) */
  value: string;
  /** Called when the user picks a known installer — parent should pre-fill all matching fields */
  onPick: (installer: KnownInstaller) => void;
  /** Called when the user just types in the combobox without picking */
  onTextChange?: (text: string) => void;
}

/**
 * InstallerSearch — type-ahead combobox over KNOWN_INSTALLERS.
 *
 * Picking a row pre-fills Company / Phone / Email in the parent card, so the
 * customer doesn't have to hunt for their installer's contact info. Anything
 * not in the list can still be entered manually in the per-field inputs below.
 */
export function InstallerSearch({ value, onPick, onTextChange }: InstallerSearchProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 font-normal"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || "Search your installer…"}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type installer name…"
            onValueChange={onTextChange}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-3 px-3 text-xs text-muted-foreground text-left">
                Not in our list. Just type the name and contact info into the
                fields below.
              </div>
            </CommandEmpty>
            <CommandGroup heading="Common installers">
              {KNOWN_INSTALLERS.map((inst) => (
                <CommandItem
                  key={inst.name}
                  value={`${inst.name} ${inst.company}`}
                  onSelect={() => {
                    onPick(inst);
                    setOpen(false);
                  }}
                  className="flex items-start gap-2 py-2"
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      value === inst.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{inst.name}</p>
                    {inst.note && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {inst.note}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

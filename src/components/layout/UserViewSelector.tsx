import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Eye, UserPlus, Users as UsersIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useViewAsUser } from "@/contexts/ViewAsUserContext";
import {
  getNewUserViewMode,
  setNewUserViewMode,
} from "@/lib/userViewMode";

interface UserViewSelectorProps {
  collapsed?: boolean;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

/**
 * Admin-only dropdown that lets an admin view the dashboard / Clean Energy
 * Center as either:
 *   • Themselves (default)
 *   • A simulated "New User" (onboarding cards forced on)
 *   • Any registered user — read-only impersonation via ViewAsUserContext
 *
 * Replaces the previous binary New User View switch.
 */
export function UserViewSelector({ collapsed = false }: UserViewSelectorProps) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewUserView, setIsNewUserView] = useState(getNewUserViewMode());
  const {
    targetUserId,
    targetDisplayName,
    targetEmail,
    startViewingAs,
    stopViewingAs,
  } = useViewAsUser();

  // Stay in sync with New User View toggles fired elsewhere.
  useEffect(() => {
    const handler = (e: CustomEvent<boolean>) => setIsNewUserView(e.detail);
    window.addEventListener("newUserViewModeChange", handler as EventListener);
    return () =>
      window.removeEventListener("newUserViewModeChange", handler as EventListener);
  }, []);

  // Lazy-load the registered user list the first time the dropdown opens.
  useEffect(() => {
    if (!open || profiles.length > 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .order("display_name", { ascending: true, nullsFirst: false })
        .limit(500);
      if (!cancelled && !error && data) {
        setProfiles(data as ProfileRow[]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, profiles.length]);

  const selectSelf = () => {
    if (isNewUserView) {
      setNewUserViewMode(false);
      setIsNewUserView(false);
    }
    if (targetUserId) stopViewingAs();
    setOpen(false);
  };

  const selectNewUserView = () => {
    if (targetUserId) stopViewingAs();
    setNewUserViewMode(true);
    setIsNewUserView(true);
    setOpen(false);
  };

  const selectUser = (p: ProfileRow) => {
    if (isNewUserView) {
      setNewUserViewMode(false);
      setIsNewUserView(false);
    }
    startViewingAs(p.user_id, p.display_name, p.email);
    setOpen(false);
  };

  const activeLabel = targetUserId
    ? targetDisplayName || targetEmail || "Selected user"
    : isNewUserView
    ? "New User View"
    : "Viewing as self";

  const activeSub = targetUserId
    ? "Read-only impersonation"
    : isNewUserView
    ? "Onboarding cards forced"
    : "Default";

  const accent = targetUserId
    ? "text-amber-500"
    : isNewUserView
    ? "text-blue-500"
    : "text-muted-foreground";

  const trigger = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Switch view-as user"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            targetUserId
              ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
              : isNewUserView
              ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {targetUserId ? (
            <Eye className="h-4 w-4" />
          ) : isNewUserView ? (
            <UserPlus className="h-4 w-4" />
          ) : (
            <UsersIcon className="h-4 w-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs font-medium">{activeLabel}</p>
        <p className="text-[10px] text-muted-foreground">{activeSub}</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
        targetUserId
          ? "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15"
          : isNewUserView
          ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15"
          : "border-border bg-muted/50 hover:bg-muted",
      )}
      aria-label="Switch view-as user"
    >
      <div className="flex min-w-0 items-center gap-2">
        {targetUserId ? (
          <Eye className={cn("h-4 w-4 flex-shrink-0", accent)} />
        ) : isNewUserView ? (
          <UserPlus className={cn("h-4 w-4 flex-shrink-0", accent)} />
        ) : (
          <UsersIcon className={cn("h-4 w-4 flex-shrink-0", accent)} />
        )}
        <div className="min-w-0">
          <div className={cn("truncate text-xs font-medium", accent)}>
            {activeLabel}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            {activeSub}
          </div>
        </div>
      </div>
      <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0"
        side={collapsed ? "right" : "bottom"}
      >
        <Command>
          <CommandInput placeholder="Search users…" />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading users…" : "No users found."}
            </CommandEmpty>
            <CommandGroup heading="View mode">
              <CommandItem onSelect={selectSelf} value="__self__">
                <UsersIcon className="mr-2 h-4 w-4" />
                <span className="flex-1">Viewing as self</span>
                {!targetUserId && !isNewUserView && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </CommandItem>
              <CommandItem onSelect={selectNewUserView} value="__new_user__">
                <UserPlus className="mr-2 h-4 w-4 text-blue-500" />
                <span className="flex-1">New User View (onboarding)</span>
                {isNewUserView && <Check className="h-4 w-4 text-primary" />}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="View as registered user (read-only)">
              {profiles.map((p) => {
                const label = p.display_name || p.email || p.user_id.slice(0, 8);
                const sub = p.display_name && p.email ? p.email : null;
                const isSelected = targetUserId === p.user_id;
                return (
                  <CommandItem
                    key={p.user_id}
                    value={`${p.display_name ?? ""} ${p.email ?? ""} ${p.user_id}`}
                    onSelect={() => selectUser(p)}
                  >
                    <Eye className="mr-2 h-4 w-4 text-amber-500" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{label}</span>
                      {sub && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {sub}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

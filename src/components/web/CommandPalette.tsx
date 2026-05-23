import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Coins,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  User,
  Users,
  Wallet,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CommandPaletteProps {
  /**
   * Optional path prefix for the demo routes — pass "/demo" or
   * "/demo-leonardo" from the demo layout so jumps stay inside the demo
   * tree. Defaults to "" for the live PWA.
   */
  basePath?: string;
  /** Hide auth-only actions (sign out) on demo routes. */
  isDemo?: boolean;
}

/**
 * Phase 3 of the web-app upgrade — global command palette.
 *
 * Triggered by:
 *  • ⌘K / Ctrl+K (anywhere except inputs)
 *  • the "open-command-palette" CustomEvent (fired by SidebarStatus and
 *    anywhere else that wants a programmatic open)
 *
 * Inputs are detected by checking the active element. We do NOT open over
 * editable surfaces because users expect ⌘K behavior in text inputs to be
 * the browser default (no-op / select word).
 */
export function CommandPalette({ basePath = "", isDemo = false }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isEditable = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    };

    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isCmdK) return;
      if (isEditable(document.activeElement)) return;
      e.preventDefault();
      setOpen((o) => !o);
    };

    const onCustom = () => setOpen(true);

    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onCustom);
    };
  }, []);

  const go = (path: string) => () => {
    setOpen(false);
    navigate(`${basePath}${path}`);
  };

  const signOut = async () => {
    setOpen(false);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out");
      navigate("/demo", { replace: true });
    } catch (err) {
      toast.error("Sign out failed");
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to…  (try 'wallet', 'mint', 'profile')" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Jump to">
          <CommandItem onSelect={go("/")} value="dashboard home command center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/wallet")} value="wallet balance address">
            <Wallet className="mr-2 h-4 w-4" />
            <span>Wallet</span>
          </CommandItem>
          <CommandItem onSelect={go("/mint-history")} value="mints history past mint receipts">
            <History className="mr-2 h-4 w-4" />
            <span>Mint history</span>
          </CommandItem>
          <CommandItem onSelect={go("/nft-collection")} value="nft collection milestones badges">
            <Coins className="mr-2 h-4 w-4" />
            <span>NFT collection</span>
          </CommandItem>
          <CommandItem onSelect={go("/referrals")} value="referrals invite friends">
            <Users className="mr-2 h-4 w-4" />
            <span>Referrals</span>
          </CommandItem>
          <CommandItem onSelect={go("/store")} value="store shop merch swag">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Store</span>
          </CommandItem>
          <CommandItem onSelect={go("/learn")} value="learn academy education how it works">
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Learn</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={go("/profile")} value="profile account me">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={go("/notifications")} value="notifications alerts inbox">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
          <CommandItem onSelect={go("/settings")} value="settings preferences theme">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          {!isDemo && (
            <CommandItem onSelect={signOut} value="sign out log out logout">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

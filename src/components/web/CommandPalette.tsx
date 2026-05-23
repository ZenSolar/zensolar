import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAccount } from "wagmi";
import {
  Bell,
  BookOpen,
  Coins,
  Copy,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
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
 * Pass C: added Actions group (mint, refresh, copy wallet, theme toggle).
 */
export function CommandPalette({ basePath = "", isDemo = false }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { address } = useAccount();

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

  // ───── Actions ─────────────────────────────────────────────────────────
  const mintNow = () => {
    setOpen(false);
    navigate(`${basePath}/`);
    // Give the dashboard a moment to mount, then scroll to the mint area.
    window.setTimeout(() => {
      const target =
        document.getElementById("mint") ||
        document.querySelector("[data-mint-button]") ||
        document.querySelector("[data-energy-command-center]");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const refreshDevices = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("zen:refresh-dashboard"));
    toast.success("Refreshing devices…", { duration: 1800 });
  };

  const copyWallet = async () => {
    setOpen(false);
    if (!address) {
      toast.error("No wallet connected");
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Wallet address copied", {
        description: `${address.slice(0, 6)}…${address.slice(-4)}`,
      });
    } catch {
      toast.error("Couldn't copy address");
    }
  };

  const toggleTheme = () => {
    setOpen(false);
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    toast.success(`Switched to ${next} mode`, { duration: 1500 });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to or run an action…  (try 'mint', 'wallet', 'theme')" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={mintNow} value="mint now tap energy claim tokens">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>Mint now</span>
            <CommandShortcut>M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={refreshDevices} value="refresh devices reload sync data">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Refresh devices</span>
            <CommandShortcut>R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={copyWallet} value="copy wallet address clipboard">
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy wallet address</span>
          </CommandItem>
          <CommandItem onSelect={toggleTheme} value="toggle theme dark light mode appearance">
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle theme</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

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

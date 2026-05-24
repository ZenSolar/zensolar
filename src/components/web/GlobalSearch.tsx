import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Coins,
  Cpu,
  History,
  Loader2,
  Search,
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
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Pass B · #4 — Global search.
 *
 * Searches across:
 *   • Pages (static list, instant)
 *   • Your connected devices (name / provider / type)
 *   • Your recent mints (last 25 by created_at desc)
 *   • Your recent energy log entries (last 25 by recorded_at desc)
 *
 * Distinct from `⌘K` (CommandPalette), which is jump-only. This dialog
 * fetches per-user data lazily on first open, then debounces query input.
 *
 * Triggered by:
 *   • "/" key (anywhere except inputs)
 *   • "open-global-search" CustomEvent (fired by the TopNav search button)
 */

type DeviceHit = { id: string; device_name: string | null; device_type: string | null; provider: string | null };
type MintHit = { id: string; tokens_minted: number | null; created_at: string };
type EnergyHit = { id: string; production_wh: number | null; data_type: string | null; recorded_at: string };

interface State {
  loaded: boolean;
  loading: boolean;
  devices: DeviceHit[];
  mints: MintHit[];
  energy: EnergyHit[];
}

const PAGES: Array<{ label: string; path: string; keywords: string; icon: typeof Wallet }> = [
  { label: "Dashboard",       path: "/",                keywords: "home command center",          icon: BarChart3 },
  { label: "Wallet",          path: "/wallet",          keywords: "balance address tokens",       icon: Wallet },
  { label: "Mint history",    path: "/mint-history",    keywords: "mints past receipts",          icon: History },
  { label: "NFT collection",  path: "/nft-collection",  keywords: "nfts milestones badges",       icon: Coins },
  { label: "Energy log",      path: "/energy-log",      keywords: "kwh production charging",      icon: BarChart3 },
  { label: "Profile",         path: "/profile",         keywords: "account me settings",          icon: Search },
  { label: "Settings",        path: "/settings",        keywords: "preferences theme density",    icon: Search },
  { label: "Referrals",       path: "/referrals",       keywords: "invite friends",               icon: Search },
  { label: "Store",           path: "/store",           keywords: "shop merch swag",              icon: Search },
  { label: "Learn",           path: "/learn",           keywords: "academy education how it works", icon: Search },
  { label: "Proof-of-Genesis", path: "/proof-of-genesis", keywords: "verify clean energy",        icon: Cpu },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ loaded: false, loading: false, devices: [], mints: [], energy: [] });
  const { user } = useAuth();
  const navigate = useNavigate();

  // Open via "/" key (skip when typing) and via CustomEvent from TopNav.
  useEffect(() => {
    const isEditable = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      return (el as HTMLElement).isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isSlash && !isCmdK) return;
      if (isSlash && isEditable(document.activeElement)) return;
      e.preventDefault();
      setOpen(true);
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-global-search", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-global-search", onCustom);
    };
  }, []);

  // Lazy-load per-user data on first open.
  useEffect(() => {
    if (!open || state.loaded || state.loading || !user) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      const [devicesRes, mintsRes, energyRes] = await Promise.all([
        supabase.from("connected_devices").select("id, device_name, device_type, provider").eq("user_id", user.id).limit(50),
        supabase.from("mint_transactions").select("id, tokens_minted, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(25),
        supabase.from("energy_production").select("id, production_wh, data_type, recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(25),
      ]);
      if (cancelled) return;
      setState({
        loaded: true,
        loading: false,
        devices: (devicesRes.data ?? []) as DeviceHit[],
        mints: (mintsRes.data ?? []) as MintHit[],
        energy: (energyRes.data ?? []) as EnergyHit[],
      });
    })();
    return () => { cancelled = true; };
  }, [open, state.loaded, state.loading, user]);

  const go = (path: string) => () => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, devices, mints, energy…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem key={p.path} value={`${p.label} ${p.keywords}`} onSelect={go(p.path)}>
              <p.icon className="mr-2 h-4 w-4" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {state.loading && (
          <CommandGroup>
            <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading your data…
            </div>
          </CommandGroup>
        )}

        {state.devices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your devices">
              {state.devices.map((d) => (
                <CommandItem
                  key={d.id}
                  value={`device ${d.device_name ?? ""} ${d.device_type ?? ""} ${d.provider ?? ""}`}
                  onSelect={go("/profile")}
                >
                  <Cpu className="mr-2 h-4 w-4" />
                  <span className="truncate">{d.device_name || d.device_type || "Device"}</span>
                  {d.provider && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {d.provider}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {state.mints.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent mints">
              {state.mints.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`mint ${m.tokens_minted ?? ""} ${m.created_at}`}
                  onSelect={go("/mint-history")}
                >
                  <Coins className="mr-2 h-4 w-4" />
                  <span>{(m.tokens_minted ?? 0).toLocaleString()} $ZSOLAR</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {state.energy.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent energy">
              {state.energy.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`energy ${e.data_type ?? ""} ${e.production_wh ?? ""} ${e.recorded_at}`}
                  onSelect={go("/energy-log")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>
                    {((e.production_wh ?? 0) / 1000).toFixed(2)} kWh
                    {e.data_type ? ` · ${e.data_type}` : ""}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(e.recorded_at).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

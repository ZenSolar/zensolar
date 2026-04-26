import { Check, Palette, Sparkles, Eye, RefreshCw, RotateCcw } from "lucide-react";
import { useAppTheme } from "@/contexts/AppThemeContext";
import { APP_THEMES, type AppTheme } from "@/lib/appThemes";
import { isPreviewMode } from "@/lib/previewMode";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppThemeSelectorProps {
  /** When true, render only inside preview hosts. Defaults true. */
  previewOnly?: boolean;
}

/**
 * Sidebar-mounted theme selector. Shown inside preview hosts only.
 * Lets the operator switch the entire app between curated themes and
 * choose whether the selection persists across reloads (preview-only)
 * or resets every session.
 */
export function AppThemeSelector({ previewOnly = true }: AppThemeSelectorProps) {
  const { theme, setTheme, persistenceMode, setPersistenceMode } = useAppTheme();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (previewOnly && !isPreviewMode()) return null;

  const current = APP_THEMES.find((t) => t.id === theme) ?? APP_THEMES[0];
  const isCustomTheme = theme !== "default";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={`Theme: ${current.name} · ${
                persistenceMode === "preview" ? "Persisted" : "Session only"
              }`}
              className="hover:bg-sidebar-accent/50 group"
            >
              <Palette className="h-4 w-4" />
              <span className="flex-1 truncate text-left">
                {collapsed ? "" : `Theme · ${current.name}`}
              </span>
              {!collapsed && isCustomTheme && (
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            className="w-80"
          >
            <DropdownMenuLabel className="flex items-center justify-between gap-2 pb-2">
              <span className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5" />
                <span>App Theme</span>
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-normal h-5 px-1.5 border-primary/40 text-primary"
              >
                <Eye className="h-2.5 w-2.5 mr-1" />
                Preview only
              </Badge>
            </DropdownMenuLabel>
            <p className="px-2 pb-2 text-[11px] text-muted-foreground leading-snug">
              Restyles every page in real time. Production always loads the
              default ZenSolar theme.
            </p>
            <div className="mx-2 mb-2 px-2.5 py-2 rounded-md border border-border/60 bg-muted/40 flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
                  Active
                </span>
                <span className="text-xs font-semibold text-foreground truncate">
                  {current.name}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    · {persistenceMode === "preview" ? "Saved" : "Session only"}
                  </span>
                </span>
              </div>
              {isCustomTheme && (
                <button
                  type="button"
                  onClick={() => setTheme("default")}
                  className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded border border-border/60 hover:border-border transition-colors"
                  title="Reset to ZenSolar default"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as AppTheme)}
            >
              {APP_THEMES.map((t) => {
                const isActive = t.id === theme;
                const isDefault = t.id === "default";
                return (
                  <DropdownMenuRadioItem
                    key={t.id}
                    value={t.id}
                    className="flex flex-col items-start gap-0.5 py-2.5 pr-2"
                  >
                    <span className="flex items-center gap-2 font-medium text-sm">
                      {t.name}
                      {isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-4 px-1 font-normal"
                        >
                          DEFAULT
                        </Badge>
                      )}
                      {isActive && !isDefault && (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1 font-normal border-primary/50 text-primary"
                        >
                          ACTIVE
                        </Badge>
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      <span className="text-foreground/70">{t.tagline}</span>
                      {" — "}
                      {t.description}
                    </span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <RefreshCw className="h-2.5 w-2.5" />
              Persistence
              <span className="ml-auto normal-case tracking-normal font-normal text-[10px] text-muted-foreground/70">
                {persistenceMode === "preview" ? "Saved" : "Resets on reload"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setPersistenceMode("preview");
              }}
              className="flex items-start gap-2 py-2"
            >
              <Check
                className={`h-4 w-4 mt-0.5 shrink-0 ${
                  persistenceMode === "preview" ? "text-primary" : "opacity-0"
                }`}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  Persist in preview
                  {persistenceMode === "preview" && (
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1 font-normal border-primary/50 text-primary"
                    >
                      ACTIVE
                    </Badge>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">
                  Theme survives reloads on lovable.app & localhost. Always
                  resets on production domains.
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setPersistenceMode("session");
              }}
              className="flex items-start gap-2 py-2"
            >
              <Check
                className={`h-4 w-4 mt-0.5 shrink-0 ${
                  persistenceMode === "session" ? "text-primary" : "opacity-0"
                }`}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  Session only
                  {persistenceMode === "session" && (
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1 font-normal border-primary/50 text-primary"
                    >
                      ACTIVE
                    </Badge>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">
                  Resets to ZenSolar default on every full page reload — even
                  inside preview.
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

import { Check, Palette, Sparkles } from "lucide-react";
import { useAppTheme } from "@/contexts/AppThemeContext";
import { APP_THEMES, type AppTheme } from "@/lib/appThemes";
import { isPreviewMode } from "@/lib/previewMode";
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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={`Theme: ${current.name}`}
              className="hover:bg-sidebar-accent/50"
            >
              <Palette className="h-4 w-4" />
              <span className="flex-1 truncate text-left">
                {collapsed ? "" : `Theme · ${current.name}`}
              </span>
              {!collapsed && theme !== "default" && (
                <Sparkles className="h-3 w-3 text-primary" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            className="w-72"
          >
            <DropdownMenuLabel className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5" />
              App Theme · Preview only
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as AppTheme)}
            >
              {APP_THEMES.map((t) => (
                <DropdownMenuRadioItem
                  key={t.id}
                  value={t.id}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="font-medium text-sm">{t.name}</span>
                  <span className="text-[11px] text-muted-foreground leading-snug pl-0">
                    {t.tagline} — {t.description}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Persistence
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setPersistenceMode("preview");
              }}
              className="flex items-start gap-2"
            >
              <Check
                className={`h-4 w-4 mt-0.5 ${
                  persistenceMode === "preview" ? "opacity-100" : "opacity-0"
                }`}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Persist in preview</span>
                <span className="text-[11px] text-muted-foreground">
                  Survives reloads on lovable.app / localhost. Always resets on production.
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setPersistenceMode("session");
              }}
              className="flex items-start gap-2"
            >
              <Check
                className={`h-4 w-4 mt-0.5 ${
                  persistenceMode === "session" ? "opacity-100" : "opacity-0"
                }`}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Session only</span>
                <span className="text-[11px] text-muted-foreground">
                  Resets to default on every full page reload.
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

import { 
  LayoutDashboard, 
  Coins, 
  History,
  Settings, 
  User, 
  HelpCircle,
  MessageSquarePlus,
  Bell,
  Users,
  ShoppingBag,
  BookOpen,
  Cpu,
  Award,
  Play,
  BarChart3,
  FileText,
  Wallet,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import zenFavicon from "@/assets/zen-favicon.png";
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Dashboard", url: "/demo", icon: LayoutDashboard },
  { title: "Energy Log", url: "/demo/energy-log", icon: BarChart3 },
  { title: "NFT Collection", url: "/demo/nft-collection", icon: Award },
  { title: "$ZSOLAR Store", url: "/demo/store", icon: ShoppingBag },
  { title: "How It Works", url: "/demo/how-it-works", icon: BookOpen },
  { title: "White Paper", url: "/demo/white-paper", icon: FileText },
  { title: "Patent Technology", url: "/demo/technology", icon: Cpu },
  { title: "Tokenomics", url: "/demo/tokenomics", icon: Coins },
  { title: "Mint History", url: "/demo/mint-history", icon: History },
  { title: "Referrals", url: "/demo/referrals", icon: Users },
  { title: "Notifications", url: "/demo/notifications", icon: Bell },
];

const secondaryNavItems = [
  { title: "Profile", url: "/demo/profile", icon: User },
  { title: "Wallet", url: "/demo/wallet", icon: Wallet },
  { title: "Settings", url: "/demo/settings", icon: Settings },
  { title: "About", url: "/demo/about", icon: HelpCircle },
  { title: "Help", url: "/demo/help", icon: MessageSquarePlus },
  { title: "Feedback", url: "/demo/feedback", icon: MessageSquarePlus },
];

export function DemoSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { theme, setTheme } = useTheme();

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo/Brand - matches AppSidebar */}
        <div className="p-3 flex items-center gap-3">
          <img 
            src={collapsed ? zenFavicon : zenLogo} 
            alt="ZenSolar" 
            className={`${collapsed ? 'h-8 w-8' : 'h-8 w-auto'} object-contain flex-shrink-0 dark:animate-logo-glow`}
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-sidebar-foreground/60 leading-tight">One-Tap, Mint-on-Proof Clean Energy Platform</span>
            </div>
          )}
        </div>

        {/* Demo Mode Badge */}
        <div className="px-3 pb-2">
          <Badge variant="secondary" className="w-full justify-center gap-1.5 py-1.5 bg-primary/10 text-primary border-primary/20">
            <Play className="h-3 w-3" />
            Demo Mode
          </Badge>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/demo"}
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `${isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"} ${item.url === "/demo/store" ? "text-secondary font-semibold rounded-lg animate-sidebar-glow" : ""}`
                      }
                    >
                      <item.icon className={`h-4 w-4 ${item.url === "/demo/store" ? "animate-icon-glow text-secondary" : ""}`} />
                      <span className={item.url === "/demo/store" ? "animate-text-glow" : ""}>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - mirrors AppSidebar structure with demo user */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className={`flex items-center gap-3 p-2 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              D
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Demo User</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">demo@zen.solar</p>
            </div>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              tooltip={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              className="hover:bg-sidebar-accent/50"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip="Create Account"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <NavLink to="/auth" onClick={handleNavClick}>
                <User className="h-4 w-4" />
                <span>Create Account</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

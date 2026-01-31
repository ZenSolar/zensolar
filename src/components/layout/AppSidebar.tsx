import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Coins, 
  History,
  Settings, 
  User, 
  HelpCircle,
  LogOut,
  Shield,
  MessageSquarePlus,
  Bell,
  Users,
  ShoppingBag,
  Car,
  BookOpen,
  TrendingUp,
  Cpu,
  Award,
  Target,
  BarChart3,
  DollarSign,
  FileText,
  Crown,
  Flame,
  ChevronDown,
  ChevronRight,
  FileCode,
  Briefcase,
  Rocket,
  Wallet,
  ClipboardList
} from "lucide-react";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import zenFavicon from "@/assets/zen-favicon.png";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveBetaIndicator } from "./LiveBetaIndicator";
import { LiveBetaToggle } from "./LiveBetaToggle";
import { UserViewToggle } from "./UserViewToggle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "NFT Collection", url: "/nft-collection", icon: Award },
  { title: "$ZSOLAR Store", url: "/store", icon: ShoppingBag },
  { title: "How It Works", url: "/how-it-works", icon: BookOpen },
  { title: "White Paper", url: "/white-paper", icon: FileText },
  { title: "Patent Technology", url: "/technology", icon: Cpu },
  { title: "Tokenomics", url: "/tokenomics", icon: Coins },
  { title: "Mint History", url: "/mint-history", icon: History },
  { title: "Referrals", url: "/referrals", icon: Users },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const secondaryNavItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About", url: "/about", icon: HelpCircle },
  { title: "Help", url: "/help", icon: MessageSquarePlus },
  { title: "Feedback", url: "/feedback", icon: MessageSquarePlus },
];

// Consolidated admin menu structure
const adminMenuGroups = {
  core: [
    { title: "Admin Panel", url: "/admin", icon: Shield },
    { title: "To-Do List", url: "/admin/todo", icon: ClipboardList, highlight: true },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Users", url: "/admin/users", icon: Users },
  ],
  economics: [
    { title: "Live Beta Economics", url: "/admin/live-beta-economics", icon: Flame, highlight: true },
    { title: "FINAL $ZSOLAR", url: "/admin/final-tokenomics", icon: Crown, highlight: true },
    { title: "Revenue Flywheel", url: "/admin/revenue-flywheel", icon: TrendingUp },
    { title: "Flywheel Tracker", url: "/admin/flywheel-tracker", icon: Target },
    { title: "Token Estimator", url: "/admin/token-estimator", icon: Coins },
    { title: "10B Tokenomics", url: "/admin/tokenomics-10b", icon: Coins },
    { title: "Tokenomics Framework", url: "/admin/tokenomics-framework", icon: Coins },
  ],
  investor: [
    { title: "YC Application", url: "/admin/yc-application", icon: Rocket, highlight: true },
    { title: "Investment Thesis", url: "/admin/investment-thesis", icon: Briefcase },
    { title: "Investor One-Pager", url: "/admin/investor-one-pager", icon: FileText },
    { title: "Fundraising", url: "/admin/fundraising", icon: DollarSign },
    { title: "Growth Projections", url: "/admin/growth-projections", icon: TrendingUp },
  ],
  technical: [
    { title: "Beta Deployment", url: "/admin/beta-deployment", icon: Rocket, highlight: true },
    { title: "Wallet Providers", url: "/admin/wallet-providers", icon: Wallet, highlight: true },
    { title: "Embedded Wallet Demo", url: "/admin/embedded-wallet-demo", icon: Wallet, highlight: true },
    { title: "Security Architecture", url: "/admin/security", icon: Shield },
    { title: "Smart Contracts", url: "/admin/contracts", icon: FileCode },
    { title: "EV API Reference", url: "/admin/ev-api-reference", icon: Car },
    { title: "Competitive Intel", url: "/admin/competitive-intel", icon: Shield },
    { title: "Patent Mapping", url: "/admin/patent-mapping", icon: FileText },
    { title: "AI Feedback Loop", url: "/admin/ai-feedback-loop", icon: Cpu },
    { title: "Glossary", url: "/admin/glossary", icon: BookOpen },
  ],
};

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdminCheck();
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        
        // Fetch profile for avatar and display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setDisplayName(profile.display_name);
        }
      }
    };
    
    fetchUserInfo();
  }, []);

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const handleLogout = async () => {
    setOpenMobile(false);
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo/Brand - optimized sizing */}
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

        {/* Live Beta Toggle + User View Toggle - visible to admins only */}
        {isAdmin && (
          <div className="px-3 pb-2 space-y-2">
            <LiveBetaToggle collapsed={collapsed} />
            <UserViewToggle collapsed={collapsed} />
          </div>
        )}

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
                      end={item.url === "/"}
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        `${isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"} ${item.url === "/store" ? "text-secondary font-semibold rounded-lg animate-sidebar-glow" : ""}`
                      }
                    >
                      <item.icon className={`h-4 w-4 ${item.url === "/store" ? "animate-icon-glow text-secondary" : ""}`} />
                      <span className={item.url === "/store" ? "animate-text-glow" : ""}>{item.title}</span>
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

        {/* Admin Navigation - Only visible to admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Core Admin */}
                {adminMenuGroups.core.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url}
                        end={item.url === "/admin"}
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

                {/* Economics Submenu */}
                <Collapsible defaultOpen={location.pathname.includes('economics') || location.pathname.includes('flywheel') || location.pathname.includes('tokenomics') || location.pathname.includes('token-estimator')}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent/50">
                      <Coins className="h-4 w-4" />
                      {!collapsed && <span>Economics</span>}
                      {!collapsed && <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />}
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    {adminMenuGroups.economics.map((item) => (
                      <SidebarMenuItem key={item.title} className="pl-4">
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink 
                            to={item.url}
                            onClick={handleNavClick}
                            className={({ isActive }) => 
                              isActive 
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                : `hover:bg-sidebar-accent/50 ${item.highlight ? 'text-solar font-semibold' : ''}`
                            }
                          >
                            <item.icon className={`h-4 w-4 ${item.highlight ? 'text-solar' : ''}`} />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Investor Submenu */}
                <Collapsible defaultOpen={location.pathname.includes('investor') || location.pathname.includes('fundraising') || location.pathname.includes('investment') || location.pathname.includes('growth') || location.pathname.includes('yc-application')}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent/50">
                      <Briefcase className="h-4 w-4" />
                      {!collapsed && <span>Investor</span>}
                      {!collapsed && <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />}
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    {adminMenuGroups.investor.map((item) => (
                      <SidebarMenuItem key={item.title} className="pl-4">
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink 
                            to={item.url}
                            onClick={handleNavClick}
                            className={({ isActive }) => 
                              isActive 
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                : `hover:bg-sidebar-accent/50 ${item.highlight ? 'text-solar font-semibold' : ''}`
                            }
                          >
                            <item.icon className={`h-4 w-4 ${item.highlight ? 'text-solar' : ''}`} />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Technical Submenu */}
                <Collapsible defaultOpen={location.pathname.includes('security') || location.pathname.includes('contracts') || location.pathname.includes('ev-api') || location.pathname.includes('patent') || location.pathname.includes('ai-feedback') || location.pathname.includes('glossary') || location.pathname.includes('beta-deployment')}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent/50">
                      <FileCode className="h-4 w-4" />
                      {!collapsed && <span>Technical</span>}
                      {!collapsed && <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />}
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    {adminMenuGroups.technical.map((item) => (
                      <SidebarMenuItem key={item.title} className="pl-4">
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink 
                            to={item.url}
                            onClick={handleNavClick}
                            className={({ isActive }) => 
                              isActive 
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                                : `hover:bg-sidebar-accent/50 ${item.highlight ? 'text-solar font-semibold' : ''}`
                            }
                          >
                            <item.icon className={`h-4 w-4 ${item.highlight ? 'text-solar' : ''}`} />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with user info and logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className={`flex items-center gap-3 p-2 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? userEmail ?? 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              {displayName && (
                <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              )}
              <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
            </div>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Sign Out"
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

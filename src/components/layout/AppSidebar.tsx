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
  Scale,
  DollarSign,
  Calculator,
  PieChart,
  FileText,
  Sparkles,
  Crown,
  BookMarked,
  LineChart
} from "lucide-react";
import zenLogo from "@/assets/zen-logo-stacked.png";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About", url: "/about", icon: HelpCircle },
  { title: "Help", url: "/help", icon: MessageSquarePlus },
  { title: "Feedback", url: "/feedback", icon: MessageSquarePlus },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
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
        {/* Logo/Brand */}
        <div className="p-4 flex items-center gap-3">
          <img src={zenLogo} alt="ZenSolar" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-sidebar-foreground">ZenSolar</span>
              <span className="text-xs text-sidebar-foreground/60">Earn blockchain rewards from clean energy use</span>
            </div>
          )}
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
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Panel">
                    <NavLink 
                      to="/admin"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Analytics">
                    <NavLink 
                      to="/admin/analytics"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="EV API Reference">
                    <NavLink 
                      to="/admin/ev-api-reference"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Car className="h-4 w-4" />
                      <span>EV API Reference</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Revenue Flywheel">
                    <NavLink 
                      to="/admin/revenue-flywheel"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Revenue Flywheel</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Flywheel Tracker">
                    <NavLink 
                      to="/admin/flywheel-tracker"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Target className="h-4 w-4" />
                      <span>Flywheel Tracker</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Investment Thesis">
                    <NavLink 
                      to="/admin/investment-thesis"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Target className="h-4 w-4" />
                      <span>Investment Thesis</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Patent Mapping">
                    <NavLink 
                      to="/admin/patent-mapping"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Scale className="h-4 w-4" />
                      <span>Patent Mapping</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Fundraising">
                    <NavLink 
                      to="/admin/fundraising"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Fundraising</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Token Estimator">
                    <NavLink 
                      to="/admin/token-estimator"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Calculator className="h-4 w-4" />
                      <span>Token Estimator</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="10B Tokenomics">
                    <NavLink 
                      to="/admin/tokenomics-10b"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <PieChart className="h-4 w-4" />
                      <span>10B Tokenomics</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Investor One-Pager">
                    <NavLink 
                      to="/admin/investor-one-pager"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <FileText className="h-4 w-4" />
                      <span>Investor One-Pager</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Tokenomics Framework">
                    <NavLink 
                      to="/admin/tokenomics-framework"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Tokenomics Framework</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="AI Feedback Loop">
                    <NavLink 
                      to="/admin/ai-feedback-loop"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Cpu className="h-4 w-4" />
                      <span>AI Feedback Loop</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Final Tokenomics">
                    <NavLink 
                      to="/admin/final-tokenomics"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50 text-primary"
                      }
                    >
                      <Crown className="h-4 w-4" />
                      <span className="font-semibold">FINAL $ZSOLAR</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Growth Projections">
                    <NavLink 
                      to="/admin/growth-projections"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <LineChart className="h-4 w-4" />
                      <span>Growth Projections</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Glossary">
                    <NavLink 
                      to="/admin/glossary"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <BookMarked className="h-4 w-4" />
                      <span>Glossary</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Registered Users">
                    <NavLink 
                      to="/admin/users"
                      onClick={handleNavClick}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <Users className="h-4 w-4" />
                      <span>Registered Users</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

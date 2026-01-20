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
  Cpu,
  Award,
  BarChart3
} from "lucide-react";
import zenLogo from "@/assets/zen-sidebar-icon.png";
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
  { title: "Technology", url: "/technology", icon: Cpu },
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

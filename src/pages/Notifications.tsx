import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Users, Zap, Info, Trash2, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  status: string;
  sent_at: string;
  data: Record<string, unknown> | null;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  referral: { icon: Users, color: "bg-purple-500/10 text-purple-500", label: "Referral" },
  milestone: { icon: Zap, color: "bg-amber-500/10 text-amber-500", label: "Milestone" },
  system: { icon: Info, color: "bg-blue-500/10 text-blue-500", label: "System" },
  default: { icon: Bell, color: "bg-muted text-muted-foreground", label: "General" },
};

export default function Notifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data as NotificationLog[];
    },
    enabled: !!user?.id,
  });

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.notification_type === activeTab;
  });

  const handleClearAll = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("notification_logs")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to clear notifications");
    } else {
      toast.success("All notifications cleared");
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("notification_logs")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete notification");
    } else {
      refetch();
    }
  };

  const getCategory = (type: string) => {
    return categoryConfig[type] || categoryConfig.default;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground">View all your past notifications</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="referral">Referrals</TabsTrigger>
          <TabsTrigger value="milestone">Milestones</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
                <p className="text-muted-foreground max-w-md">
                  You'll receive notifications for referral rewards, energy milestones, and system updates here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const category = getCategory(notification.notification_type);
                const Icon = category.icon;
                
                return (
                  <Card key={notification.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${category.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{notification.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {category.label}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCheck className="h-3 w-3" />
                            {format(new Date(notification.sent_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

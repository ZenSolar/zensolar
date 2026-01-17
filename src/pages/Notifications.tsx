import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users, Zap, Info, Trash2, CheckCheck, Sparkles, Inbox } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  referral: { icon: Users, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Referral" },
  milestone: { icon: Zap, color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Milestone" },
  system: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "System" },
  default: { icon: Bell, color: "text-muted-foreground", bgColor: "bg-muted", label: "General" },
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

  const unreadCount = notifications.length;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Bell className="h-6 w-6 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Stay updated on your activity</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="all" className="gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="milestone" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Milestones</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                    <div className="relative p-5 rounded-full bg-gradient-to-br from-muted to-muted/50">
                      <Bell className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    You'll receive notifications for referral rewards, energy milestones, and system updates here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredNotifications.map((notification, index) => {
                    const category = getCategory(notification.notification_type);
                    const Icon = category.icon;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="group hover:shadow-lg hover:border-primary/30 transition-all overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex items-start gap-4 p-5">
                              <div className={`p-3 rounded-xl ${category.bgColor} shrink-0`}>
                                <Icon className={`h-5 w-5 ${category.color}`} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold">{notification.title}</h3>
                                  <Badge variant="outline" className={`text-xs ${category.color} border-current/30`}>
                                    {category.label}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                  {notification.body}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  <span>{formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}</span>
                                  <span className="opacity-50">•</span>
                                  <span className="opacity-75">{format(new Date(notification.sent_at), "MMM d, h:mm a")}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={() => handleDelete(notification.id)}
                                aria-label="Delete notification"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
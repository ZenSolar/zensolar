import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  url: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch active announcements not dismissed by this user
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all active announcements
      const { data: all, error: annError } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (annError || !all) return [];

      // Get user's dismissals
      const { data: dismissals } = await supabase
        .from("announcement_dismissals")
        .select("announcement_id")
        .eq("user_id", user.id);

      const dismissedIds = new Set((dismissals ?? []).map((d: any) => d.announcement_id));

      return all.filter((a: any) => !dismissedIds.has(a.id)) as Announcement[];
    },
    enabled: !!user?.id,
    refetchInterval: 60_000, // Poll every minute
  });

  // Also get personal notification count
  const { data: personalCount = 0 } = useQuery({
    queryKey: ["notification-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const totalCount = announcements.length + personalCount;

  const dismissMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user?.id) return;
      await supabase.from("announcement_dismissals").insert({
        user_id: user.id,
        announcement_id: announcementId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAnnouncementClick = (a: Announcement) => {
    if (a.url) {
      navigate(a.url);
    } else {
      navigate("/notifications");
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl z-50"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Notifications</span>
              <button
                onClick={() => { navigate("/notifications"); setOpen(false); }}
                className="text-xs text-primary hover:underline"
              >
                View all
              </button>
            </div>

            {announcements.length === 0 && personalCount === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 hover:bg-accent/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0" onClick={() => handleAnnouncementClick(a)}>
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.body}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); dismissMutation.mutate(a.id); }}
                        className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}

                {personalCount > 0 && (
                  <div
                    className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => { navigate("/notifications"); setOpen(false); }}
                  >
                    <p className="text-sm text-muted-foreground">
                      + {personalCount} personal notification{personalCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

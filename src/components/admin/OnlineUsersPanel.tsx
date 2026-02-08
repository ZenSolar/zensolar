import { usePresence, PresenceUser } from "@/hooks/usePresence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function OnlineUsersPanel() {
  const { onlineUsers, count } = usePresence();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Online Users
          <Badge variant="outline" className="ml-auto text-xs gap-1.5">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            {count} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">No users currently online.</p>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.display_name || u.user_id.slice(0, 8) + "..."}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Online {formatDistanceToNow(new Date(u.online_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

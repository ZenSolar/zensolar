import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PresenceUser {
  user_id: string;
  display_name: string | null;
  online_at: string;
}

const CHANNEL_NAME = 'online-users';

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        const seen = new Set<string>();

        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (!seen.has(p.user_id)) {
              seen.add(p.user_id);
              users.push(p);
            }
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Fetch display name for this user
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .single();

          await channel.track({
            user_id: user.id,
            display_name: profile?.display_name ?? null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { onlineUsers, count: onlineUsers.length };
}

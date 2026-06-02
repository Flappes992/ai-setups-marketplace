import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

const KEY = 'setiq.notifications.lastSeenAt';

interface UnreadResult {
  count: number;
  refresh: () => Promise<void>;
  markSeen: () => Promise<void>;
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function useUnreadNotifications(): UnreadResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!myId) {
      setCount(0);
      return;
    }
    const lastSeenRaw = await AsyncStorage.getItem(KEY);
    const since = lastSeenRaw ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: mySetups } = await supabase.from('setups').select('id').eq('creator_id', myId);
    const setupIds = ((mySetups as { id: string }[] | null) ?? []).map((s) => s.id);

    const queries = [];

    if (setupIds.length > 0) {
      queries.push(
        Promise.resolve(
          supabase
            .from('likes')
            .select('user_id', { count: 'exact', head: true })
            .in('setup_id', setupIds)
            .gte('created_at', since)
            .neq('user_id', myId),
        ),
        Promise.resolve(
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .in('setup_id', setupIds)
            .gte('created_at', since)
            .neq('user_id', myId),
        ),
        Promise.resolve(
          supabase
            .from('purchases')
            .select('id', { count: 'exact', head: true })
            .in('setup_id', setupIds)
            .gte('created_at', since)
            .eq('status', 'completed'),
        ),
      );
    }

    queries.push(
      Promise.resolve(
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', myId)
          .gte('created_at', since),
      ),
    );

    const results = await Promise.all(queries);
    const total = results.reduce((sum, r) => sum + (r.count ?? 0), 0);
    setCount(total);
  }, [myId]);

  useEffect(() => {
    refresh();
    const l = () => refresh();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [refresh]);

  const markSeen = useCallback(async () => {
    await AsyncStorage.setItem(KEY, new Date().toISOString());
    setCount(0);
    emit();
  }, []);

  return { count, refresh, markSeen };
}

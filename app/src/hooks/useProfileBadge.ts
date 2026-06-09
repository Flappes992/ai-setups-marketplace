import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

const KEY = 'setiq.profile.lastSeenAt';

interface Result {
  count: number;
  refresh: () => Promise<void>;
  markSeen: () => Promise<void>;
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function useProfileBadge(): Result {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!myId) {
      setCount(0);
      return;
    }
    const lastSeenRaw = await AsyncStorage.getItem(KEY);
    const since =
      lastSeenRaw ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: c } = await supabase
      .from('user_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', myId)
      .gte('unlocked_at', since);

    setCount(c ?? 0);
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

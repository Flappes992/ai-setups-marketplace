import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { evaluateAchievementsFor } from '@/hooks/useAchievements';

interface UseToggleLikeResult {
  liked: boolean;
  count: number;
  loading: boolean;
  toggle: () => Promise<void>;
}

export function useToggleLike(setupId: string): UseToggleLikeResult {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ count: total }, mine] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('setup_id', setupId),
        userId
          ? supabase
              .from('likes')
              .select('user_id')
              .eq('setup_id', setupId)
              .eq('user_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setCount(total ?? 0);
      setLiked(!!mine.data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [setupId, userId]);

  const toggle = useCallback(async () => {
    if (!userId) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) {
      const { error } = await supabase.from('likes').insert({ user_id: userId, setup_id: setupId });
      if (error) {
        setLiked(false);
        setCount((c) => c - 1);
      } else {
        evaluateAchievementsFor(userId);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('setup_id', setupId);
      if (error) {
        setLiked(true);
        setCount((c) => c + 1);
      }
    }
  }, [userId, setupId, liked]);

  return { liked, count, loading, toggle };
}

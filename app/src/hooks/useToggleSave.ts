import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { evaluateAchievementsFor } from '@/hooks/useAchievements';

interface UseToggleSaveResult {
  saved: boolean;
  count: number;
  loading: boolean;
  toggle: () => Promise<void>;
}

export function useToggleSave(setupId: string): UseToggleSaveResult {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const countQuery = supabase
        .from('saves')
        .select('user_id', { count: 'exact', head: true })
        .eq('setup_id', setupId);
      const minePromise = userId
        ? supabase
            .from('saves')
            .select('user_id')
            .eq('setup_id', setupId)
            .eq('user_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null });
      const [{ count: total }, { data: mine }] = await Promise.all([countQuery, minePromise]);
      if (cancelled) return;
      setCount(total ?? 0);
      setSaved(!!mine);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [setupId, userId]);

  const toggle = useCallback(async () => {
    if (!userId) return;
    const next = !saved;
    setSaved(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) {
      const { error } = await supabase.from('saves').insert({ user_id: userId, setup_id: setupId });
      if (error) {
        setSaved(false);
        setCount((c) => c - 1);
      } else {
        evaluateAchievementsFor(userId);
      }
    } else {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('user_id', userId)
        .eq('setup_id', setupId);
      if (error) {
        setSaved(true);
        setCount((c) => c + 1);
      }
    }
  }, [userId, setupId, saved]);

  return { saved, count, loading, toggle };
}

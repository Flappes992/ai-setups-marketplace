import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

interface UseToggleSaveResult {
  saved: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
}

export function useToggleSave(setupId: string): UseToggleSaveResult {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('saves')
        .select('user_id')
        .eq('setup_id', setupId)
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      setSaved(!!data);
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
    if (next) {
      const { error } = await supabase.from('saves').insert({ user_id: userId, setup_id: setupId });
      if (error) setSaved(false);
    } else {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('user_id', userId)
        .eq('setup_id', setupId);
      if (error) setSaved(true);
    }
  }, [userId, setupId, saved]);

  return { saved, loading, toggle };
}

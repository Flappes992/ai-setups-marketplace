import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';
import { useAuth } from '@/auth/useAuth';
import { getMutualBlockSet } from '@/hooks/useBlock';

interface UseSetupsResult {
  setups: Setup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSetups(): UseSetupsResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetchedOnce = useRef(false);

  const fetchSetups = useCallback(async () => {
    if (!hasFetchedOnce.current) {
      setLoading(true);
    }
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('setups')
      .select('*, creator:profiles!setups_creator_id_fkey(*)')
      .eq('status', 'live')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
    } else if (data) {
      let mapped = (data as DbSetupWithCreator[]).map(mapDbSetupToSetup);
      if (myId) {
        const blockSet = await getMutualBlockSet(myId);
        if (blockSet.size > 0) {
          mapped = mapped.filter((s) => !blockSet.has(s.creator.id));
        }
      }
      setSetups(mapped);
    }
    setLoading(false);
    hasFetchedOnce.current = true;
  }, [myId]);

  useEffect(() => {
    fetchSetups();
  }, [fetchSetups]);

  return { setups, loading, error, refetch: fetchSetups };
}

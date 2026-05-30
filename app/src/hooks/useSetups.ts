import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

interface UseSetupsResult {
  setups: Setup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSetups(): UseSetupsResult {
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
      setSetups((data as DbSetupWithCreator[]).map(mapDbSetupToSetup));
    }
    setLoading(false);
    hasFetchedOnce.current = true;
  }, []);

  useEffect(() => {
    fetchSetups();
  }, [fetchSetups]);

  return { setups, loading, error, refetch: fetchSetups };
}

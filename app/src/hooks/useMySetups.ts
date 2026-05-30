import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator, SetupStatus } from '@/types/database';

interface MySetupItem extends Setup {
  status: SetupStatus;
}

interface UseMySetupsResult {
  setups: MySetupItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMySetups(): UseMySetupsResult {
  const { session } = useAuth();
  const [setups, setSetups] = useState<MySetupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMySetups = useCallback(async () => {
    if (!session?.user?.id) return;
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('setups')
      .select('*, creator:profiles!setups_creator_id_fkey(*)')
      .eq('creator_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
    } else if (data) {
      setSetups(
        (data as (DbSetupWithCreator & { status: SetupStatus })[]).map((row) => ({
          ...mapDbSetupToSetup(row),
          status: row.status,
        })),
      );
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMySetups();
  }, [fetchMySetups]);

  return { setups, loading, error, refetch: fetchMySetups };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

interface UseSavedSetupsResult {
  setups: Setup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface SaveRow {
  created_at: string;
  setup: DbSetupWithCreator | null;
}

export function useSavedSetups(): UseSavedSetupsResult {
  const { session } = useAuth();
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSaved = useCallback(async () => {
    if (!session?.user?.id) return;
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('saves')
      .select('created_at, setup:setups(*, creator:profiles!setups_creator_id_fkey(*))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
    } else if (data) {
      const rows = data as unknown as SaveRow[];
      setSetups(
        rows
          .filter((r): r is SaveRow & { setup: DbSetupWithCreator } => r.setup !== null)
          .map((r) => mapDbSetupToSetup(r.setup)),
      );
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  return { setups, loading, error, refetch: fetchSaved };
}

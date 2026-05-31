import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

interface UseLikedSetupsResult {
  setups: Setup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface LikeRow {
  created_at: string;
  setup: DbSetupWithCreator | null;
}

export function useLikedSetups(): UseLikedSetupsResult {
  const { session } = useAuth();
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLiked = useCallback(async () => {
    if (!session?.user?.id) return;
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('likes')
      .select('created_at, setup:setups(*, creator:profiles!setups_creator_id_fkey(*))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
    } else if (data) {
      const rows = data as unknown as LikeRow[];
      setSetups(
        rows
          .filter((r): r is LikeRow & { setup: DbSetupWithCreator } => r.setup !== null)
          .map((r) => mapDbSetupToSetup(r.setup)),
      );
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchLiked();
  }, [fetchLiked]);

  return { setups, loading, error, refetch: fetchLiked };
}

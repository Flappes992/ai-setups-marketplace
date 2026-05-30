import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

export interface PurchasedSetup {
  setup: Setup;
  amountCents: number;
  completedAt: string;
}

interface UseMyPurchasesResult {
  items: PurchasedSetup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface PurchaseRow {
  amount_cents: number;
  completed_at: string | null;
  created_at: string;
  setup: DbSetupWithCreator | null;
}

export function useMyPurchases(): UseMyPurchasesResult {
  const { session } = useAuth();
  const [items, setItems] = useState<PurchasedSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPurchases = useCallback(async () => {
    if (!session?.user?.id) return;
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('purchases')
      .select(
        'amount_cents, completed_at, created_at, setup:setups(*, creator:profiles!setups_creator_id_fkey(*))',
      )
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
    } else if (data) {
      const rows = data as unknown as PurchaseRow[];
      setItems(
        rows
          .filter((row): row is PurchaseRow & { setup: DbSetupWithCreator } => row.setup !== null)
          .map((row) => ({
            setup: mapDbSetupToSetup(row.setup),
            amountCents: row.amount_cents,
            completedAt: row.completed_at ?? row.created_at,
          })),
      );
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return { items, loading, error, refetch: fetchPurchases };
}

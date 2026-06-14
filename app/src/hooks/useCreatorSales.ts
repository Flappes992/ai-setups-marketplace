import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

interface CreatorSales {
  revenueCents: number;
  salesCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

/* Abgeschlossene Käufe der EIGENEN Setups → Umsatz + Verkaufszahl.
   Join purchases → setups (inner), gefiltert auf creator_id = ich. */
export function useCreatorSales(): CreatorSales {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [revenueCents, setRevenueCents] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('purchases')
      .select('amount_cents, setup:setups!inner(creator_id)')
      .eq('status', 'completed')
      .eq('setup.creator_id', myId);
    const rows = (data as { amount_cents: number | null }[] | null) ?? [];
    setRevenueCents(rows.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0));
    setSalesCount(rows.length);
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  return { revenueCents, salesCount, loading, refetch: load };
}

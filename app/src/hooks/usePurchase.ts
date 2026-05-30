import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PurchaseRow {
  id: string;
  status: PurchaseStatus;
  stripe_session_id: string;
  created_at: string;
  completed_at: string | null;
}

interface UsePurchaseResult {
  purchase: PurchaseRow | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function usePurchase(setupId: string, userId: string | undefined): UsePurchaseResult {
  const [purchase, setPurchase] = useState<PurchaseRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPurchase = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('purchases')
      .select('id, status, stripe_session_id, created_at, completed_at')
      .eq('setup_id', setupId)
      .eq('user_id', userId)
      .in('status', ['pending', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setPurchase((data as PurchaseRow | null) ?? null);
    setLoading(false);
  }, [setupId, userId]);

  useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  return { purchase, loading, refetch: fetchPurchase };
}

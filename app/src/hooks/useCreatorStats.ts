import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

interface CreatorStats {
  setupsCount: number;
  averageRating: number;
  reviewsCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCreatorStats(creatorId: string | undefined): CreatorStats {
  const [setupsCount, setSetupsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!creatorId) {
      setLoading(false);
      return;
    }
    const { data: setups } = await supabase
      .from('setups')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('status', 'live');
    const ids = ((setups as { id: string }[] | null) ?? []).map((s) => s.id);
    setSetupsCount(ids.length);

    if (ids.length === 0) {
      setAverageRating(0);
      setReviewsCount(0);
      setLoading(false);
      return;
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('setup_id', ids);
    const ratings = ((reviews as { rating: number }[] | null) ?? []).map((r) => r.rating);
    setReviewsCount(ratings.length);
    setAverageRating(
      ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0,
    );
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    load();
  }, [load]);

  return { setupsCount, averageRating, reviewsCount, loading, refresh: load };
}

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

const TODAY_MS = 24 * 60 * 60 * 1000;
const MIN_REVIEWS_FOR_RANKING = 10;
const TOP_RATED_LIMIT = 20;

export interface RatedSetup {
  setup: Setup;
  averageRating: number;
  reviewsCount: number;
}

interface TrendingResult {
  loading: boolean;
  topLiked: Setup[];
  topSold: Setup[];
  newest: Setup[];
  topRated: RatedSetup[];
  refetch: () => Promise<void>;
}

export function useTrending(): TrendingResult {
  const [loading, setLoading] = useState(true);
  const [topLiked, setTopLiked] = useState<Setup[]>([]);
  const [topSold, setTopSold] = useState<Setup[]>([]);
  const [newest, setNewest] = useState<Setup[]>([]);
  const [topRated, setTopRated] = useState<RatedSetup[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - TODAY_MS).toISOString();

    const [likesAgg, salesAgg, newestRes, reviewsRes] = await Promise.all([
      supabase.from('likes').select('setup_id').gte('created_at', since),
      supabase
        .from('purchases')
        .select('setup_id')
        .eq('status', 'completed')
        .gte('created_at', since),
      supabase
        .from('setups')
        .select('*, creator:profiles!setups_creator_id_fkey(*)')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('reviews').select('setup_id, rating'),
    ]);

    function topIds(rows: { setup_id: string }[] | null): string[] {
      if (!rows) return [];
      const counts = new Map<string, number>();
      for (const r of rows) counts.set(r.setup_id, (counts.get(r.setup_id) ?? 0) + 1);
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((e) => e[0]);
    }

    const likedIds = topIds(likesAgg.data as { setup_id: string }[] | null);
    const soldIds = topIds(salesAgg.data as { setup_id: string }[] | null);

    // Top-rated aggregation: min 10 reviews, sort by avg DESC, top 20
    const reviewsBySetup = new Map<string, { sum: number; count: number }>();
    for (const r of (reviewsRes.data as { setup_id: string; rating: number }[] | null) ?? []) {
      const prev = reviewsBySetup.get(r.setup_id) ?? { sum: 0, count: 0 };
      prev.sum += r.rating;
      prev.count += 1;
      reviewsBySetup.set(r.setup_id, prev);
    }
    const ratedRanking = [...reviewsBySetup.entries()]
      .filter(([, v]) => v.count >= MIN_REVIEWS_FOR_RANKING)
      .map(([setupId, v]) => ({ setupId, avg: v.sum / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, TOP_RATED_LIMIT);
    const ratedIds = ratedRanking.map((r) => r.setupId);

    const allWantedIds = [...new Set([...likedIds, ...soldIds, ...ratedIds])];
    const detailMap = new Map<string, Setup>();
    if (allWantedIds.length > 0) {
      const { data } = await supabase
        .from('setups')
        .select('*, creator:profiles!setups_creator_id_fkey(*)')
        .in('id', allWantedIds);
      for (const d of (data as DbSetupWithCreator[] | null) ?? []) {
        const s = mapDbSetupToSetup(d);
        detailMap.set(s.id, s);
      }
    }

    setTopLiked(likedIds.map((id) => detailMap.get(id)).filter((s): s is Setup => !!s));
    setTopSold(soldIds.map((id) => detailMap.get(id)).filter((s): s is Setup => !!s));
    setNewest(((newestRes.data as DbSetupWithCreator[] | null) ?? []).map(mapDbSetupToSetup));
    setTopRated(
      ratedRanking
        .map((r) => {
          const setup = detailMap.get(r.setupId);
          if (!setup) return null;
          return { setup, averageRating: r.avg, reviewsCount: r.count };
        })
        .filter((s): s is RatedSetup => !!s),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, topLiked, topSold, newest, topRated, refetch: load };
}

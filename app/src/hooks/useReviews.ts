import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

export interface Review {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  body: string | null;
  createdAt: string;
}

interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  average: number;
  count: number;
  myReview: Review | null;
  refetch: () => Promise<void>;
  add: (rating: number, body: string, purchaseId: string) => Promise<{ ok: boolean; error?: string }>;
  remove: (reviewId: string) => Promise<void>;
}

export function useReviews(setupId: string): UseReviewsResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, user_id, rating, body, created_at')
      .eq('setup_id', setupId)
      .order('created_at', { ascending: false });
    const rows =
      (data as
        | { id: string; user_id: string; rating: number; body: string | null; created_at: string }[]
        | null) ?? [];

    if (rows.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);
    const pmap = new Map<
      string,
      { username: string; display_name: string; avatar_url: string | null }
    >();
    for (const p of (profiles as {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    }[] | null) ?? []) {
      pmap.set(p.id, p);
    }
    setReviews(
      rows.map((r) => {
        const p = pmap.get(r.user_id);
        return {
          id: r.id,
          userId: r.user_id,
          username: p?.username ?? 'user',
          displayName: p?.display_name ?? 'User',
          avatarUrl: p?.avatar_url ?? null,
          rating: r.rating,
          body: r.body,
          createdAt: r.created_at,
        };
      }),
    );
    setLoading(false);
  }, [setupId]);

  useEffect(() => {
    load();
  }, [load]);

  const average =
    reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const myReview = reviews.find((r) => r.userId === myId) ?? null;

  const add = useCallback(
    async (rating: number, body: string, purchaseId: string) => {
      if (!myId) return { ok: false, error: 'Nicht eingeloggt' };
      if (rating < 1 || rating > 5) return { ok: false, error: 'Rating muss 1-5 sein' };

      const { error } = await supabase.from('reviews').upsert(
        {
          purchase_id: purchaseId,
          setup_id: setupId,
          user_id: myId,
          rating,
          body: body.trim() || null,
        },
        { onConflict: 'purchase_id' },
      );
      if (error) return { ok: false, error: error.message };
      await load();
      return { ok: true };
    },
    [myId, setupId, load],
  );

  const remove = useCallback(
    async (reviewId: string) => {
      await supabase.from('reviews').delete().eq('id', reviewId);
      await load();
    },
    [load],
  );

  return { reviews, loading, average, count: reviews.length, myReview, refetch: load, add, remove };
}

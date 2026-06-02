import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

export type Tier = 'explorer' | 'hustler' | 'creator' | 'creator_plus';

export interface TierProgress {
  accountDays: { current: number; required: number; ok: boolean };
  purchases: { current: number; required: number; ok: boolean };
  likes: { current: number; required: number; ok: boolean };
  saves: { current: number; required: number; ok: boolean };
  comments: { current: number; required: number; ok: boolean };
}

export interface MyTierResult {
  tier: Tier;
  progress: TierProgress | null;
  qualifiesAsHustler: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  applyForCreator: (note: string) => Promise<{ ok: boolean; error?: string }>;
  applicationStatus: 'none' | 'pending' | 'approved' | 'rejected' | null;
}

const HUSTLER_REQ = {
  accountDays: 7,
  purchases: 1,
  likes: 25,
  saves: 5,
  comments: 2,
};

export function useMyTier(): MyTierResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [tier, setTier] = useState<Tier>('explorer');
  const [progress, setProgress] = useState<TierProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<
    'none' | 'pending' | 'approved' | 'rejected' | null
  >(null);

  const refresh = useCallback(async () => {
    if (!myId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, created_at')
      .eq('id', myId)
      .single();
    const p = profile as { tier: Tier; created_at: string } | null;
    if (!p) {
      setLoading(false);
      return;
    }
    setTier(p.tier);

    const { data: app } = await supabase
      .from('creator_applications')
      .select('status')
      .eq('user_id', myId)
      .maybeSingle();
    setApplicationStatus(
      (app as { status: 'pending' | 'approved' | 'rejected' } | null)?.status ?? 'none',
    );

    const accountDays = Math.floor((Date.now() - Date.parse(p.created_at)) / (24 * 60 * 60 * 1000));

    const [pu, li, sa, co] = await Promise.all([
      supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_user_id', myId)
        .eq('status', 'completed'),
      supabase.from('likes').select('user_id', { count: 'exact', head: true }).eq('user_id', myId),
      supabase.from('saves').select('user_id', { count: 'exact', head: true }).eq('user_id', myId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', myId),
    ]);

    const stats = {
      purchases: pu.count ?? 0,
      likes: li.count ?? 0,
      saves: sa.count ?? 0,
      comments: co.count ?? 0,
    };

    const prog: TierProgress = {
      accountDays: {
        current: accountDays,
        required: HUSTLER_REQ.accountDays,
        ok: accountDays >= HUSTLER_REQ.accountDays,
      },
      purchases: {
        current: stats.purchases,
        required: HUSTLER_REQ.purchases,
        ok: stats.purchases >= HUSTLER_REQ.purchases,
      },
      likes: {
        current: stats.likes,
        required: HUSTLER_REQ.likes,
        ok: stats.likes >= HUSTLER_REQ.likes,
      },
      saves: {
        current: stats.saves,
        required: HUSTLER_REQ.saves,
        ok: stats.saves >= HUSTLER_REQ.saves,
      },
      comments: {
        current: stats.comments,
        required: HUSTLER_REQ.comments,
        ok: stats.comments >= HUSTLER_REQ.comments,
      },
    };
    setProgress(prog);

    const qualifies =
      prog.accountDays.ok &&
      prog.purchases.ok &&
      prog.likes.ok &&
      prog.saves.ok &&
      prog.comments.ok;

    if (p.tier === 'explorer' && qualifies) {
      const { error } = await supabase
        .from('profiles')
        .update({ tier: 'hustler', tier_changed_at: new Date().toISOString() })
        .eq('id', myId);
      if (!error) setTier('hustler');
    }

    setLoading(false);
  }, [myId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const applyForCreator = useCallback(
    async (note: string): Promise<{ ok: boolean; error?: string }> => {
      if (!myId) return { ok: false, error: 'Nicht eingeloggt' };
      const { error } = await supabase.from('creator_applications').upsert(
        {
          user_id: myId,
          status: 'pending',
          note: note.trim() || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) return { ok: false, error: error.message };
      setApplicationStatus('pending');
      return { ok: true };
    },
    [myId],
  );

  const qualifiesAsHustler =
    progress != null &&
    progress.accountDays.ok &&
    progress.purchases.ok &&
    progress.likes.ok &&
    progress.saves.ok &&
    progress.comments.ok;

  return {
    tier,
    progress,
    qualifiesAsHustler,
    loading,
    refresh,
    applyForCreator,
    applicationStatus,
  };
}

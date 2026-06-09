import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

/**
 * Standalone evaluator — call after any user-action that could unlock something
 * (like, save, purchase, follow, comment, review, upload, tier-change).
 * Fire-and-forget; silent on errors. Returns newly granted achievement ids.
 */
export async function evaluateAchievementsFor(userId: string): Promise<string[]> {
  try {
    const [purRes, likeRes, comRes, revRes, folRes, setRes, tierRes] = await Promise.all([
      supabase
        .from('purchases')
        .select('setup_id, status')
        .eq('buyer_user_id', userId)
        .eq('status', 'completed'),
      supabase.from('likes').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('follower_id', userId),
      supabase.from('setups').select('id, tags', { count: 'exact' }).eq('creator_id', userId),
      supabase.from('profiles').select('tier').eq('id', userId).single(),
    ]);

    const purchases = (purRes.data as { setup_id: string }[] | null) ?? [];
    const purchasesCount = purchases.length;
    const likeCount = likeRes.count ?? 0;
    const commentCount = comRes.count ?? 0;
    const reviewCount = revRes.count ?? 0;
    const followCount = folRes.count ?? 0;
    const ownSetupsCount = setRes.count ?? 0;
    const tier = (tierRes.data as { tier?: string } | null)?.tier;

    let n8nCount = 0;
    let claudeCount = 0;
    const boughtSetupIds = purchases.map((p) => p.setup_id);
    if (boughtSetupIds.length > 0) {
      const { data: setups } = await supabase
        .from('setups')
        .select('tags')
        .in('id', boughtSetupIds);
      for (const s of (setups as { tags: string[] }[] | null) ?? []) {
        const lower = (s.tags ?? []).map((t) => t.toLowerCase());
        if (lower.some((t) => t === 'n8n' || t.includes('n8n'))) n8nCount++;
        if (lower.some((t) => t === 'claude' || t.includes('anthropic'))) claudeCount++;
      }
    }

    const checks: { id: string; pass: boolean }[] = [
      { id: 'first_buy', pass: purchasesCount >= 1 },
      { id: 'ten_buys', pass: purchasesCount >= 10 },
      { id: 'first_like', pass: likeCount >= 1 },
      { id: 'hundred_likes', pass: likeCount >= 100 },
      { id: 'first_comment', pass: commentCount >= 1 },
      { id: 'first_review', pass: reviewCount >= 1 },
      { id: 'first_follow', pass: followCount >= 1 },
      { id: 'first_upload', pass: ownSetupsCount >= 1 },
      {
        id: 'tier_hustler',
        pass: tier === 'hustler' || tier === 'creator' || tier === 'creator_plus',
      },
      { id: 'tier_creator', pass: tier === 'creator' || tier === 'creator_plus' },
      { id: 'tier_plus', pass: tier === 'creator_plus' },
      { id: 'n8n_vet', pass: n8nCount >= 3 },
      { id: 'claude_main', pass: claudeCount >= 3 },
    ];
    const passing = checks.filter((c) => c.pass).map((c) => c.id);
    if (passing.length === 0) return [];

    const { data: existing } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .in('achievement_id', passing);
    const existingSet = new Set(
      ((existing as { achievement_id: string }[] | null) ?? []).map((e) => e.achievement_id),
    );
    const newlyEarned = passing.filter((id) => !existingSet.has(id));
    if (newlyEarned.length === 0) return [];

    const inserts = newlyEarned.map((id) => ({ user_id: userId, achievement_id: id }));
    const { error } = await supabase.from('user_achievements').insert(inserts);
    if (error) return [];
    return newlyEarned;
  } catch {
    return [];
  }
}

export interface Achievement {
  id: string;
  title: string;
  emoji: string;
  description: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt: string | null;
}

interface Result {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Check all rules + grant any that are satisfied. Idempotent. */
  evaluateAndGrant: () => Promise<string[]>;
}

const RARITY_ORDER: Record<Achievement['rarity'], number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

export function useAchievements(): Result {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId) {
      setLoading(false);
      return;
    }
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from('achievements').select('*'),
      supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', myId),
    ]);
    const allArr =
      (all as
        | {
            id: string;
            title: string;
            emoji: string;
            description: string | null;
            rarity: 'common' | 'rare' | 'epic' | 'legendary';
          }[]
        | null) ?? [];
    const unlockedMap = new Map<string, string>();
    for (const u of (mine as { achievement_id: string; unlocked_at: string }[] | null) ?? []) {
      unlockedMap.set(u.achievement_id, u.unlocked_at);
    }
    const mapped: Achievement[] = allArr.map((a) => ({
      id: a.id,
      title: a.title,
      emoji: a.emoji,
      description: a.description,
      rarity: a.rarity,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));
    mapped.sort((a, b) => {
      // unlocked first by rarity-desc, then locked by rarity-asc
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return a.unlocked
        ? RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]
        : RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    });
    setAchievements(mapped);
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  const evaluateAndGrant = useCallback(async (): Promise<string[]> => {
    if (!myId) return [];
    const granted = await evaluateAchievementsFor(myId);
    if (granted.length > 0) await load();
    return granted;
  }, [myId, load]);

  return {
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    totalCount: achievements.length,
    loading,
    refresh: load,
    evaluateAndGrant,
  };
}

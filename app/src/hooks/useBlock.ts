import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

interface UseBlockResult {
  blocked: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
}

export function useBlock(targetId: string | undefined): UseBlockResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId || !targetId || myId === targetId) {
      setBlocked(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('blocks')
      .select('blocker_id')
      .eq('blocker_id', myId)
      .eq('blocked_id', targetId)
      .maybeSingle();
    setBlocked(!!data);
    setLoading(false);
  }, [myId, targetId]);

  useEffect(() => {
    load();
    const l = () => load();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [load]);

  const toggle = useCallback(async () => {
    if (!myId || !targetId || myId === targetId) return;
    const next = !blocked;
    setBlocked(next);
    if (next) {
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: myId, blocked_id: targetId });
      if (error) {
        setBlocked(false);
        return;
      }
      await supabase
        .from('follows')
        .delete()
        .or(
          `and(follower_id.eq.${myId},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${myId})`,
        );
    } else {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', myId)
        .eq('blocked_id', targetId);
      if (error) {
        setBlocked(true);
        return;
      }
    }
    emit();
  }, [myId, targetId, blocked]);

  return { blocked, loading, toggle };
}

let blockedCache: { myId: string; ids: Set<string>; at: number } | null = null;

export async function getBlockedIds(myId: string): Promise<Set<string>> {
  if (blockedCache && blockedCache.myId === myId && Date.now() - blockedCache.at < 60_000) {
    return blockedCache.ids;
  }
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', myId);
  const ids = new Set(((data as { blocked_id: string }[] | null) ?? []).map((r) => r.blocked_id));
  blockedCache = { myId, ids, at: Date.now() };
  return ids;
}

export async function getBlockerIds(myId: string): Promise<Set<string>> {
  const { data } = await supabase.from('blocks').select('blocker_id').eq('blocked_id', myId);
  return new Set(((data as { blocker_id: string }[] | null) ?? []).map((r) => r.blocker_id));
}

export async function getMutualBlockSet(myId: string): Promise<Set<string>> {
  const [a, b] = await Promise.all([getBlockedIds(myId), getBlockerIds(myId)]);
  return new Set([...a, ...b]);
}

export function invalidateBlockCache() {
  blockedCache = null;
}

listeners.add(() => invalidateBlockCache());

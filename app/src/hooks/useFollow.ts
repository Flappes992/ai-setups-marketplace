import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

interface UseFollowResult {
  following: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
}

export function useFollow(creatorId: string | undefined): UseFollowResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId || !creatorId || myId === creatorId) {
      setFollowing(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', myId)
      .eq('following_id', creatorId)
      .maybeSingle();
    setFollowing(!!data);
    setLoading(false);
  }, [myId, creatorId]);

  useEffect(() => {
    load();
    const l = () => load();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [load]);

  const toggle = useCallback(async () => {
    if (!myId || !creatorId || myId === creatorId) return;
    const next = !following;
    setFollowing(next);
    if (next) {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: myId, following_id: creatorId });
      if (error) {
        setFollowing(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', myId)
        .eq('following_id', creatorId);
      if (error) {
        setFollowing(true);
        return;
      }
    }
    emit();
  }, [myId, creatorId, following]);

  return { following, loading, toggle };
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  return ((data as { following_id: string }[] | null) ?? []).map((r) => r.following_id);
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', userId);
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', userId);
  return count ?? 0;
}

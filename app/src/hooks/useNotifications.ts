import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { getMutualBlockSet } from '@/hooks/useBlock';

export type NotificationType = 'like' | 'comment' | 'purchase' | 'follow';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  setupId?: string;
  setupTitle?: string;
  body?: string;
  amountCents?: number;
  createdAt: string;
}

interface ProfileLite {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface UseNotificationsResult {
  items: NotificationItem[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: mySetupsRaw } = await supabase
      .from('setups')
      .select('id, title')
      .eq('creator_id', myId);
    const mySetups = (mySetupsRaw as { id: string; title: string }[] | null) ?? [];
    const setupIds = mySetups.map((s) => s.id);
    const setupTitleMap = new Map(mySetups.map((s) => [s.id, s.title]));

    const tasks: PromiseLike<unknown>[] = [
      supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', myId)
        .order('created_at', { ascending: false })
        .limit(50)
        .then((r) => r),
    ];

    if (setupIds.length > 0) {
      tasks.push(
        supabase
          .from('likes')
          .select('user_id, setup_id, created_at')
          .in('setup_id', setupIds)
          .neq('user_id', myId)
          .order('created_at', { ascending: false })
          .limit(50)
          .then((r) => r),
        supabase
          .from('comments')
          .select('id, user_id, setup_id, body, created_at')
          .in('setup_id', setupIds)
          .neq('user_id', myId)
          .order('created_at', { ascending: false })
          .limit(50)
          .then((r) => r),
        supabase
          .from('purchases')
          .select('id, buyer_user_id, setup_id, amount_cents, created_at')
          .in('setup_id', setupIds)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(50)
          .then((r) => r),
      );
    }

    const results = await Promise.all(tasks);
    const followRows =
      (results[0] as { data: { follower_id: string; created_at: string }[] | null }).data ?? [];
    const likeRows = setupIds.length
      ? ((
          results[1] as { data: { user_id: string; setup_id: string; created_at: string }[] | null }
        ).data ?? [])
      : [];
    const commentRows = setupIds.length
      ? ((
          results[2] as {
            data:
              | {
                  id: string;
                  user_id: string;
                  setup_id: string;
                  body: string;
                  created_at: string;
                }[]
              | null;
          }
        ).data ?? [])
      : [];
    const purchaseRows = setupIds.length
      ? ((
          results[3] as {
            data:
              | {
                  id: string;
                  buyer_user_id: string;
                  setup_id: string;
                  amount_cents: number;
                  created_at: string;
                }[]
              | null;
          }
        ).data ?? [])
      : [];

    const actorIds = new Set<string>([
      ...followRows.map((r) => r.follower_id),
      ...likeRows.map((r) => r.user_id),
      ...commentRows.map((r) => r.user_id),
      ...purchaseRows.map((r) => r.buyer_user_id),
    ]);

    const profileMap = new Map<string, ProfileLite>();
    if (actorIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', [...actorIds]);
      for (const p of (profiles as ProfileLite[] | null) ?? []) profileMap.set(p.id, p);
    }

    const all: NotificationItem[] = [];

    for (const r of followRows) {
      const p = profileMap.get(r.follower_id);
      if (!p) continue;
      all.push({
        id: `follow:${r.follower_id}:${r.created_at}`,
        type: 'follow',
        actorId: p.id,
        actorUsername: p.username,
        actorDisplayName: p.display_name,
        actorAvatarUrl: p.avatar_url,
        createdAt: r.created_at,
      });
    }
    for (const r of likeRows) {
      const p = profileMap.get(r.user_id);
      if (!p) continue;
      all.push({
        id: `like:${r.user_id}:${r.setup_id}:${r.created_at}`,
        type: 'like',
        actorId: p.id,
        actorUsername: p.username,
        actorDisplayName: p.display_name,
        actorAvatarUrl: p.avatar_url,
        setupId: r.setup_id,
        setupTitle: setupTitleMap.get(r.setup_id),
        createdAt: r.created_at,
      });
    }
    for (const r of commentRows) {
      const p = profileMap.get(r.user_id);
      if (!p) continue;
      all.push({
        id: `comment:${r.id}`,
        type: 'comment',
        actorId: p.id,
        actorUsername: p.username,
        actorDisplayName: p.display_name,
        actorAvatarUrl: p.avatar_url,
        setupId: r.setup_id,
        setupTitle: setupTitleMap.get(r.setup_id),
        body: r.body,
        createdAt: r.created_at,
      });
    }
    for (const r of purchaseRows) {
      const p = profileMap.get(r.buyer_user_id);
      if (!p) continue;
      all.push({
        id: `purchase:${r.id}`,
        type: 'purchase',
        actorId: p.id,
        actorUsername: p.username,
        actorDisplayName: p.display_name,
        actorAvatarUrl: p.avatar_url,
        setupId: r.setup_id,
        setupTitle: setupTitleMap.get(r.setup_id),
        amountCents: r.amount_cents,
        createdAt: r.created_at,
      });
    }

    const blockSet = await getMutualBlockSet(myId);
    const filtered = blockSet.size > 0 ? all.filter((n) => !blockSet.has(n.actorId)) : all;
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    setItems(filtered);
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, refetch: load };
}

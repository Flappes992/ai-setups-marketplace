import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

export interface ConversationItem {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  lastMessageAt: string;
  lastMessageBody: string | null;
  unreadCount: number;
}

interface Result {
  items: ConversationItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  openOrCreate: (otherUserId: string) => Promise<string | null>;
}

export function useConversations(): Result {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!myId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, participant_a, participant_b, last_message_at')
      .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
      .order('last_message_at', { ascending: false });
    const rows =
      (convs as
        | { id: string; participant_a: string; participant_b: string; last_message_at: string }[]
        | null) ?? [];
    if (rows.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const otherIds = rows.map((r) => (r.participant_a === myId ? r.participant_b : r.participant_a));
    const convIds = rows.map((r) => r.id);

    const [{ data: profiles }, { data: lastMessages }, { data: unread }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', otherIds),
      supabase
        .from('messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('conversation_id, sender_id, read_at')
        .in('conversation_id', convIds)
        .neq('sender_id', myId)
        .is('read_at', null),
    ]);

    const pmap = new Map<
      string,
      { username: string; display_name: string; avatar_url: string | null }
    >();
    for (const p of (profiles as { id: string; username: string; display_name: string; avatar_url: string | null }[] | null) ?? []) {
      pmap.set(p.id, p);
    }
    const lastBodyMap = new Map<string, string>();
    for (const m of (lastMessages as { conversation_id: string; body: string; created_at: string }[] | null) ?? []) {
      if (!lastBodyMap.has(m.conversation_id)) lastBodyMap.set(m.conversation_id, m.body);
    }
    const unreadMap = new Map<string, number>();
    for (const u of (unread as { conversation_id: string }[] | null) ?? []) {
      unreadMap.set(u.conversation_id, (unreadMap.get(u.conversation_id) ?? 0) + 1);
    }

    setItems(
      rows.map((r) => {
        const otherId = r.participant_a === myId ? r.participant_b : r.participant_a;
        const p = pmap.get(otherId);
        return {
          id: r.id,
          otherUserId: otherId,
          otherUsername: p?.username ?? 'user',
          otherDisplayName: p?.display_name ?? 'User',
          otherAvatarUrl: p?.avatar_url ?? null,
          lastMessageAt: r.last_message_at,
          lastMessageBody: lastBodyMap.get(r.id) ?? null,
          unreadCount: unreadMap.get(r.id) ?? 0,
        };
      }),
    );
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openOrCreate = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!myId || myId === otherUserId) return null;
      const [a, b] = myId < otherUserId ? [myId, otherUserId] : [otherUserId, myId];

      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_a', a)
        .eq('participant_b', b)
        .maybeSingle();
      if ((existing as { id: string } | null)?.id) return (existing as { id: string }).id;

      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ participant_a: a, participant_b: b })
        .select('id')
        .single();
      if (error) return null;
      return (created as { id: string }).id;
    },
    [myId],
  );

  return { items, loading, refresh, openOrCreate };
}

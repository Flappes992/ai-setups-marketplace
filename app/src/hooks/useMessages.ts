import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

export interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface Result {
  messages: Message[];
  loading: boolean;
  send: (body: string) => Promise<{ ok: boolean; error?: string }>;
  markAllRead: () => Promise<void>;
}

export function useMessages(conversationId: string | null): Result {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    const rows =
      (data as
        | { id: string; sender_id: string; body: string; created_at: string; read_at: string | null }[]
        | null) ?? [];
    setMessages(
      rows.map((r) => ({
        id: r.id,
        senderId: r.sender_id,
        body: r.body,
        createdAt: r.created_at,
        readAt: r.read_at,
      })),
    );
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            sender_id: string;
            body: string;
            created_at: string;
            read_at: string | null;
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                senderId: m.sender_id,
                body: m.body,
                createdAt: m.created_at,
                readAt: m.read_at,
              },
            ];
          });
        },
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  const send = useCallback(
    async (body: string): Promise<{ ok: boolean; error?: string }> => {
      if (!myId) return { ok: false, error: 'Nicht eingeloggt' };
      if (!conversationId) return { ok: false, error: 'Keine Konversation' };
      const trimmed = body.trim();
      if (!trimmed) return { ok: false, error: 'Leer' };

      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: myId, body: trimmed })
        .select('id, sender_id, body, created_at, read_at')
        .single();
      if (error || !data) return { ok: false, error: error?.message ?? 'Senden fehlgeschlagen' };

      const m = data as {
        id: string;
        sender_id: string;
        body: string;
        created_at: string;
        read_at: string | null;
      };
      setMessages((prev) =>
        prev.some((p) => p.id === m.id)
          ? prev
          : [
              ...prev,
              {
                id: m.id,
                senderId: m.sender_id,
                body: m.body,
                createdAt: m.created_at,
                readAt: m.read_at,
              },
            ],
      );

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
      return { ok: true };
    },
    [myId, conversationId],
  );

  const markAllRead = useCallback(async () => {
    if (!myId || !conversationId) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', myId)
      .is('read_at', null);
  }, [myId, conversationId]);

  return { messages, loading, send, markAllRead };
}

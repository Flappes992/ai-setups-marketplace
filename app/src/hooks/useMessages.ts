import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

export type AttachmentType = 'image' | 'gif' | 'file';

export interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  attachmentUrl: string | null;
  attachmentType: AttachmentType | null;
  attachmentName: string | null;
  attachmentSizeBytes: number | null;
}

export interface SendAttachment {
  url: string;
  type: AttachmentType;
  name: string;
  sizeBytes: number;
}

interface Result {
  messages: Message[];
  loading: boolean;
  send: (body: string, attachment?: SendAttachment) => Promise<{ ok: boolean; error?: string }>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
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
      .select('id, sender_id, body, created_at, read_at, attachment_url, attachment_type, attachment_name, attachment_size_bytes')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    type Row = {
      id: string;
      sender_id: string;
      body: string;
      created_at: string;
      read_at: string | null;
      attachment_url: string | null;
      attachment_type: AttachmentType | null;
      attachment_name: string | null;
      attachment_size_bytes: number | null;
    };
    const rows = (data as Row[] | null) ?? [];
    setMessages(
      rows.map((r) => ({
        id: r.id,
        senderId: r.sender_id,
        body: r.body,
        createdAt: r.created_at,
        readAt: r.read_at,
        attachmentUrl: r.attachment_url,
        attachmentType: r.attachment_type,
        attachmentName: r.attachment_name,
        attachmentSizeBytes: r.attachment_size_bytes,
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
            attachment_url: string | null;
            attachment_type: AttachmentType | null;
            attachment_name: string | null;
            attachment_size_bytes: number | null;
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
                attachmentUrl: m.attachment_url,
                attachmentType: m.attachment_type,
                attachmentName: m.attachment_name,
                attachmentSizeBytes: m.attachment_size_bytes,
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
    async (body: string, attachment?: SendAttachment): Promise<{ ok: boolean; error?: string }> => {
      if (!myId) return { ok: false, error: 'Nicht eingeloggt' };
      if (!conversationId) return { ok: false, error: 'Keine Konversation' };
      const trimmed = body.trim();
      if (!trimmed && !attachment) return { ok: false, error: 'Leer' };

      const insertBody: Record<string, unknown> = {
        conversation_id: conversationId,
        sender_id: myId,
        body: trimmed || (attachment ? '📎' : ''),
      };
      if (attachment) {
        insertBody.attachment_url = attachment.url;
        insertBody.attachment_type = attachment.type;
        insertBody.attachment_name = attachment.name;
        insertBody.attachment_size_bytes = attachment.sizeBytes;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(insertBody)
        .select('id, sender_id, body, created_at, read_at, attachment_url, attachment_type, attachment_name, attachment_size_bytes')
        .single();
      if (error || !data) return { ok: false, error: error?.message ?? 'Senden fehlgeschlagen' };

      type InsertResult = {
        id: string;
        sender_id: string;
        body: string;
        created_at: string;
        read_at: string | null;
        attachment_url: string | null;
        attachment_type: AttachmentType | null;
        attachment_name: string | null;
        attachment_size_bytes: number | null;
      };
      const m = data as InsertResult;
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
                attachmentUrl: m.attachment_url,
                attachmentType: m.attachment_type,
                attachmentName: m.attachment_name,
                attachmentSizeBytes: m.attachment_size_bytes,
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

  return { messages, loading, send, markAllRead, refresh: load };
}

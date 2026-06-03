import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { getMutualBlockSet } from '@/hooks/useBlock';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
  parentId: string | null;
  likeCount: number;
  likedByMe: boolean;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
}

interface ProfileLite {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  add: (body: string, parentId?: string | null) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  report: (id: string, reason?: string) => Promise<void>;
}

export function useComments(setupId: string): UseCommentsResult {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, body, created_at, parent_id')
      .eq('setup_id', setupId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
      setLoading(false);
      return;
    }
    let rows = (data ?? []) as CommentRow[];

    if (myId && rows.length > 0) {
      const blockSet = await getMutualBlockSet(myId);
      if (blockSet.size > 0) rows = rows.filter((r) => !blockSet.has(r.user_id));
    }

    if (rows.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const commentIds = rows.map((r) => r.id);

    const [{ data: profiles }, { data: allLikes }, { data: myLikes }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds),
      supabase.from('comment_likes').select('comment_id').in('comment_id', commentIds),
      myId
        ? supabase
            .from('comment_likes')
            .select('comment_id')
            .in('comment_id', commentIds)
            .eq('user_id', myId)
        : Promise.resolve({ data: [] as { comment_id: string }[] }),
    ]);

    const profileMap = new Map<string, ProfileLite>();
    for (const p of (profiles as ProfileLite[] | null) ?? []) profileMap.set(p.id, p);

    const countMap = new Map<string, number>();
    for (const r of (allLikes as { comment_id: string }[] | null) ?? []) {
      countMap.set(r.comment_id, (countMap.get(r.comment_id) ?? 0) + 1);
    }
    const mineSet = new Set(
      ((myLikes as { comment_id: string }[] | null) ?? []).map((r) => r.comment_id),
    );

    setComments(
      rows.map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          id: r.id,
          userId: r.user_id,
          username: p?.username ?? 'user',
          displayName: p?.display_name ?? 'User',
          avatarUrl: p?.avatar_url ?? null,
          body: r.body,
          createdAt: r.created_at,
          parentId: r.parent_id,
          likeCount: countMap.get(r.id) ?? 0,
          likedByMe: mineSet.has(r.id),
        };
      }),
    );
    setLoading(false);
  }, [setupId, myId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    // Unique channel id per hook-instance to avoid "channel already subscribed" if FlatList renders multiple cards
    const channelId = `comments:${setupId}:${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `setup_id=eq.${setupId}`,
        },
        () => {
          fetchComments();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `setup_id=eq.${setupId}`,
        },
        () => {
          fetchComments();
        },
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [setupId, fetchComments]);

  const add = useCallback(
    async (
      body: string,
      parentId: string | null = null,
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!myId) return { ok: false, error: 'Nicht eingeloggt' };
      const trimmed = body.trim();
      if (!trimmed) return { ok: false, error: 'Leerer Kommentar' };

      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          setup_id: setupId,
          user_id: myId,
          body: trimmed,
          parent_id: parentId,
        })
        .select('id, user_id, body, created_at, parent_id')
        .single();

      if (insertError || !data) {
        const msg = insertError?.message ?? 'Insert fehlgeschlagen';
        setError(new Error(msg));
        return { ok: false, error: msg };
      }

      const inserted = data as {
        id: string;
        user_id: string;
        body: string;
        created_at: string;
        parent_id: string | null;
      };

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', myId)
        .single();
      const p = profile as {
        username: string;
        display_name: string;
        avatar_url: string | null;
      } | null;

      const newComment: Comment = {
        id: inserted.id,
        userId: inserted.user_id,
        username: p?.username ?? 'user',
        displayName: p?.display_name ?? 'User',
        avatarUrl: p?.avatar_url ?? null,
        body: inserted.body,
        createdAt: inserted.created_at,
        parentId: inserted.parent_id,
        likeCount: 0,
        likedByMe: false,
      };
      setComments((cs) => [newComment, ...cs]);
      return { ok: true };
    },
    [myId, setupId],
  );

  const remove = useCallback(async (id: string) => {
    const { error: delError } = await supabase.from('comments').delete().eq('id', id);
    if (delError) {
      setError(new Error(delError.message));
      return;
    }
    setComments((cs) => cs.filter((c) => c.id !== id));
  }, []);

  const toggleLike = useCallback(
    async (id: string) => {
      if (!myId) return;
      const current = comments.find((c) => c.id === id);
      if (!current) return;
      const next = !current.likedByMe;
      setComments((cs) =>
        cs.map((c) =>
          c.id === id ? { ...c, likedByMe: next, likeCount: c.likeCount + (next ? 1 : -1) } : c,
        ),
      );
      if (next) {
        const { error: e } = await supabase
          .from('comment_likes')
          .insert({ user_id: myId, comment_id: id });
        if (e) {
          setComments((cs) =>
            cs.map((c) =>
              c.id === id ? { ...c, likedByMe: false, likeCount: c.likeCount - 1 } : c,
            ),
          );
        }
      } else {
        const { error: e } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', myId)
          .eq('comment_id', id);
        if (e) {
          setComments((cs) =>
            cs.map((c) =>
              c.id === id ? { ...c, likedByMe: true, likeCount: c.likeCount + 1 } : c,
            ),
          );
        }
      }
    },
    [myId, comments],
  );

  const report = useCallback(
    async (id: string, reason?: string) => {
      if (!myId) return;
      const { error: e } = await supabase.from('reports').insert({
        reporter_id: myId,
        target_type: 'comment',
        target_id: id,
        reason: reason ?? null,
      });
      if (e) setError(new Error(e.message));
    },
    [myId],
  );

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    add,
    remove,
    toggleLike,
    report,
  };
}

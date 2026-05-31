import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  add: (body: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useComments(setupId: string): UseCommentsResult {
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, body, created_at, author:profiles(username, display_name, avatar_url)')
      .eq('setup_id', setupId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(new Error(fetchError.message));
    } else if (data) {
      const rows = data as unknown as CommentRow[];
      setComments(
        rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          username: r.author?.username ?? 'user',
          displayName: r.author?.display_name ?? 'User',
          avatarUrl: r.author?.avatar_url ?? null,
          body: r.body,
          createdAt: r.created_at,
        })),
      );
    }
    setLoading(false);
  }, [setupId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const add = useCallback(
    async (body: string) => {
      if (!session?.user?.id || !body.trim()) return;
      const { error: insertError } = await supabase
        .from('comments')
        .insert({ setup_id: setupId, user_id: session.user.id, body: body.trim() });
      if (insertError) {
        setError(new Error(insertError.message));
        return;
      }
      await fetchComments();
    },
    [session?.user?.id, setupId, fetchComments],
  );

  const remove = useCallback(async (id: string) => {
    const { error: delError } = await supabase.from('comments').delete().eq('id', id);
    if (delError) {
      setError(new Error(delError.message));
      return;
    }
    setComments((cs) => cs.filter((c) => c.id !== id));
  }, []);

  return { comments, loading, error, refetch: fetchComments, add, remove };
}

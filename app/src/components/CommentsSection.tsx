import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/auth/useAuth';
import { useComments, Comment } from '@/hooks/useComments';
import { useToast } from '@/components/Toast';
import { ReportModal } from '@/components/ReportModal';
import { supabase } from '@/services/supabase';
import { BRAND } from '@/theme/ThemeProvider';

const MAX_COMMENT_LEN = 500;
type SortMode = 'newest' | 'oldest';

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('de-DE');
}

interface Props {
  setupId: string;
  inputRef?: React.MutableRefObject<{ focus: () => void } | null>;
}

interface ReplyTarget {
  id: string;
  username: string;
}

export function CommentsSection({ setupId, inputRef }: Props) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const toast = useToast();
  const { comments, loading, add, remove, toggleLike } = useComments(setupId);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState<SortMode>('newest');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; label: string } | null>(null);

  const tree = useMemo(() => {
    const parents = comments.filter((c) => !c.parentId);
    const childMap = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      const arr = childMap.get(c.parentId) ?? [];
      arr.push(c);
      childMap.set(c.parentId, arr);
    }
    const sorted = [...parents].sort((a, b) => {
      const ta = Date.parse(a.createdAt);
      const tb = Date.parse(b.createdAt);
      return sort === 'newest' ? tb - ta : ta - tb;
    });
    return { parents: sorted, childMap };
  }, [comments, sort]);

  const remaining = MAX_COMMENT_LEN - input.length;
  const nearLimit = remaining <= 50;
  const localInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!inputRef) return;
    inputRef.current = {
      focus: () => localInputRef.current?.focus(),
    };
    return () => {
      inputRef.current = null;
    };
  }, [inputRef]);

  async function handleSubmit() {
    if (!input.trim()) return;
    setSubmitting(true);
    const result = await add(input, replyTo?.id ?? null);
    setSubmitting(false);
    if (!result.ok) {
      toast.show(result.error ?? 'Konnte Kommentar nicht senden', 'error');
      return;
    }
    setInput('');
    setReplyTo(null);
  }

  function startReply(c: Comment) {
    Haptics.selectionAsync();
    setReplyTo({ id: c.parentId ?? c.id, username: c.username });
    localInputRef.current?.focus();
  }

  function handleLongPress(c: Comment) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isOwn = userId === c.userId;
    Alert.alert(
      `@${c.username}`,
      c.body,
      [
        {
          text: 'Kopieren',
          onPress: async () => {
            await Clipboard.setStringAsync(c.body);
            toast.show('Kopiert', 'success');
          },
        },
        ...(isOwn
          ? [
              {
                text: 'Löschen',
                style: 'destructive' as const,
                onPress: () => remove(c.id),
              },
            ]
          : [
              {
                text: 'Melden',
                onPress: () => {
                  setReportTarget({
                    id: c.id,
                    label: `@${c.username}: „${c.body.slice(0, 60)}${c.body.length > 60 ? '…' : ''}"`,
                  });
                },
              },
              {
                text: `@${c.username} blockieren`,
                style: 'destructive' as const,
                onPress: async () => {
                  if (!userId) return;
                  const { error } = await supabase
                    .from('blocks')
                    .insert({ blocker_id: userId, blocked_id: c.userId });
                  if (error) {
                    toast.show(error.message, 'error');
                    return;
                  }
                  toast.show(`@${c.username} blockiert`, 'success');
                },
              },
            ]),
        { text: 'Abbrechen', style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  }

  const placeholder = replyTo ? `Antworte @${replyTo.username}…` : 'Was denkst du dazu?';

  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <Text style={styles.heading}>
          Kommentare {comments.length > 0 && <Text style={styles.count}>· {comments.length}</Text>}
        </Text>
        {tree.parents.length > 1 && (
          <View style={styles.sortRow}>
            {(['newest', 'oldest'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setSort(m)}
                style={[styles.sortChip, sort === m && styles.sortChipActive]}
                accessibilityLabel={`sort-${m}`}
              >
                <Text style={[styles.sortText, sort === m && styles.sortTextActive]}>
                  {m === 'newest' ? 'Neuste' : 'Älteste'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {replyTo && (
        <View style={styles.replyBar}>
          <Text style={styles.replyBarText}>
            Antwort an <Text style={styles.replyBarUser}>@{replyTo.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)} accessibilityLabel="cancel-reply">
            <Text style={styles.replyBarClear}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <TextInput
            ref={localInputRef}
            selectionColor={BRAND.teal}
            placeholder={placeholder}
            value={input}
            onChangeText={setInput}
            style={styles.input}
            maxLength={MAX_COMMENT_LEN}
            editable={!!userId && !submitting}
            accessibilityLabel="comment-input"
            multiline
          />
          {input.length > 0 && (
            <Text style={[styles.charCount, nearLimit && styles.charCountWarn]}>{remaining}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.submit, (!input.trim() || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim() || submitting}
          accessibilityLabel="comment-submit"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>Senden</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : tree.parents.length === 0 ? (
        <Text style={styles.empty}>Noch keine Kommentare. Sei der erste.</Text>
      ) : (
        tree.parents.map((c) => (
          <View key={c.id}>
            <CommentRow
              comment={c}
              onLike={() => toggleLike(c.id)}
              onReply={() => startReply(c)}
              onLongPress={() => handleLongPress(c)}
            />
            {(tree.childMap.get(c.id) ?? [])
              .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
              .map((r) => (
                <View key={r.id} style={styles.replyWrap}>
                  <CommentRow
                    comment={r}
                    onLike={() => toggleLike(r.id)}
                    onReply={() => startReply(r)}
                    onLongPress={() => handleLongPress(r)}
                    isReply
                  />
                </View>
              ))}
          </View>
        ))
      )}

      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType="comment"
          targetId={reportTarget.id}
          targetLabel={reportTarget.label}
        />
      )}
    </View>
  );
}

function CommentRow({
  comment,
  onLike,
  onReply,
  onLongPress,
  isReply,
}: {
  comment: Comment;
  onLike: () => void;
  onReply: () => void;
  onLongPress: () => void;
  isReply?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.85}
      accessibilityLabel={`comment-${comment.id}`}
    >
      {comment.avatarUrl ? (
        <Image
          source={{ uri: comment.avatarUrl }}
          style={isReply ? styles.avatarSm : styles.avatar}
        />
      ) : (
        <View style={[isReply ? styles.avatarSm : styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{comment.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.displayName}>{comment.displayName}</Text>
          <Text style={styles.meta}>
            @{comment.username} · {timeAgo(comment.createdAt)}
          </Text>
        </View>
        <Text style={styles.body}>{comment.body}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onLike}
            style={styles.actionBtn}
            accessibilityLabel="like-comment"
          >
            <Text style={[styles.actionIcon, comment.likedByMe && styles.actionIconLiked]}>
              {comment.likedByMe ? '♥' : '♡'}
            </Text>
            {comment.likeCount > 0 && (
              <Text style={[styles.actionCount, comment.likedByMe && styles.actionCountLiked]}>
                {comment.likeCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onReply}
            style={styles.actionBtn}
            accessibilityLabel="reply-comment"
          >
            <Text style={styles.actionText}>Antworten</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  heading: { fontSize: 18, fontWeight: '800', color: '#111' },
  count: { color: '#666', fontWeight: '600' },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111',
    minHeight: 44,
    maxHeight: 120,
  },
  submit: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 78,
    alignItems: 'center',
  },
  submitDisabled: { backgroundColor: '#bbb' },
  submitText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 12 },

  row: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#eee' },
  avatarSm: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '700', color: '#666' },
  rowBody: { flex: 1, gap: 4 },
  rowHeader: { flexDirection: 'row', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' },
  displayName: { fontSize: 14, fontWeight: '700', color: '#111' },
  meta: { fontSize: 12, color: '#888' },
  body: { fontSize: 14, color: '#333', lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 14, marginTop: 6, alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionIcon: { fontSize: 16, color: '#888' },
  actionIconLiked: { color: BRAND.like },
  actionCount: { fontSize: 12, color: '#888', fontWeight: '600' },
  actionCountLiked: { color: BRAND.like },
  actionText: { fontSize: 12, color: '#666', fontWeight: '700' },

  replyWrap: { paddingLeft: 36, paddingTop: 4 },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(45,212,191,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.teal,
  },
  replyBarText: { fontSize: 13, color: '#666' },
  replyBarUser: { color: BRAND.tealDark, fontWeight: '800' },
  replyBarClear: { fontSize: 16, color: '#888', paddingHorizontal: 6 },

  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortRow: { flexDirection: 'row', gap: 4 },
  sortChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  sortChipActive: { backgroundColor: '#2DD4BF' },
  sortText: { fontSize: 11, color: '#666', fontWeight: '700' },
  sortTextActive: { color: '#0b3b35' },
  charCount: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  charCountWarn: { color: '#ef4444' },
});

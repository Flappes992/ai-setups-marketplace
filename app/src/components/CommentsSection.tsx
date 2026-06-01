import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/auth/useAuth';
import { useComments, Comment } from '@/hooks/useComments';

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
}

export function CommentsSection({ setupId }: Props) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { comments, loading, add, remove } = useComments(setupId);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!input.trim()) return;
    setSubmitting(true);
    await add(input);
    setInput('');
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Kommentare {comments.length > 0 && <Text style={styles.count}>· {comments.length}</Text>}
      </Text>

      <View style={styles.composer}>
        <TextInput
          selectionColor="#2DD4BF"
          placeholder="Was denkst du dazu?"
          value={input}
          onChangeText={setInput}
          style={styles.input}
          maxLength={500}
          editable={!!userId && !submitting}
          accessibilityLabel="comment-input"
        />
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
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>Noch keine Kommentare. Sei der erste.</Text>
      ) : (
        comments.map((c) => (
          <CommentRow key={c.id} comment={c} ownerId={userId} onDelete={remove} />
        ))
      )}
    </View>
  );
}

function CommentRow({
  comment,
  ownerId,
  onDelete,
}: {
  comment: Comment;
  ownerId?: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const isOwn = ownerId === comment.userId;
  return (
    <View style={styles.row}>
      {comment.avatarUrl ? (
        <Image source={{ uri: comment.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
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
        {isOwn && (
          <TouchableOpacity onPress={() => onDelete(comment.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Löschen</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  heading: { fontSize: 18, fontWeight: '800', color: '#111' },
  count: { color: '#666', fontWeight: '600' },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    maxHeight: 100,
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
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '700', color: '#666' },
  rowBody: { flex: 1, gap: 4 },
  rowHeader: { flexDirection: 'row', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' },
  displayName: { fontSize: 14, fontWeight: '700', color: '#111' },
  meta: { fontSize: 12, color: '#888' },
  body: { fontSize: 14, color: '#333', lineHeight: 19 },
  deleteBtn: { alignSelf: 'flex-start', marginTop: 4 },
  deleteText: { fontSize: 12, color: '#cc0000', fontWeight: '600' },
});

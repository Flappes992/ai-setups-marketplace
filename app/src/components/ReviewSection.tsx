import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useReviews, Review } from '@/hooks/useReviews';
import { useToast } from '@/components/Toast';
import { BRAND } from '@/theme/ThemeProvider';

interface Props {
  setupId: string;
  purchaseId?: string;
  canReview: boolean;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text
          key={s}
          style={{
            fontSize: size,
            color: s <= rating ? '#fbbf24' : '#e5e5e5',
            marginRight: 1,
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

export function ReviewSection({ setupId, purchaseId, canReview }: Props) {
  const { reviews, loading, average, count, myReview, add, remove } = useReviews(setupId);
  const [composerOpen, setComposerOpen] = useState(false);
  const toast = useToast();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Bewertungen</Text>
        {count > 0 && (
          <View style={styles.summary}>
            <StarRow rating={Math.round(average)} size={16} />
            <Text style={styles.avgText}>
              {average.toFixed(1)} · {count}
            </Text>
          </View>
        )}
      </View>

      {canReview && !myReview && (
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setComposerOpen(true);
          }}
          style={styles.cta}
          accessibilityLabel="write-review"
        >
          <Text style={styles.ctaText}>★ Setup bewerten</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color={BRAND.teal} style={{ marginTop: 12 }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>Noch keine Bewertungen.</Text>
      ) : (
        reviews.map((r) => (
          <ReviewRow
            key={r.id}
            review={r}
            isMine={r.id === myReview?.id}
            onDelete={() => remove(r.id)}
          />
        ))
      )}

      {purchaseId && (
        <ReviewComposerModal
          visible={composerOpen}
          onClose={() => setComposerOpen(false)}
          onSubmit={async (rating, body) => {
            const result = await add(rating, body, purchaseId);
            if (result.ok) {
              toast.show('Bewertung gespeichert ★', 'success');
              setComposerOpen(false);
            } else {
              toast.show(result.error ?? 'Fehler', 'error');
            }
            return result.ok;
          }}
        />
      )}
    </View>
  );
}

function ReviewRow({
  review,
  isMine,
  onDelete,
}: {
  review: Review;
  isMine: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      {review.avatarUrl ? (
        <Image source={{ uri: review.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{review.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.rowHead}>
          <Text style={styles.name}>{review.displayName}</Text>
          <StarRow rating={review.rating} />
        </View>
        <Text style={styles.handle}>@{review.username}</Text>
        {review.body ? <Text style={styles.body}>{review.body}</Text> : null}
        {isMine && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Löschen</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ReviewComposerModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, body: string) => Promise<boolean>;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating < 1) return;
    setSubmitting(true);
    const ok = await onSubmit(rating, body);
    setSubmitting(false);
    if (ok) {
      setRating(0);
      setBody('');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Bewerten</Text>
          <Text style={styles.modalSub}>Wie war das Setup für dich?</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  Haptics.selectionAsync();
                  setRating(s);
                }}
                style={styles.starBtn}
                accessibilityLabel={`star-${s}`}
              >
                <Text style={[styles.starBig, s <= rating && styles.starBigActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Was war gut, was nicht? (optional)"
            multiline
            style={styles.input}
            selectionColor={BRAND.teal}
            maxLength={500}
            accessibilityLabel="review-body"
          />
          <Text style={styles.charCount}>{body.length}/500</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={rating < 1 || submitting}
              style={[styles.submitBtn, (rating < 1 || submitting) && styles.submitDisabled]}
              accessibilityLabel="review-submit"
            >
              {submitting ? (
                <ActivityIndicator color="#0b3b35" />
              ) : (
                <Text style={styles.submitText}>Senden</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avgText: { fontSize: 13, fontWeight: '700', color: '#666' },
  cta: {
    backgroundColor: BRAND.teal,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
  empty: { color: '#999', fontSize: 14, paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#666', fontWeight: '700', fontSize: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 14, fontWeight: '700', color: '#111' },
  handle: { fontSize: 12, color: '#888', marginTop: 2 },
  body: { fontSize: 14, color: '#333', marginTop: 4, lineHeight: 19 },
  deleteBtn: { alignSelf: 'flex-start', marginTop: 4 },
  deleteText: { color: '#cc0000', fontSize: 12, fontWeight: '600' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    padding: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  modalSub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 18 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 22 },
  starBtn: { padding: 4 },
  starBig: { fontSize: 42, color: '#e5e5e5' },
  starBigActive: { color: '#fbbf24' },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    color: '#111',
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  cancelText: { color: '#666', fontWeight: '700', fontSize: 14 },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: BRAND.teal,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
});

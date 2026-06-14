import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/components/Toast';
import { BRAND } from '@/theme/ThemeProvider';

export type ReportTargetType = 'comment' | 'setup' | 'profile';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
}

const REASONS: { key: string; label: string; emoji: string }[] = [
  { key: 'spam', label: 'Spam oder Werbung', emoji: '📢' },
  { key: 'harassment', label: 'Belästigung oder Hass', emoji: '😡' },
  { key: 'sexual', label: 'Sexueller / Nicht jugendfreier Inhalt', emoji: '🔞' },
  { key: 'misinfo', label: 'Falsche Informationen', emoji: '🚫' },
  { key: 'copyright', label: 'Verstoß gegen Urheberrecht', emoji: '©️' },
  { key: 'scam', label: 'Betrug oder Täuschung', emoji: '⚠️' },
  { key: 'other', label: 'Sonstiges', emoji: '…' },
];

const TITLE_BY_TYPE: Record<ReportTargetType, string> = {
  comment: 'Kommentar melden',
  setup: 'Setup melden',
  profile: 'Profil melden',
};

export function ReportModal({ visible, onClose, targetType, targetId, targetLabel }: Props) {
  const { session } = useAuth();
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setSelectedReason(null);
    setNote('');
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!session?.user?.id || !selectedReason) return;
    setSubmitting(true);
    const reasonObj = REASONS.find((r) => r.key === selectedReason);
    const fullReason = reasonObj
      ? `${reasonObj.label}${note.trim() ? ` — ${note.trim()}` : ''}`
      : note.trim() || null;

    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_type: targetType,
      target_id: targetId,
      reason: fullReason,
    });
    setSubmitting(false);
    if (error) {
      toast.show(error.message, 'error');
      return;
    }
    toast.show('Gemeldet — danke. Wir prüfen das.', 'success');
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{TITLE_BY_TYPE[targetType]}</Text>
            {targetLabel ? <Text style={styles.targetLabel}>{targetLabel}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>Grund auswählen</Text>
          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
            {REASONS.map((r) => {
              const active = selectedReason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setSelectedReason(r.key)}
                  style={[styles.reasonRow, active && styles.reasonRowActive]}
                  accessibilityLabel={`reason-${r.key}`}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                    {r.label}
                  </Text>
                  <Text style={[styles.reasonCheck, active && styles.reasonCheckActive]}>
                    {active ? '●' : '○'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Zusätzliche Info (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Was sollten wir wissen?"
            multiline
            style={styles.input}
            selectionColor={BRAND.teal}
            maxLength={500}
            accessibilityLabel="report-note"
          />
          <Text style={styles.charCount}>{note.length}/500</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selectedReason || submitting}
              style={[
                styles.submitBtn,
                (!selectedReason || submitting) && styles.submitBtnDisabled,
              ]}
              accessibilityLabel="report-submit"
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Melden</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  kav: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 32,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  targetLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reasonRowActive: {
    backgroundColor: 'rgba(45,212,191,0.1)',
    borderColor: BRAND.teal,
  },
  reasonEmoji: { fontSize: 18 },
  reasonText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  reasonTextActive: { color: '#111', fontWeight: '700' },
  reasonCheck: { fontSize: 16, color: '#bbb' },
  reasonCheckActive: { color: BRAND.tealDark },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    color: '#111',
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12 },
  cancelText: { fontSize: 14, color: '#666', fontWeight: '700' },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

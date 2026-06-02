import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMyTier, Tier } from '@/hooks/useMyTier';
import { useToast } from '@/components/Toast';
import { BRAND } from '@/theme/ThemeProvider';

const TIER_META: Record<Tier, { name: string; emoji: string; line: string; color: string }> = {
  explorer: {
    name: 'Explorer',
    emoji: '🧭',
    line: 'Du entdeckst gerade die Plattform.',
    color: '#a78bfa',
  },
  hustler: {
    name: 'Hustler',
    emoji: '⬡',
    line: 'Du kennst die Plattform — als Creator beantragen.',
    color: BRAND.teal,
  },
  creator: {
    name: 'Creator',
    emoji: '🏆',
    line: 'Du kannst Setups hochladen und verkaufen.',
    color: '#fbbf24',
  },
  creator_plus: {
    name: 'Creator+',
    emoji: '💎',
    line: 'Founding-Creator. Du darfst gratis Setups posten.',
    color: BRAND.teal,
  },
};

const HUSTLER_LABELS = {
  accountDays: { label: 'Tage als Mitglied', unit: 'Tage' },
  purchases: { label: 'Käufe getätigt', unit: '' },
  likes: { label: 'Likes vergeben', unit: '' },
  saves: { label: 'Gespeichert', unit: '' },
  comments: { label: 'Kommentare geschrieben', unit: '' },
} as const;

export function TierCard() {
  const { tier, progress, loading, applicationStatus, applyForCreator, refresh } = useMyTier();
  const [appOpen, setAppOpen] = useState(false);
  const meta = TIER_META[tier];

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={BRAND.teal} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: meta.color }]}>
          <Text style={styles.badgeEmoji}>{meta.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierName}>{meta.name}</Text>
          <Text style={styles.tierLine}>{meta.line}</Text>
        </View>
      </View>

      {tier === 'explorer' && progress && (
        <View style={styles.progressBlock}>
          <Text style={styles.progressTitle}>So wirst du zum Hustler:</Text>
          {(Object.keys(HUSTLER_LABELS) as (keyof typeof HUSTLER_LABELS)[]).map((key) => {
            const p = progress[key];
            return (
              <ProgressLine
                key={key}
                label={HUSTLER_LABELS[key].label}
                current={p.current}
                required={p.required}
                ok={p.ok}
              />
            );
          })}
        </View>
      )}

      {tier === 'hustler' && (
        <View style={styles.hustlerBlock}>
          {applicationStatus === 'pending' ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxIcon}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Antrag eingereicht</Text>
                <Text style={styles.statusSub}>
                  Du hörst von uns, sobald dein Creator-Antrag durch ist.
                </Text>
              </View>
            </View>
          ) : applicationStatus === 'rejected' ? (
            <>
              <View style={[styles.statusBox, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                <Text style={styles.statusBoxIcon}>↺</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Antrag abgelehnt</Text>
                  <Text style={styles.statusSub}>Du kannst es nochmal versuchen.</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAppOpen(true)}
                style={styles.applyBtn}
                accessibilityLabel="apply-creator-retry"
              >
                <Text style={styles.applyBtnText}>+ Erneut bewerben</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setAppOpen(true)}
              style={styles.applyBtn}
              accessibilityLabel="apply-creator"
            >
              <Text style={styles.applyBtnText}>+ Creator werden</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {tier === 'creator' && (
        <View style={styles.creatorBlock}>
          <Text style={styles.creatorLine}>
            🚀 Du kannst Setups hochladen und über Stripe Auszahlungen empfangen.
          </Text>
          <View style={styles.plusInviteBox}>
            <Text style={styles.plusInviteEmoji}>💎</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.plusInviteTitle}>Auf dem Weg zu Creator+</Text>
              <Text style={styles.plusInviteSub}>
                Gib Gas — die ersten Creator+ lade ich persönlich ein. Kein öffentliches Kriterium.
                Wer launcht, postet, sich in der Community zeigt, fällt auf.
              </Text>
              <Text style={styles.plusInvitePerk}>
                Privileg: kostenlose Setups als Community-Beitrag posten.
              </Text>
            </View>
          </View>
        </View>
      )}

      {tier === 'creator_plus' && (
        <View style={styles.creatorBlock}>
          <View style={styles.plusActiveBox}>
            <Text style={styles.plusInviteEmoji}>💎</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.plusActiveTitle}>Founding Creator+</Text>
              <Text style={styles.plusActiveSub}>
                Du gehörst zu den ersten von Sicci persönlich ausgewählten Creators. Du darfst
                Setups gratis posten als Community-Beitrag.
              </Text>
            </View>
          </View>
        </View>
      )}

      <CreatorApplicationModal
        visible={appOpen}
        onClose={() => setAppOpen(false)}
        onSubmit={applyForCreator}
      />
    </View>
  );
}

function ProgressLine({
  label,
  current,
  required,
  ok,
}: {
  label: string;
  current: number;
  required: number;
  ok: boolean;
}) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <View style={styles.progressLine}>
      <View style={styles.progressLineHead}>
        <Text style={[styles.progressLabel, ok && styles.progressLabelOk]}>
          {ok ? '✓' : '○'} {label}
        </Text>
        <Text style={[styles.progressCount, ok && styles.progressCountOk]}>
          {current} / {required}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${pct}%`, backgroundColor: ok ? BRAND.teal : '#cbd5e1' },
          ]}
        />
      </View>
    </View>
  );
}

function CreatorApplicationModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit() {
    setSubmitting(true);
    const result = await onSubmit(note);
    setSubmitting(false);
    if (result.ok) {
      toast.show('Antrag eingereicht 🚀', 'success');
      setNote('');
      onClose();
    } else {
      toast.show(result.error ?? 'Fehler beim Senden', 'error');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Creator werden</Text>
          <Text style={styles.modalSub}>
            Warum solltest du als Creator auf Setiq posten dürfen? Was ist dein AI-Stack, dein
            Use-Case, deine Zielgruppe?
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="z.B. Ich baue n8n-Workflows für Cold-Email-Outreach, 15k Follower auf X..."
            multiline
            style={styles.modalInput}
            selectionColor={BRAND.teal}
            maxLength={500}
            accessibilityLabel="creator-application-note"
          />
          <Text style={styles.modalHint}>{note.length}/500</Text>
          <View style={styles.modalBtnRow}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.modalSubmitBtn, submitting && styles.modalSubmitDisabled]}
              disabled={submitting}
              accessibilityLabel="creator-application-submit"
            >
              {submitting ? (
                <ActivityIndicator color="#0b3b35" />
              ) : (
                <Text style={styles.modalSubmitText}>Antrag senden</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: { fontSize: 26 },
  tierName: { fontSize: 18, fontWeight: '800', color: '#111' },
  tierLine: { fontSize: 13, color: '#666', marginTop: 2 },

  progressBlock: { marginTop: 18, gap: 12 },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressLine: { gap: 4 },
  progressLineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, color: '#666' },
  progressLabelOk: { color: '#111', fontWeight: '600' },
  progressCount: { fontSize: 13, color: '#888', fontWeight: '600' },
  progressCountOk: { color: BRAND.tealDark, fontWeight: '800' },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%' },

  hustlerBlock: { marginTop: 18, gap: 10 },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45,212,191,0.08)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  statusBoxIcon: { fontSize: 22 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  statusSub: { fontSize: 12, color: '#666', marginTop: 2 },
  applyBtn: {
    backgroundColor: BRAND.teal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },

  creatorBlock: { marginTop: 12, gap: 12 },
  creatorLine: { fontSize: 13, color: '#666', lineHeight: 18 },
  plusInviteBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: '#181B22',
    borderRadius: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.4)',
  },
  plusInviteEmoji: { fontSize: 26 },
  plusInviteTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  plusInviteSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 },
  plusInvitePerk: {
    fontSize: 12,
    color: BRAND.tealLight,
    marginTop: 8,
    fontWeight: '700',
  },
  plusActiveBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: '#181B22',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BRAND.teal,
  },
  plusActiveTitle: { fontSize: 15, fontWeight: '900', color: BRAND.tealLight, marginBottom: 4 },
  plusActiveSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    padding: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  modalSub: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    color: '#111',
    textAlignVertical: 'top',
  },
  modalHint: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  modalBtnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  modalCancelText: { fontSize: 14, color: '#666', fontWeight: '700' },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: BRAND.teal,
  },
  modalSubmitDisabled: { opacity: 0.6 },
  modalSubmitText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
});

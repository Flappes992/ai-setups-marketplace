import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useMySetups } from '@/hooks/useMySetups';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/components/Toast';
import { BRAND } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BundleCreate'>;

export function BundleCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const mySetups = useMySetups();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [discount, setDiscount] = useState('15');
  const [submitting, setSubmitting] = useState(false);

  const discountNum = Math.max(5, Math.min(50, Number(discount) || 15));
  const valid = title.trim().length >= 3 && selectedIds.size >= 2;
  const totalCents = mySetups.setups
    .filter((s) => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.priceCents, 0);
  const discountedCents = Math.round(totalCents * (1 - discountNum / 100));

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (!valid || !session?.user?.id) return;
    setSubmitting(true);
    const { data: bundle, error } = await supabase
      .from('bundles')
      .insert({
        creator_id: session.user.id,
        title: title.trim(),
        description: description.trim() || null,
        discount_pct: discountNum,
      })
      .select('id')
      .single();
    if (error || !bundle) {
      toast.show(error?.message ?? 'Anlegen fehlgeschlagen', 'error');
      setSubmitting(false);
      return;
    }
    const items = [...selectedIds].map((sid, i) => ({
      bundle_id: (bundle as { id: string }).id,
      setup_id: sid,
      position: i,
    }));
    const { error: e2 } = await supabase.from('bundle_items').insert(items);
    setSubmitting(false);
    if (e2) {
      toast.show(e2.message, 'error');
      return;
    }
    toast.show('Bundle live 📦', 'success');
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Neues Bundle</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.section}>
          <Text style={styles.label}>Titel</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z.B. Cold-Email Complete Stack"
            style={styles.input}
            selectionColor={BRAND.teal}
            maxLength={80}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Kurzbeschreibung (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Was komplementiert sich an diesen Setups?"
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            selectionColor={BRAND.teal}
            multiline
            maxLength={300}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Rabatt (%)</Text>
          <TextInput
            value={discount}
            onChangeText={setDiscount}
            placeholder="15"
            keyboardType="number-pad"
            style={styles.input}
            selectionColor={BRAND.teal}
            maxLength={2}
          />
          <Text style={styles.hint}>5–50 % erlaubt</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Setups auswählen ({selectedIds.size})</Text>
          <Text style={styles.hint}>Mindestens 2 deiner eigenen Setups</Text>
          {mySetups.loading ? (
            <ActivityIndicator color={BRAND.teal} />
          ) : mySetups.setups.length === 0 ? (
            <Text style={styles.empty}>Du hast noch keine Setups hochgeladen.</Text>
          ) : (
            mySetups.setups.map((s) => {
              const sel = selectedIds.has(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => toggle(s.id)}
                  style={[styles.setupRow, sel && styles.setupRowSel]}
                >
                  <Image source={{ uri: s.videoThumbnail }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.setupTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text style={styles.setupPrice}>
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(s.priceCents / 100)}
                    </Text>
                  </View>
                  <View style={[styles.check, sel && styles.checkSel]}>
                    {sel && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {selectedIds.size >= 2 && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Vorschau</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Einzeln total:</Text>
              <Text style={styles.previewVal}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  totalCents / 100,
                )}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Bundle-Preis:</Text>
              <Text style={[styles.previewVal, { color: BRAND.tealDark, fontWeight: '900' }]}>
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  discountedCents / 100,
                )}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={submit}
          disabled={!valid || submitting}
          style={[styles.submitBtn, (!valid || submitting) && styles.submitDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#0b3b35" />
          ) : (
            <Text style={styles.submitText}>Bundle anlegen</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  section: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  hint: { fontSize: 11, color: '#888' },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  empty: { color: '#999', fontStyle: 'italic', paddingVertical: 12 },
  setupRow: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    padding: 8,
    borderRadius: 10,
    gap: 10,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  setupRowSel: { borderColor: BRAND.teal, backgroundColor: 'rgba(45,212,191,0.08)' },
  thumb: { width: 40, height: 56, borderRadius: 6, backgroundColor: '#ddd' },
  setupTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  setupPrice: { fontSize: 11, color: '#666', marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSel: { backgroundColor: BRAND.teal, borderColor: BRAND.teal },
  checkMark: { color: '#0b3b35', fontSize: 12, fontWeight: '900' },
  preview: { backgroundColor: '#181B22', padding: 14, borderRadius: 12, gap: 8 },
  previewTitle: { color: BRAND.tealLight, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { color: '#fff', fontSize: 13 },
  previewVal: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submitBtn: {
    backgroundColor: BRAND.teal,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitDisabled: { backgroundColor: '#e5e5e5' },
  submitText: { color: '#0b3b35', fontWeight: '900', fontSize: 15 },
});

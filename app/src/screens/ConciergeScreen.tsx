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
import { useConcierge, ConciergeMatch } from '@/hooks/useConcierge';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Concierge'>;

const EXAMPLES = [
  'Cold-Email Workflow für B2B',
  'n8n automation für Lead-Tracking',
  'YouTube-Shorts Skripte generieren',
  'Claude prompt für SEO-Artikel',
  'Anfänger-Setup für ChatGPT',
];

export function ConciergeScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const [query, setQuery] = useState('');
  const { matches, loading, search, clear } = useConcierge();

  async function go() {
    if (!query.trim()) return;
    await search(query);
  }

  function useExample(ex: string) {
    setQuery(ex);
    search(ex);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.title, { color: palette.text }]}>🤖 Setup-Concierge</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Beschreib was du brauchst — natürliche Sprache</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="z.B. n8n-Workflow für Cold-Outreach…"
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
          selectionColor={BRAND.teal}
          onSubmitEditing={go}
          returnKeyType="search"
          autoFocus
          accessibilityLabel="concierge-query"
        />
        <TouchableOpacity
          onPress={go}
          disabled={!query.trim() || loading}
          style={[styles.goBtn, (!query.trim() || loading) && [styles.goBtnDisabled, { backgroundColor: palette.border }]]}
          accessibilityLabel="concierge-search"
        >
          {loading ? (
            <ActivityIndicator color="#0b3b35" size="small" />
          ) : (
            <Text style={styles.goBtnText}>Finden →</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {matches.length === 0 && !loading ? (
          <View style={styles.exampleBox}>
            <Text style={[styles.exampleTitle, { color: palette.textSecondary }]}>Probier mal:</Text>
            {EXAMPLES.map((ex) => (
              <TouchableOpacity
                key={ex}
                onPress={() => useExample(ex)}
                style={[styles.exampleRow, { borderBottomColor: palette.border }]}
                accessibilityLabel={`example-${ex}`}
              >
                <Text style={styles.exampleArrow}>›</Text>
                <Text style={[styles.exampleText, { color: palette.text }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.results}>
            <View style={styles.resultsHead}>
              <Text style={[styles.resultsTitle, { color: palette.textSecondary }]}>{matches.length} Treffer</Text>
              <TouchableOpacity
                onPress={() => {
                  clear();
                  setQuery('');
                }}
              >
                <Text style={styles.clearText}>Zurücksetzen</Text>
              </TouchableOpacity>
            </View>
            {matches.map((m, i) => (
              <Row
                key={m.setup.id}
                m={m}
                rank={i + 1}
                onPress={() => navigation.navigate('SetupDetail', { setup: m.setup })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  m,
  rank,
  onPress,
}: {
  m: ConciergeMatch;
  rank: number;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: palette.surface }]} onPress={onPress}>
      <View style={styles.rank}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <Image source={{ uri: m.setup.videoThumbnail }} style={[styles.thumb, { backgroundColor: palette.border }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
          {m.setup.title}
        </Text>
        <Text style={[styles.rowMeta, { color: palette.textSecondary }]} numberOfLines={1}>
          @{m.setup.creator.username} ·{' '}
          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
            m.setup.priceCents / 100,
          )}
        </Text>
        {m.reasons.length > 0 && (
          <View style={styles.reasonRow}>
            {m.reasons.map((r) => (
              <View key={r} style={styles.reasonChip}>
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 11, color: '#888', marginTop: 2 },
  inputWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
  },
  goBtn: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnDisabled: { backgroundColor: '#e5e5e5' },
  goBtnText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },

  exampleBox: { padding: 20, gap: 10 },
  exampleTitle: { fontSize: 13, color: '#888', fontWeight: '700', marginBottom: 6 },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  exampleArrow: { fontSize: 18, color: BRAND.teal, fontWeight: '900' },
  exampleText: { fontSize: 14, color: '#333' },

  results: { padding: 12 },
  resultsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  resultsTitle: { fontSize: 12, fontWeight: '800', color: '#666' },
  clearText: { fontSize: 12, color: BRAND.tealDark, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#0b3b35', fontWeight: '900', fontSize: 13 },
  thumb: { width: 50, height: 70, borderRadius: 8, backgroundColor: '#eee' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  rowMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  reasonChip: {
    backgroundColor: 'rgba(45,212,191,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonText: { fontSize: 10, color: BRAND.tealDark, fontWeight: '700' },
});

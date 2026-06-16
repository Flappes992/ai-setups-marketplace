import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import {
  parseScanOutput,
  assetToPrefill,
  allInOnePrefill,
  categoryLabel,
  type ScanResult,
  type ScanPrefill,
} from '@/lib/scanImport';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ScanImport'>;

function eur(n: number): string {
  return n === 0 ? 'Gratis' : `${n} €`;
}

function stars(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

export function ScanImportScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputTheme = { backgroundColor: palette.surface, color: palette.text, borderColor: palette.border };

  function handleParse() {
    const parsed = parseScanOutput(raw);
    if (!parsed.ok) {
      setError(parsed.error);
      setResult(null);
      return;
    }
    setError(null);
    setResult(parsed.result);
  }

  function startUpload(prefill: ScanPrefill) {
    navigation.navigate('SetupUpload', { prefill });
  }

  const totalValue = useMemo(
    () => (result ? result.assets.reduce((sum, a) => sum + a.priceEur, 0) : 0),
    [result],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="close-scan-import"
        >
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Setiq-Scan importieren</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!result && (
            <>
              <View style={[styles.howBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.howTitle, { color: palette.text }]}>So geht's</Text>
                {[
                  'Kopier den Setiq-Scan-Prompt in dein eigenes ChatGPT / Claude.',
                  'Häng dein Setup dran (Prompts, CLAUDE.md, Workflows …).',
                  'Füg die JSON-Antwort hier unten ein → wir machen Verkaufs-Entwürfe draus.',
                ].map((s, i) => (
                  <View key={i} style={styles.howRow}>
                    <Text style={styles.howNum}>{i + 1}</Text>
                    <Text style={[styles.howText, { color: palette.textSecondary }]}>{s}</Text>
                  </View>
                ))}
              </View>

              <TextInput
                selectionColor={BRAND.teal}
                placeholder="Hier die komplette JSON-Antwort des Setiq-Scans einfügen…"
                placeholderTextColor={palette.textSecondary}
                value={raw}
                onChangeText={setRaw}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, inputTheme]}
                accessibilityLabel="scan-json-input"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, !raw.trim() && styles.primaryBtnDisabled]}
                disabled={!raw.trim()}
                onPress={handleParse}
                accessibilityLabel="scan-parse"
              >
                <Text style={styles.primaryBtnText}>Analysieren</Text>
              </TouchableOpacity>
            </>
          )}

          {result && (
            <>
              {/* Sicherheits-Report */}
              <View style={[styles.secBox, { borderColor: BRAND.teal }]}>
                <Text style={[styles.secTitle, { color: palette.text }]}>🔒 Sicherheits-Check</Text>
                {result.securityReport.redacted.length > 0 ? (
                  <Text style={[styles.secBody, { color: palette.textSecondary }]}>
                    Entfernt: {result.securityReport.redacted.join(', ')}
                  </Text>
                ) : (
                  <Text style={[styles.secBody, { color: palette.textSecondary }]}>
                    Nichts Offensichtliches gefunden.
                  </Text>
                )}
                <Text style={[styles.secWarn, { color: palette.textSecondary }]}>
                  ⚠️ {result.securityReport.warning}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: palette.textSecondary }]}>
                  {result.assets.length} verkaufbare Assets · Gesamtwert {eur(totalValue)}
                </Text>
              </View>

              {/* All-in-One */}
              {result.allInOne && (
                <View style={[styles.aioCard, { borderColor: BRAND.teal, backgroundColor: palette.surface }]}>
                  <Text style={styles.aioBadge}>ALL-IN-ONE</Text>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{result.allInOne.title}</Text>
                  <Text style={[styles.cardDesc, { color: palette.textSecondary }]} numberOfLines={3}>
                    {result.allInOne.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.priceTag, { color: BRAND.teal }]}>{eur(result.allInOne.priceEur)}</Text>
                    <TouchableOpacity
                      style={styles.useBtn}
                      onPress={() => startUpload(allInOnePrefill(result.allInOne!, result.assets))}
                      accessibilityLabel="scan-use-allinone"
                    >
                      <Text style={styles.useBtnText}>Als Paket hochladen →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Einzel-Assets */}
              {result.assets.map((a, i) => (
                <View
                  key={i}
                  style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.catChip, { color: palette.textSecondary, borderColor: palette.border }]}>
                      {categoryLabel(a.category)}
                    </Text>
                    <Text style={styles.qualityStars}>{stars(a.qualityScore)}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{a.title}</Text>
                  <Text style={[styles.cardDesc, { color: palette.textSecondary }]} numberOfLines={3}>
                    {a.description}
                  </Text>
                  {a.removedHere.length > 0 && (
                    <Text style={styles.removedNote}>🔒 entfernt: {a.removedHere.join(', ')}</Text>
                  )}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.priceTag, { color: palette.text }]}>{eur(a.priceEur)}</Text>
                    <TouchableOpacity
                      style={styles.useBtn}
                      onPress={() => startUpload(assetToPrefill(a))}
                      accessibilityLabel={`scan-use-${i}`}
                    >
                      <Text style={styles.useBtnText}>Hochladen →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setResult(null);
                  setRaw('');
                }}
                accessibilityLabel="scan-reset"
              >
                <Text style={[styles.resetText, { color: palette.textSecondary }]}>
                  Andere Scan-Ausgabe einfügen
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  backIcon: { fontSize: 30, width: 30, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  howBox: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  howTitle: { fontSize: 14, fontWeight: '800' },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  howNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND.teal,
    color: '#04201c',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  howText: { flex: 1, fontSize: 13, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  errorText: { color: '#e0566b', fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: BRAND.teal,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#04201c', fontSize: 16, fontWeight: '800' },
  secBox: { borderWidth: 1.5, borderRadius: 14, padding: 14, gap: 4 },
  secTitle: { fontSize: 14, fontWeight: '800' },
  secBody: { fontSize: 13, lineHeight: 18 },
  secWarn: { fontSize: 12, lineHeight: 17, marginTop: 4, fontStyle: 'italic' },
  summaryRow: { paddingHorizontal: 4 },
  summaryText: { fontSize: 12, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  aioCard: { borderWidth: 2, borderRadius: 14, padding: 16, gap: 8 },
  aioBadge: {
    alignSelf: 'flex-start',
    color: BRAND.teal,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catChip: {
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  qualityStars: { color: '#F5B301', fontSize: 13, letterSpacing: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  removedNote: { fontSize: 11, color: '#7a8a99', fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceTag: { fontSize: 16, fontWeight: '900' },
  useBtn: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  useBtnText: { color: '#04201c', fontSize: 13, fontWeight: '800' },
  resetBtn: { alignItems: 'center', paddingVertical: 12 },
  resetText: { fontSize: 13, fontWeight: '600' },
});

import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { BRAND } from '@/theme/ThemeProvider';
import type { BrainManifest } from '@/types/database';

interface Props {
  manifest: BrainManifest;
}

const VAULT_LABELS: Record<string, string> = {
  obsidian: 'Obsidian',
  logseq: 'Logseq',
  roam: 'Roam Research',
  tana: 'Tana',
  custom: 'Custom Vault',
};

export function BrainPackCard({ manifest }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🧠 BrainPack</Text>
        <View style={styles.vaultBadge}>
          <Text style={styles.vaultBadgeText}>
            {VAULT_LABELS[manifest.vault_type] ?? manifest.vault_type}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta label="Notizen" value={String(manifest.note_count)} />
      </View>

      {manifest.ai_optimized_for && manifest.ai_optimized_for.length > 0 && (
        <Section title="Optimiert für AI">
          <View style={styles.chipRow}>
            {manifest.ai_optimized_for.map((a) => (
              <View key={a} style={styles.chip}>
                <Text style={styles.chipText}>{a}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {manifest.community_plugins_required &&
        manifest.community_plugins_required.length > 0 && (
          <Section title="Erforderliche Plugins">
            {manifest.community_plugins_required.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pluginRow}
                onPress={() => {
                  if (p.install_url) Linking.openURL(p.install_url).catch(() => {});
                }}
                accessibilityLabel={`plugin-${p.id}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pluginName}>{p.name}</Text>
                  <Text style={styles.pluginId}>{p.id}</Text>
                </View>
                {p.install_url && <Text style={styles.pluginArrow}>↗</Text>}
              </TouchableOpacity>
            ))}
          </Section>
        )}

      {manifest.folder_tree_preview && manifest.folder_tree_preview.length > 0 && (
        <Section title="Ordner-Struktur">
          <View style={styles.treeBox}>
            {manifest.folder_tree_preview.slice(0, 15).map((line, i) => (
              <Text key={i} style={styles.treeLine}>
                {line}
              </Text>
            ))}
            {manifest.folder_tree_preview.length > 15 && (
              <Text style={styles.treeMore}>
                … +{manifest.folder_tree_preview.length - 15} weitere
              </Text>
            )}
          </View>
        </Section>
      )}

      {manifest.sample_query_examples && manifest.sample_query_examples.length > 0 && (
        <Section title="Beispiel-Fragen an deine AI">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.querySrip}>
              {manifest.sample_query_examples.slice(0, 6).map((q) => (
                <View key={q} style={styles.queryCard}>
                  <Text style={styles.queryText}>„{q}"</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Section>
      )}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181B22',
    borderRadius: 16,
    padding: 16,
    marginVertical: 14,
    marginHorizontal: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  vaultBadge: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vaultBadgeText: { color: '#0b3b35', fontWeight: '900', fontSize: 12 },
  metaRow: { flexDirection: 'row', gap: 18 },
  metaItem: { flex: 1 },
  metaValue: { color: BRAND.tealLight, fontSize: 22, fontWeight: '900' },
  metaLabel: { color: '#aaa', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { gap: 8 },
  sectionTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(45,212,191,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: { color: BRAND.tealLight, fontSize: 11, fontWeight: '700' },
  pluginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  pluginName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pluginId: { color: '#888', fontSize: 11, marginTop: 1, fontFamily: 'Menlo' },
  pluginArrow: { color: BRAND.tealLight, fontSize: 18, fontWeight: '900' },
  treeBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  treeLine: { color: '#ddd', fontSize: 12, fontFamily: 'Menlo', lineHeight: 17 },
  treeMore: { color: '#666', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  querySrip: { flexDirection: 'row', gap: 8 },
  queryCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    minWidth: 220,
    maxWidth: 280,
  },
  queryText: { color: '#fff', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
});

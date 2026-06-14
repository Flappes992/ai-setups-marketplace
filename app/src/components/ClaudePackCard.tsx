import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BRAND } from '@/theme/ThemeProvider';
import type { ClaudeManifest } from '@/types/database';

interface Props {
  manifest: ClaudeManifest;
}

const TARGET_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code',
  'claude-desktop': 'Claude Desktop',
  'claude-projects': 'Claude.ai Projects',
};

export function ClaudePackCard({ manifest }: Props) {
  const personasCount = manifest.personas?.length ?? 0;
  const commandsCount = manifest.commands?.length ?? 0;
  const agentsCount = manifest.agents?.length ?? 0;
  const [openSnippet, setOpenSnippet] = useState<string | null>(null);

  const previewItems: { key: string; label: string; body: string; tag: string }[] = [];
  for (const p of manifest.personas ?? [])
    previewItems.push({ key: `p-${p.title}`, label: p.title, body: p.body, tag: '🧑 Persona' });
  for (const c of manifest.commands ?? [])
    previewItems.push({ key: `c-${c.trigger}`, label: c.trigger, body: c.body, tag: '⚡ Command' });
  for (const a of manifest.agents ?? [])
    previewItems.push({ key: `a-${a.name}`, label: a.name, body: a.body, tag: '🤖 Agent' });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🪐 ClaudePack</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v{manifest.manifest_version}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        {personasCount > 0 && <Meta count={personasCount} label={personasCount === 1 ? 'Persona' : 'Personas'} />}
        {commandsCount > 0 && (
          <Meta count={commandsCount} label={commandsCount === 1 ? 'Command' : 'Commands'} />
        )}
        {agentsCount > 0 && <Meta count={agentsCount} label={agentsCount === 1 ? 'Agent' : 'Agents'} />}
      </View>

      {manifest.target_envs && manifest.target_envs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funktioniert in</Text>
          <View style={styles.chipRow}>
            {manifest.target_envs.map((t) => (
              <View key={t} style={styles.chip}>
                <Text style={styles.chipText}>{TARGET_LABELS[t] ?? t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {previewItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inhalt (tippen zum Vorschauen)</Text>
          <View style={{ gap: 6 }}>
            {previewItems.map((item) => (
              <View key={item.key}>
                <TouchableOpacity
                  style={styles.itemRow}
                  onPress={() => setOpenSnippet(openSnippet === item.key ? null : item.key)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTag}>{item.tag}</Text>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.itemArrow}>
                    {openSnippet === item.key ? '▾' : '▸'}
                  </Text>
                </TouchableOpacity>
                {openSnippet === item.key && (
                  <ScrollView style={styles.snippetBox}>
                    <Text style={styles.snippetText}>{item.body}</Text>
                  </ScrollView>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function Meta({ count, label }: { count: number; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaCount}>{count}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181B22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 14,
    marginHorizontal: 16,
    gap: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  versionBadge: {
    backgroundColor: BRAND.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionText: { color: '#0b3b35', fontWeight: '900', fontSize: 11 },
  metaRow: { flexDirection: 'row', gap: 18 },
  metaItem: { alignItems: 'flex-start' },
  metaCount: { color: BRAND.tealLight, fontSize: 22, fontWeight: '900' },
  metaLabel: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  itemRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  itemTag: { color: '#aaa', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  itemLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  itemArrow: { color: BRAND.tealLight, fontSize: 16, fontWeight: '900' },
  snippetBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    maxHeight: 240,
  },
  snippetText: {
    color: '#ddd',
    fontSize: 12,
    fontFamily: 'Menlo',
    lineHeight: 18,
  },
});

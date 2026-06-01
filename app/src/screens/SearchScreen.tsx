import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';
import { useSetups } from '@/hooks/useSetups';
import { useRecentSearches } from '@/hooks/useRecentSearches';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Search'>;

const TRENDING_FALLBACK = ['claude', 'n8n', 'chatgpt', 'automation', 'notion', 'workflow'];

const CATEGORIES = [
  { key: 'gpt', icon: '🤖', label: 'Custom GPTs', query: 'gpt' },
  { key: 'prompt', icon: '✨', label: 'Prompt-Stacks', query: 'prompt' },
  { key: 'workflow', icon: '⚡', label: 'Workflows', query: 'workflow' },
  { key: 'tutorial', icon: '📚', label: 'Tutorials', query: 'tutorial' },
] as const;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(false);
  const { setups: allSetups } = useSetups();
  const { recent, add: addRecent, clear: clearRecent } = useRecentSearches();

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allSetups) {
      for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    return top.length > 0 ? top.slice(0, 8) : TRENDING_FALLBACK;
  }, [allSetups]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const q = query.trim();
      const { data } = await supabase
        .from('setups')
        .select('*, creator:profiles!setups_creator_id_fkey(*)')
        .eq('status', 'live')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(40);
      if (cancelled) return;
      setResults((data as DbSetupWithCreator[] | null)?.map(mapDbSetupToSetup) ?? []);
      setLoading(false);
      addRecent(q);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, addRecent]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Setups, Creator, Tags…"
          style={styles.input}
          autoFocus
          selectionColor="#2DD4BF"
          accessibilityLabel="search-input"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.trim().length < 2 ? (
        <ScrollView contentContainerStyle={styles.trending} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Entdecken</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={styles.catCard}
                onPress={() => setQuery(c.query)}
                accessibilityLabel={`category-${c.key}`}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={styles.catLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {recent.length > 0 && (
            <>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Zuletzt gesucht</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={styles.clearLink}>Alle löschen</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagWrap}>
                {recent.map((t) => (
                  <TouchableOpacity key={t} onPress={() => setQuery(t)} style={styles.recentTag}>
                    <Text style={styles.recentTagText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Trending Tags</Text>
          <View style={styles.tagWrap}>
            {trendingTags.map((t) => (
              <TouchableOpacity key={t} onPress={() => setQuery(t)} style={styles.trendingTag}>
                <Text style={styles.trendingTagText}>#{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Keine Treffer für „{query}“</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('SetupDetail', { setup: item })}
            >
              <Image source={{ uri: item.videoThumbnail }} style={styles.thumb} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  @{item.creator.username} ·{' '}
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(item.priceCents / 100)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  clearBtn: { fontSize: 18, color: '#999', paddingHorizontal: 8 },
  trending: { padding: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  trendingTagText: { fontSize: 14, color: '#111', fontWeight: '600' },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  catCard: {
    width: '47%',
    aspectRatio: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  catIcon: { fontSize: 30 },
  catLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  clearLink: { fontSize: 12, color: '#2DD4BF', fontWeight: '700' },
  recentTag: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recentTagText: { fontSize: 13, color: '#444' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888' },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  thumb: { width: 56, height: 80, borderRadius: 8, backgroundColor: '#ccc' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowMeta: { fontSize: 13, color: '#666', marginTop: 4 },
});

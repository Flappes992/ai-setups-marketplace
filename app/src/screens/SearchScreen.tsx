import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Search'>;

const TRENDING = ['claude', 'n8n', 'chatgpt', 'automation', 'notion', 'workflow', 'discord'];

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(false);

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
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

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
          accessibilityLabel="search-input"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.trending}>
          <Text style={styles.sectionTitle}>Trending Tags</Text>
          <View style={styles.tagWrap}>
            {TRENDING.map((t) => (
              <TouchableOpacity key={t} onPress={() => setQuery(t)} style={styles.trendingTag}>
                <Text style={styles.trendingTagText}>#{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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

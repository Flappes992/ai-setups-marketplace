import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { Setup } from '@/types/setup';
import { DbSetupWithCreator } from '@/types/database';
import { useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'TagFeed'>;
type R = RouteProp<MainStackParamList, 'TagFeed'>;

export function TagFeedScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { palette } = useTheme();
  const tag = params.tag;
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('setups')
        .select('*, creator:profiles!setups_creator_id_fkey(*)')
        .eq('status', 'live')
        .contains('tags', [tag])
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setSetups((data as DbSetupWithCreator[] | null)?.map(mapDbSetupToSetup) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tag]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>#{tag}</Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
        {setups.length} {setups.length === 1 ? 'Setup' : 'Setups'}
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : setups.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
            Noch keine Setups mit diesem Tag
          </Text>
        </View>
      ) : (
        <FlatList
          data={setups}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridCell}
              onPress={() => navigation.navigate('SetupDetail', { setup: item })}
            >
              <Image source={{ uri: item.videoThumbnail }} style={styles.gridThumb} />
              <View style={styles.gridOverlay}>
                <Text style={styles.gridTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.gridPrice}>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 28, lineHeight: 32 },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  subtitle: { color: '#666', paddingHorizontal: 16, paddingVertical: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888' },
  gridCell: {
    flex: 1,
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  gridThumb: { ...StyleSheet.absoluteFillObject },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  gridTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  gridPrice: { color: '#2DD4BF', fontSize: 12, fontWeight: '800', marginTop: 4 },
});

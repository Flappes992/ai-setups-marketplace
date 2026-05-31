import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useLikedSetups } from '@/hooks/useLikedSetups';
import { Setup } from '@/types/setup';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Liked'>;

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function LikedSetupsScreen() {
  const navigation = useNavigation<Nav>();
  const { setups, loading, error, refetch } = useLikedSetups();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Gelikte Setups</Text>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : setups.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>Noch nichts geliked. Tipp im Feed auf das Herz.</Text>
        </View>
      ) : (
        <FlatList
          data={setups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <LikedRow item={item} navigation={navigation} />}
        />
      )}
    </SafeAreaView>
  );
}

function LikedRow({ item, navigation }: { item: Setup; navigation: Nav }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('SetupDetail', { setup: item })}
    >
      <Image source={{ uri: item.videoThumbnail }} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>
          {formatPriceEur(item.priceCents)} · @{item.creator.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', padding: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 32 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#666', textAlign: 'center' },
  errorText: { color: '#cc0000', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 80, borderRadius: 8, backgroundColor: '#ccc' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  rowMeta: { fontSize: 13, color: '#666', marginTop: 4 },
});

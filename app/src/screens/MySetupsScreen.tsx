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
import { useMySetups } from '@/hooks/useMySetups';
import { Setup } from '@/types/setup';

type MySetupsNav = NativeStackNavigationProp<MainStackParamList, 'MySetups'>;

function formatPriceEur(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function MySetupsScreen() {
  const navigation = useNavigation<MySetupsNav>();
  const { setups, loading, error, refetch } = useMySetups();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Meine Setups</Text>

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
          <Text style={styles.emptyText}>Du hast noch keine Setups hochgeladen.</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => navigation.navigate('SetupUpload')}
          >
            <Text style={styles.uploadButtonText}>Erstes Setup hochladen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={setups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SetupRow setup={item} navigation={navigation} />}
        />
      )}
    </SafeAreaView>
  );
}

function SetupRow({
  setup,
  navigation,
}: {
  setup: Setup & { status: string };
  navigation: MySetupsNav;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('SetupDetail', { setup })}
    >
      <Image source={{ uri: setup.videoThumbnail }} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {setup.title}
        </Text>
        <Text style={styles.rowMeta}>
          {formatPriceEur(setup.priceCents)} · {setup.status}
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
  emptyText: { color: '#666', textAlign: 'center', marginBottom: 16 },
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
  uploadButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  uploadButtonText: { color: '#fff', fontWeight: '700' },
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useBundles, Bundle } from '@/hooks/useBundles';
import { useMyTier } from '@/hooks/useMyTier';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Bundles'>;

function fmt(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function BundlesScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { bundles, loading, refresh } = useBundles();
  const { tier } = useMyTier();
  const [refreshing, setRefreshing] = useState(false);
  const canCreate = tier === 'creator' || tier === 'creator_plus';

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>📦 Bundles</Text>
        {canCreate ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('BundleCreate')}
            accessibilityLabel="create-bundle"
          >
            <Text style={styles.newBtn}>+ Neu</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND.teal} />
          }
        >
          {bundles.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>Noch keine Bundles</Text>
              <Text style={[styles.emptySub, { color: palette.textSecondary }]}>
                Bundles sind Stacks aus mehreren Setups mit automatischem Rabatt — komplementäre
                Workflows zum besseren Preis.
                {canCreate ? '\n\nLeg dein erstes Bundle an oben rechts.' : ''}
              </Text>
            </View>
          ) : (
            bundles
              .filter((b) => b.setups.length > 0)
              .map((b) => (
                <BundleCard
                  key={b.id}
                  bundle={b}
                  onPress={() => navigation.navigate('BundleDetail', { bundle: b })}
                />
              ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BundleCard({ bundle, onPress }: { bundle: Bundle; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: palette.surface }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardTitle, { color: palette.text }]} numberOfLines={1}>
          {bundle.title}
        </Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>−{bundle.discountPct}%</Text>
        </View>
      </View>
      {bundle.description ? (
        <Text style={[styles.cardDesc, { color: palette.textSecondary }]} numberOfLines={2}>
          {bundle.description}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {bundle.setups.map((s) => (
          <Image key={s.id} source={{ uri: s.videoThumbnail }} style={[styles.thumb, { backgroundColor: palette.border }]} />
        ))}
      </ScrollView>
      <View style={styles.priceRow}>
        <Text style={[styles.strike, { color: palette.textSecondary }]}>{fmt(bundle.totalPriceCents)}</Text>
        <Text style={styles.price}>{fmt(bundle.discountedPriceCents)}</Text>
        <Text style={styles.savings}>du sparst {fmt(bundle.totalPriceCents - bundle.discountedPriceCents)}</Text>
      </View>
    </TouchableOpacity>
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
  newBtn: { fontSize: 14, color: BRAND.tealDark, fontWeight: '800', width: 50, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 14 },
  empty: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  emptySub: { fontSize: 13, color: '#666', textAlign: 'center', maxWidth: 320, lineHeight: 18 },

  card: {
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111', flex: 1, marginRight: 8 },
  discountBadge: {
    backgroundColor: BRAND.like,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 17, marginTop: 4 },
  thumb: { width: 70, height: 100, borderRadius: 8, backgroundColor: '#ddd', marginRight: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  strike: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  price: { fontSize: 18, fontWeight: '900', color: BRAND.tealDark },
  savings: { fontSize: 11, color: BRAND.like, fontWeight: '800' },
});

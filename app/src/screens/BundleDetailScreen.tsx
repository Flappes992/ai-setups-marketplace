import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BundleDetail'>;
type R = RouteProp<MainStackParamList, 'BundleDetail'>;

function fmt(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function BundleDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const route = useRoute<R>();
  const { bundle } = route.params;
  const savings = bundle.totalPriceCents - bundle.discountedPriceCents;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: palette.text }]}>Bundle</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: palette.text }]}>{bundle.title}</Text>
          {bundle.description ? <Text style={[styles.desc, { color: palette.textSecondary }]}>{bundle.description}</Text> : null}

          <View style={styles.priceBox}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>−{bundle.discountPct}%</Text>
            </View>
            <View>
              <Text style={styles.strike}>{fmt(bundle.totalPriceCents)}</Text>
              <Text style={styles.price}>{fmt(bundle.discountedPriceCents)}</Text>
              <Text style={styles.savings}>du sparst {fmt(savings)}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>Enthält {bundle.setups.length} Setups</Text>
        <View style={styles.list}>
          {bundle.setups.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.row, { backgroundColor: palette.surface }]}
              onPress={() => navigation.navigate('SetupDetail', { setup: s })}
            >
              <Image source={{ uri: s.videoThumbnail }} style={[styles.thumb, { backgroundColor: palette.border }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>
                  {s.title}
                </Text>
                <Text style={[styles.rowMeta, { color: palette.textSecondary }]}>
                  @{s.creator.username} · {fmt(s.priceCents)}
                </Text>
              </View>
              <Text style={[styles.chev, { color: palette.textSecondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.comingSoon}>
          <Text style={styles.comingTitle}>Bundle-Kauf kommt bald</Text>
          <Text style={[styles.comingText, { color: palette.textSecondary }]}>
            Aktuell sind die einzelnen Setups noch separat kaufbar. Der 1-Klick-Bundle-Kauf inkl.
            automatischem Rabatt landet im nächsten Sprint.
          </Text>
        </View>
      </ScrollView>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  topTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  scroll: { padding: 16, gap: 18, paddingBottom: 40 },
  hero: { gap: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#111' },
  desc: { fontSize: 14, color: '#555', lineHeight: 20 },
  priceBox: {
    flexDirection: 'row',
    backgroundColor: '#181B22',
    padding: 16,
    borderRadius: 14,
    gap: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  discountBadge: {
    backgroundColor: BRAND.like,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  discountText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  strike: { fontSize: 13, color: '#888', textDecorationLine: 'line-through' },
  price: { fontSize: 28, fontWeight: '900', color: BRAND.tealLight },
  savings: { fontSize: 12, color: '#fff', marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase' },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  thumb: { width: 60, height: 84, borderRadius: 8, backgroundColor: '#ddd' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  rowMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  chev: { fontSize: 22, color: '#bbb', fontWeight: '900' },
  comingSoon: {
    backgroundColor: 'rgba(45,212,191,0.10)',
    padding: 14,
    borderRadius: 12,
    gap: 4,
  },
  comingTitle: { fontSize: 13, fontWeight: '800', color: BRAND.tealDark },
  comingText: { fontSize: 12, color: '#444', lineHeight: 17 },
});

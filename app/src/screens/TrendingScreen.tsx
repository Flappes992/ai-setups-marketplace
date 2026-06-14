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
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useTrending, RatedSetup } from '@/hooks/useTrending';
import { Setup } from '@/types/setup';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Trending'>;

export function TrendingScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { loading, topLiked, topSold, newest, topRated, refetch } = useTrending();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: palette.text }]}>Trending heute</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Was die setiq-Community gerade feiert</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND.teal}
              colors={[BRAND.teal]}
            />
          }
        >
          <Section
            emoji="🔥"
            title="Top Likes heute"
            subtitle="Was die Community am meisten feiert"
            setups={topLiked}
            emptyText="Heute noch keine Likes verteilt."
            onPress={(s) => navigation.navigate('SetupDetail', { setup: s })}
            rankColor={palette.like}
          />
          <Section
            emoji="💰"
            title="Meistgekauft heute"
            subtitle="Die Käufer-Favoriten"
            setups={topSold}
            emptyText="Heute noch keine Käufe."
            onPress={(s) => navigation.navigate('SetupDetail', { setup: s })}
            rankColor={BRAND.teal}
          />
          <RatedSection
            setups={topRated}
            onPress={(s) => navigation.navigate('SetupDetail', { setup: s })}
          />
          <Section
            emoji="✨"
            title="Frisch hochgeladen"
            subtitle="Die neuesten Setups"
            setups={newest.slice(0, 10)}
            emptyText="Noch nichts hochgeladen."
            onPress={(s) => navigation.navigate('SetupDetail', { setup: s })}
            rankColor="#a78bfa"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({
  emoji,
  title,
  subtitle,
  setups,
  emptyText,
  onPress,
  rankColor,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  setups: Setup[];
  emptyText: string;
  onPress: (s: Setup) => void;
  rankColor: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.sectionSub, { color: palette.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      {setups.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{emptyText}</Text>
      ) : (
        setups.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.row, { borderBottomColor: palette.border }]}
            onPress={() => onPress(s)}
            accessibilityLabel={`trending-${s.id}`}
          >
            <View style={[styles.rank, { backgroundColor: rankColor }]}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <Image source={{ uri: s.videoThumbnail }} style={[styles.thumb, { backgroundColor: palette.border }]} />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={[styles.rowMeta, { color: palette.textSecondary }]} numberOfLines={1}>
                @{s.creator.username}
              </Text>
            </View>
            <Text style={styles.rowPrice}>
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
              }).format(s.priceCents / 100)}
              {s.negotiable ? ' (VB)' : ''}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function RatedSection({
  setups,
  onPress,
}: {
  setups: RatedSetup[];
  onPress: (s: Setup) => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEmoji}>⭐</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Bestbewertet (Top 20)</Text>
          <Text style={[styles.sectionSub, { color: palette.textSecondary }]}>Mindestens 10 Bewertungen · sortiert nach Schnitt</Text>
        </View>
      </View>
      {setups.length === 0 ? (
        <Text style={[styles.emptyText, { color: palette.textSecondary }]}>
          Noch keine Setups mit 10+ Bewertungen. Sei der erste der eines hochpushed.
        </Text>
      ) : (
        setups.map((r, i) => (
          <TouchableOpacity
            key={r.setup.id}
            style={[styles.row, { borderBottomColor: palette.border }]}
            onPress={() => onPress(r.setup)}
            accessibilityLabel={`rated-${r.setup.id}`}
          >
            <View style={[styles.rank, { backgroundColor: '#fbbf24' }]}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <Image source={{ uri: r.setup.videoThumbnail }} style={[styles.thumb, { backgroundColor: palette.border }]} />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
                {r.setup.title}
              </Text>
              <Text style={[styles.rowMeta, { color: palette.textSecondary }]} numberOfLines={1}>
                ★ {r.averageRating.toFixed(2)} · {r.reviewsCount} Bewertungen · @
                {r.setup.creator.username}
              </Text>
            </View>
            <Text style={styles.rowPrice}>
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
              }).format(r.setup.priceCents / 100)}
              {r.setup.negotiable ? ' (VB)' : ''}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 11, color: '#999', marginTop: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { paddingTop: 22, paddingHorizontal: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionEmoji: { fontSize: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  sectionSub: { fontSize: 12, color: '#888', marginTop: 1 },
  emptyText: {
    color: '#aaa',
    fontSize: 13,
    paddingVertical: 16,
    paddingLeft: 4,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  thumb: { width: 50, height: 70, borderRadius: 8, backgroundColor: '#eee' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  rowMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  rowPrice: { fontSize: 13, fontWeight: '800', color: BRAND.teal },
});

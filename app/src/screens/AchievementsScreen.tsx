import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Achievements'>;

const RARITY_COLOR: Record<Achievement['rarity'], string> = {
  common: '#94a3b8',
  rare: BRAND.teal,
  epic: '#a78bfa',
  legendary: '#fbbf24',
};

export function AchievementsScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { achievements, unlockedCount, totalCount, loading, refresh, evaluateAndGrant } =
    useAchievements();
  const [refreshing, setRefreshing] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleEvaluate() {
    setEvaluating(true);
    await evaluateAndGrant();
    setEvaluating(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>Achievements</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            {unlockedCount} / {totalCount} freigeschaltet
          </Text>
        </View>
        <TouchableOpacity onPress={handleEvaluate} disabled={evaluating}>
          <Text style={[styles.evalBtn, evaluating && { opacity: 0.5 }]}>
            {evaluating ? '…' : 'Check'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND.teal} />
          }
        >
          {achievements.map((a) => (
            <Card key={a.id} a={a} />
          ))}
          <Text style={[styles.foot, { color: palette.textSecondary }]}>
            Tippe „Check" oben rechts um neue Achievements einzulösen, falls die Bedingungen erfüllt
            sind.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Card({ a }: { a: Achievement }) {
  const { palette } = useTheme();
  const color = RARITY_COLOR[a.rarity];
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        a.unlocked ? { borderColor: color } : styles.cardLocked,
      ]}
    >
      <Text style={[styles.cardEmoji, !a.unlocked && styles.cardEmojiLocked]}>{a.emoji}</Text>
      <Text style={[styles.cardTitle, { color: palette.text }, !a.unlocked && styles.cardTitleLocked]} numberOfLines={1}>
        {a.title}
      </Text>
      <Text style={[styles.cardDesc, { color: palette.textSecondary }]} numberOfLines={2}>
        {a.description ?? ''}
      </Text>
      <Text style={[styles.cardRarity, { color: a.unlocked ? color : palette.textSecondary }]}>
        {a.rarity.toUpperCase()}
      </Text>
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
    gap: 8,
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  title: { fontSize: 17, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 11, color: '#888', marginTop: 2 },
  evalBtn: { color: BRAND.tealDark, fontWeight: '800', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between', rowGap: 10 },
  card: {
    width: '48%',
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#eee',
    gap: 4,
  },
  cardLocked: { opacity: 0.5 },
  cardEmoji: { fontSize: 36 },
  cardEmojiLocked: { color: '#ccc' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  cardTitleLocked: { color: '#666' },
  cardDesc: { fontSize: 11, color: '#888', lineHeight: 15, minHeight: 30 },
  cardRarity: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 4 },
  foot: {
    width: '100%',
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});

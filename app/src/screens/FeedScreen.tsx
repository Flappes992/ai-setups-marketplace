import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { SetupCard } from '@/components/SetupCard';
import { SetupCardSkeleton } from '@/components/SetupCardSkeleton';
import { Setup } from '@/types/setup';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { useSetups } from '@/hooks/useSetups';

const { height } = Dimensions.get('window');

type FeedNav = NativeStackNavigationProp<MainStackParamList, 'Tabs'>;
type FeedMode = 'foryou' | 'following';

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();
  const { setups, loading, error, refetch } = useSetups();
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<FeedMode>('foryou');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function handleTagPress(tag: string) {
    Haptics.selectionAsync();
    navigation.navigate('TagFeed', { tag });
  }

  function switchMode(next: FeedMode) {
    if (next === mode) return;
    Haptics.selectionAsync();
    setMode(next);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.topBarRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="open-notifications"
          >
            <Text style={styles.iconBtnText}>🔔</Text>
          </TouchableOpacity>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              onPress={() => switchMode('following')}
              style={styles.modeBtn}
              accessibilityLabel="feed-following"
            >
              <Text style={[styles.modeText, mode === 'following' && styles.modeTextActive]}>
                Following
              </Text>
              {mode === 'following' && <View style={styles.modeUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchMode('foryou')}
              style={styles.modeBtn}
              accessibilityLabel="feed-foryou"
            >
              <Text style={[styles.modeText, mode === 'foryou' && styles.modeTextActive]}>
                For You
              </Text>
              {mode === 'foryou' && <View style={styles.modeUnderline} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Search')}
            accessibilityLabel="open-search"
          >
            <Text style={styles.iconBtnText}>⌕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <SetupCardSkeleton />
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Konnte Setups nicht laden</Text>
          <Text style={styles.stateSubtext}>{error.message}</Text>
        </View>
      ) : setups.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.bigEmoji}>🪶</Text>
          <Text style={styles.stateText}>Noch nichts hier</Text>
          <Text style={styles.stateSubtext}>Sei der erste Creator und lade dein Setup hoch.</Text>
        </View>
      ) : mode === 'following' ? (
        <View style={styles.centerState}>
          <Text style={styles.bigEmoji}>👀</Text>
          <Text style={styles.stateText}>Folge Creators, um sie hier zu sehen</Text>
          <Text style={styles.stateSubtext}>Geh zu For You und such dir welche aus.</Text>
        </View>
      ) : (
        <FlatList<Setup>
          data={setups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate('SetupDetail', { setup: item })}
              accessibilityRole="button"
              accessibilityLabel={`Setup öffnen: ${item.title}`}
            >
              <SetupCard setup={item} onTagPress={handleTagPress} />
            </TouchableOpacity>
          )}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 20,
  },
  modeBtn: { alignItems: 'center', paddingVertical: 6 },
  modeText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modeTextActive: { color: '#fff' },
  modeUnderline: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#facc15',
    marginTop: 4,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 4,
  },
  bigEmoji: { fontSize: 56, marginBottom: 12 },
  stateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  stateSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});

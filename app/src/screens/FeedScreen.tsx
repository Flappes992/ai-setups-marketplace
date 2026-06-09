import {
  View,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  PanResponder,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SetupCard } from '@/components/SetupCard';
import { SetupCardSkeleton } from '@/components/SetupCardSkeleton';
import { Setup } from '@/types/setup';
import { MainStackParamList } from '@/navigation/RootNavigator';
import { useSetups } from '@/hooks/useSetups';
import { getFollowingIds } from '@/hooks/useFollow';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useFeedPersonalization } from '@/hooks/useFeedPersonalization';
import { useAuth } from '@/auth/useAuth';

const { height } = Dimensions.get('window');

function SwipeableCard({
  setup,
  onOpen,
  onTagPress,
}: {
  setup: Setup;
  onOpen: () => void;
  onTagPress: (t: string) => void;
}) {
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60 || g.vx < -0.6) onOpen();
      },
    }),
  ).current;

  return (
    <View {...responder.panHandlers}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Setup öffnen: ${setup.title}`}
      >
        <SetupCard setup={setup} onTagPress={onTagPress} />
      </TouchableOpacity>
    </View>
  );
}

type FeedNav = NativeStackNavigationProp<MainStackParamList, 'Tabs'>;
type FeedMode = 'foryou' | 'following';

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();
  const { session } = useAuth();
  const { setups, loading, error, refetch } = useSetups();
  const unread = useUnreadNotifications();
  const { scoreSetup } = useFeedPersonalization();
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<FeedMode>('foryou');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList<Setup>>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
      unread.refresh();
      if (session?.user?.id) {
        getFollowingIds(session.user.id).then((ids) => setFollowedIds(new Set(ids)));
      }
    }, [refetch, session?.user?.id, unread]),
  );

  useEffect(() => {
    if (mode === 'following' && session?.user?.id) {
      getFollowingIds(session.user.id).then((ids) => setFollowedIds(new Set(ids)));
    }
  }, [mode, session?.user?.id]);

  const visibleSetups = useMemo(() => {
    const base =
      mode === 'following' ? setups.filter((s) => followedIds.has(s.creator.id)) : setups;
    if (mode === 'foryou') {
      // Personalized sort: score DESC, then recency DESC. Setups with no preference match keep
      // their recency order (score=0) but appear after matched ones.
      return [...base]
        .map((s) => ({ s, score: scoreSetup(s), t: Date.parse(s.createdAt) || 0 }))
        .sort((a, b) => b.score - a.score || b.t - a.t)
        .map((x) => x.s);
    }
    return base;
  }, [setups, mode, followedIds, scoreSetup]);

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

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const cardIdx = Math.round(e.nativeEvent.contentOffset.y / height);
    // Only on the very last card — not before
    const visible = visibleSetups.length > 1 && cardIdx >= visibleSetups.length - 1;
    if (visible !== showScrollTop) setShowScrollTop(visible);
  }

  function scrollToTop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.topBarRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Conversations')}
            accessibilityLabel="open-messages"
          >
            <Text style={styles.iconBtnText}>✉</Text>
            {unread.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread.count > 99 ? '99+' : unread.count}</Text>
              </View>
            )}
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

          <View style={styles.rightCluster}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Trending')}
              accessibilityLabel="open-trending"
            >
              <Text style={styles.iconBtnText}>🏆</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Search')}
              accessibilityLabel="open-search"
            >
              <Text style={styles.iconBtnTextLarge}>⌕</Text>
            </TouchableOpacity>
          </View>
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
      ) : mode === 'following' && visibleSetups.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.bigEmoji}>👀</Text>
          <Text style={styles.stateText}>Folge Creators, um sie hier zu sehen</Text>
          <Text style={styles.stateSubtext}>Geh zu For You und such dir welche aus.</Text>
        </View>
      ) : (
        <>
          <FlatList<Setup>
            ref={listRef}
            data={visibleSetups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SwipeableCard
                setup={item}
                onOpen={() => navigation.navigate('SetupDetail', { setup: item })}
                onTagPress={handleTagPress}
              />
            )}
            pagingEnabled
            snapToInterval={height}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces
            alwaysBounceVertical
            overScrollMode="always"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2DD4BF"
                colors={['#2DD4BF']}
                progressViewOffset={60}
              />
            }
          />
          {showScrollTop && (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(150)}
              style={styles.scrollTopWrap}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                onPress={scrollToTop}
                style={styles.scrollTopBtn}
                accessibilityLabel="scroll-to-top"
                activeOpacity={0.85}
              >
                <Text style={styles.scrollTopIcon}>↑</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  iconBtnTextLarge: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  leftSpacer: { width: 44, height: 44 },
  rightCluster: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
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
    backgroundColor: '#2DD4BF',
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
  scrollTopWrap: {
    position: 'absolute',
    top: '50%',
    left: 14,
    marginTop: -22,
  },
  scrollTopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollTopIcon: {
    color: '#0b3b35',
    fontSize: 22,
    fontWeight: '900',
  },
});

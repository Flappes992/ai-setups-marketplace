import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { DbProfile } from '@/types/database';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useMySetups } from '@/hooks/useMySetups';
import { useSavedSetups } from '@/hooks/useSavedSetups';
import { useLikedSetups } from '@/hooks/useLikedSetups';
import { useMyPurchases } from '@/hooks/useMyPurchases';
import { SetupGrid } from '@/components/SetupGrid';
import { EmptyState } from '@/components/EmptyState';
import { useTheme, BRAND } from '@/theme/ThemeProvider';
import { getFollowerCount, getFollowingCount } from '@/hooks/useFollow';
import { useProfileBadge } from '@/hooks/useProfileBadge';

type ProfileNav = NativeStackNavigationProp<MainStackParamList, 'Tabs'>;

type TabKey = 'setups' | 'saved' | 'liked' | 'purchases';

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'setups', label: 'Setups', emoji: '⊞' },
  { key: 'saved', label: 'Saved', emoji: '★' },
  { key: 'liked', label: 'Likes', emoji: '♥' },
  { key: 'purchases', label: 'Käufe', emoji: '✓' },
];

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { session } = useAuth();
  const { palette } = useTheme();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('setups');
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  const mySetups = useMySetups();
  const saved = useSavedSetups();
  const liked = useLikedSetups();
  const purchases = useMyPurchases();
  const { markSeen: markProfileSeen } = useProfileBadge();

  useFocusEffect(
    useCallback(() => {
      markProfileSeen();
    }, [markProfileSeen]),
  );

  const loadProfile = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setProfile(data as DbProfile | null);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      mySetups.refetch();
      saved.refetch();
      liked.refetch();
      purchases.refetch();
      if (session?.user?.id) {
        getFollowingCount(session.user.id).then(setFollowingCount);
        getFollowerCount(session.user.id).then(setFollowerCount);
      }
    }, [loadProfile, mySetups, saved, liked, purchases, session?.user?.id]),
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
        <View style={styles.centerState}>
          <Text style={[styles.errorText, { color: palette.like }]}>Profil nicht gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile.display_name
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tabData = {
    setups: mySetups.setups,
    saved: saved.setups,
    liked: liked.setups,
    purchases: purchases.items.map((p) => p.setup),
  };

  const tabEmpty = {
    setups: 'Du hast noch keine Setups hochgeladen.',
    saved: 'Noch nichts gespeichert.',
    liked: 'Noch nichts geliked.',
    purchases: 'Du hast noch nichts gekauft.',
  };

  const setupsCount = mySetups.setups.length;
  const stats: { label: string; value: number; onPress?: () => void }[] = [
    { label: 'Setups', value: setupsCount },
    {
      label: 'Folge ich',
      value: followingCount,
      onPress: () =>
        session?.user?.id &&
        navigation.navigate('UserList', { userId: session.user.id, mode: 'following' }),
    },
    { label: 'Likes', value: liked.setups.length },
    { label: 'Saved', value: saved.setups.length },
  ];

  const creatorTier = setupsCount >= 20 ? 'gold' : setupsCount >= 5 ? 'silver' : null;
  const tierColor =
    creatorTier === 'gold' ? '#fbbf24' : creatorTier === 'silver' ? '#cbd5e1' : null;

  const joinedDateFull = (() => {
    const t = Date.parse(profile.created_at);
    if (Number.isNaN(t)) return null;
    const d = new Date(t);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  })();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel="open-notifications-profile"
        >
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
        <Text style={[styles.handleTop, { color: palette.text }]}>@{profile.username}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="open-settings"
        >
          <Text style={[styles.gearIcon, { color: palette.text }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View
            style={[
              styles.avatarRing,
              tierColor ? { borderColor: tierColor } : { borderColor: BRAND.teal },
            ]}
          >
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={[styles.avatarImg, { backgroundColor: palette.border }]}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: palette.text }]}>
                <Text style={[styles.avatarLetter, { color: palette.bg }]}>{initials || 'U'}</Text>
              </View>
            )}
            {creatorTier && (
              <View style={[styles.tierBadge, { backgroundColor: tierColor ?? BRAND.teal, borderColor: palette.bg }]}>
                <Text style={styles.tierBadgeText}>{creatorTier === 'gold' ? '★' : '◆'}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.displayName, { color: palette.text }]} numberOfLines={1}>{profile.display_name}</Text>
          <Text style={[styles.username, { color: palette.textSecondary }]}>
            @{profile.username}
          </Text>
          <TouchableOpacity
            onPress={() =>
              session?.user?.id &&
              navigation.navigate('UserList', { userId: session.user.id, mode: 'followers' })
            }
            accessibilityLabel="open-followers"
          >
            <Text style={[styles.followerLine, { color: palette.text }]}>
              <Text style={styles.followerCount}>{followerCount}</Text>
              <Text style={{ color: palette.textSecondary }}> Follower</Text>
            </Text>
          </TouchableOpacity>
          {profile.bio ? (
            <Text style={[styles.bio, { color: palette.text }]}>{profile.bio}</Text>
          ) : (
            <Text style={[styles.bioPlaceholder, { color: palette.textSecondary }]}>
              Noch keine Bio.
            </Text>
          )}

          <View style={styles.statsRow}>
            {stats.map((s, i) => {
              const StatWrap = s.onPress ? TouchableOpacity : View;
              return (
                <View key={s.label} style={styles.statContainer}>
                  <StatWrap
                    style={styles.stat}
                    onPress={s.onPress}
                    accessibilityLabel={s.onPress ? `stat-${s.label}` : undefined}
                  >
                    <Text style={[styles.statValue, { color: palette.text }]} numberOfLines={1}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: palette.textSecondary }]}>
                      {s.label}
                    </Text>
                  </StatWrap>
                  {i < stats.length - 1 && (
                    <View style={[styles.statSep, { backgroundColor: palette.border }]} />
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.cta, styles.ctaPrimary, { backgroundColor: palette.text }]}
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityLabel="edit-profile"
            >
              <Text style={[styles.ctaPrimaryText, { color: palette.bg }]}>Profil bearbeiten</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cta, styles.ctaSecondary, { backgroundColor: palette.surface }]}
              accessibilityLabel="share-profile"
              onPress={async () => {
                try {
                  const { Share } = await import('react-native');
                  await Share.share({
                    message: `Schau dir @${profile.username} auf setiq an`,
                    url: `https://setiq.net/@${profile.username}`,
                  });
                } catch {
                  // cancelled
                }
              }}
            >
              <Text style={[styles.ctaSecondaryText, { color: palette.text }]}>↗</Text>
            </TouchableOpacity>
          </View>

          {joinedDateFull && (
            <Text style={[styles.fastlane, { color: palette.textSecondary }]}>
              Seit dem {joinedDateFull} auf der Überholspur
            </Text>
          )}

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: palette.surface }]}
              onPress={() => navigation.navigate('Achievements')}
              accessibilityLabel="achievements"
            >
              <Text style={styles.quickIcon}>🏆</Text>
              <Text style={[styles.quickLabel, { color: palette.text }]}>Achievements</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: palette.surface }]}
              onPress={() => navigation.navigate('Bundles')}
              accessibilityLabel="bundles"
            >
              <Text style={styles.quickIcon}>📦</Text>
              <Text style={[styles.quickLabel, { color: palette.text }]}>Bundles</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.tabsBar, { borderTopColor: palette.border, backgroundColor: palette.bg }]}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabBtn,
                {
                  borderBottomColor: activeTab === t.key ? palette.text : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(t.key)}
              accessibilityLabel={`profile-tab-${t.key}`}
            >
              <Text
                style={[
                  styles.tabIcon,
                  { color: activeTab === t.key ? palette.text : palette.textSecondary },
                ]}
              >
                {t.emoji}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === t.key ? palette.text : palette.textSecondary },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          <SetupGrid
            setups={tabData[activeTab]}
            emptyText={tabEmpty[activeTab]}
            emptyView={
              activeTab === 'setups' ? (
                <EmptyState
                  icon="🚀"
                  title="Lade dein erstes Setup hoch"
                  subtitle="Custom GPT, Prompt-Stack, n8n-Workflow oder Tutorial — bau dir Cashflow auf."
                  ctaLabel="Setup hochladen"
                  onCta={() => navigation.navigate('SetupUpload')}
                />
              ) : activeTab === 'saved' ? (
                <EmptyState
                  icon="★"
                  title="Noch nichts gespeichert"
                  subtitle="Tippe das Sternchen auf einem Setup, um es hier zu sammeln."
                  ctaLabel="Setups entdecken"
                  onCta={() => navigation.navigate('Tabs', { screen: 'FeedTab' })}
                />
              ) : activeTab === 'liked' ? (
                <EmptyState
                  icon="♥"
                  title="Noch keine Likes"
                  subtitle="Doppel-tap auf Setups die du feierst — die landen hier."
                  ctaLabel="Zum Feed"
                  onCta={() => navigation.navigate('Tabs', { screen: 'FeedTab' })}
                />
              ) : (
                <EmptyState
                  icon="🛒"
                  title="Du hast noch nichts gekauft"
                  subtitle="Im Marketplace findest du sofort einsetzbare AI-Setups von echten Creators."
                  ctaLabel="Marketplace öffnen"
                  onCta={() => navigation.navigate('Tabs', { screen: 'FeedTab' })}
                />
              )
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 100 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#cc0000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  handleTop: { fontSize: 17, fontWeight: '800', color: '#111' },
  gearIcon: { fontSize: 26, color: '#111' },
  bellIcon: { fontSize: 22 },
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarImg: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#eee' },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  tierBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  tierBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  followerLine: { fontSize: 14, marginTop: 6, fontWeight: '500' },
  followerCount: { fontWeight: '800' },
  fastlane: {
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
    letterSpacing: 0.2,
    opacity: 0.7,
  },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickIcon: { fontSize: 18 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#111' },
  username: { fontSize: 14, color: '#666', marginTop: 2 },
  bio: {
    fontSize: 14,
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  bioPlaceholder: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  statContainer: { flexDirection: 'row', alignItems: 'center' },
  statSep: { width: 1, height: 24, backgroundColor: '#e5e5e5', marginHorizontal: 12 },
  stat: { alignItems: 'center', minWidth: 64 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111' },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ctaRow: { flexDirection: 'row', marginTop: 22, gap: 8, width: '100%' },
  cta: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: { flex: 1, backgroundColor: '#111' },
  ctaPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ctaSecondary: {
    width: 46,
    backgroundColor: '#f5f5f5',
  },
  ctaSecondaryText: { color: '#111', fontSize: 18, fontWeight: '700' },
  tabsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    marginTop: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 2,
  },
  tabBtnActive: { borderBottomColor: '#111' },
  tabIcon: { fontSize: 18, color: '#999' },
  tabIconActive: { color: '#111' },
  tabLabel: { fontSize: 11, color: '#999', fontWeight: '700', textTransform: 'uppercase' },
  tabLabelActive: { color: '#111' },
  tabContent: { paddingTop: 4 },
});

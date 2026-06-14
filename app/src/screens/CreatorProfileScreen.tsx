import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/services/supabase';
import { mapDbSetupToSetup } from '@/services/setupMapper';
import { DbProfile, DbSetupWithCreator } from '@/types/database';
import { Setup } from '@/types/setup';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useAuth } from '@/auth/useAuth';
import { useFollow, getFollowerCount } from '@/hooks/useFollow';
import { useBlock } from '@/hooks/useBlock';
import { SetupGrid } from '@/components/SetupGrid';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { ReportModal } from '@/components/ReportModal';
import { useConversations } from '@/hooks/useConversations';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'CreatorProfile'>;
type RouteProps = NativeStackScreenProps<MainStackParamList, 'CreatorProfile'>['route'];

export function CreatorProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { session } = useAuth();
  const { palette } = useTheme();
  const toast = useToast();
  const creatorId = route.params.creatorId;
  const isSelf = session?.user?.id === creatorId;

  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [likesReceived, setLikesReceived] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const { following, toggle: rawToggleFollow } = useFollow(creatorId);
  const { blocked, toggle: toggleBlock } = useBlock(creatorId);
  const { openOrCreate } = useConversations();

  const toggleFollow = useCallback(async () => {
    await rawToggleFollow();
    const c = await getFollowerCount(creatorId);
    setFollowerCount(c);
  }, [rawToggleFollow, creatorId]);

  function openMenu() {
    if (isSelf) return;
    Alert.alert(`@${profile?.username ?? ''}`, undefined, [
      {
        text: blocked ? 'Entsperren' : 'Blockieren',
        style: blocked ? 'default' : ('destructive' as const),
        onPress: async () => {
          await toggleBlock();
          toast.show(blocked ? 'Entsperrt' : 'Blockiert', 'success');
          if (!blocked) navigation.goBack();
        },
      },
      { text: 'Profil melden', onPress: () => setReportOpen(true) },
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [profileRes, setupsRes, followers] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', creatorId).single(),
      supabase
        .from('setups')
        .select('*, creator:profiles!setups_creator_id_fkey(*)')
        .eq('creator_id', creatorId)
        .eq('status', 'live')
        .order('created_at', { ascending: false }),
      getFollowerCount(creatorId),
    ]);
    setProfile((profileRes.data as DbProfile | null) ?? null);
    setFollowerCount(followers);
    const mappedSetups = ((setupsRes.data as DbSetupWithCreator[] | null) ?? []).map(
      mapDbSetupToSetup,
    );
    setSetups(mappedSetups);

    if (mappedSetups.length > 0) {
      const ids = mappedSetups.map((s) => s.id);
      const { count } = await supabase
        .from('likes')
        .select('setup_id', { count: 'exact', head: true })
        .in('setup_id', ids);
      setLikesReceived(count ?? 0);
    } else {
      setLikesReceived(0);
    }
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.bg }]}
        edges={['top', 'bottom']}
      >
        <View style={[styles.topBar, { backgroundColor: palette.bg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
            <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.bg }]}
        edges={['top', 'bottom']}
      >
        <View style={[styles.topBar, { backgroundColor: palette.bg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
            <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
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

  const setupsCount = setups.length;
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

  async function handleShare() {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Schau dir @${profile.username} auf setiq an`,
        url: `https://setiq.net/@${profile.username}`,
      });
    } catch {
      // cancelled
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={[styles.topBar, { backgroundColor: palette.bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: palette.text }]}>@{profile.username}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={handleShare} accessibilityLabel="share-creator-profile">
            <Text style={[styles.shareIcon, { color: palette.text }]}>↗</Text>
          </TouchableOpacity>
          {!isSelf && (
            <TouchableOpacity onPress={openMenu} accessibilityLabel="creator-menu">
              <Text style={[styles.shareIcon, { color: palette.text }]}>⋯</Text>
            </TouchableOpacity>
          )}
        </View>
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
              <View style={[styles.tierBadge, { backgroundColor: tierColor ?? BRAND.teal }]}>
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
              navigation.navigate('UserList', { userId: creatorId, mode: 'followers' })
            }
            accessibilityLabel="open-creator-followers"
          >
            <Text style={[styles.followerLine, { color: palette.text }]}>
              <Text style={styles.followerCount}>{followerCount}</Text>
              <Text style={[styles.followerLabel, { color: palette.textSecondary }]}> Follower</Text>
            </Text>
          </TouchableOpacity>

          {profile.bio ? (
            <Text style={[styles.bio, { color: palette.text }]}>{profile.bio}</Text>
          ) : (
            <Text style={[styles.bioPlaceholder, { color: palette.textSecondary }]}>Keine Bio</Text>
          )}

          <View style={styles.statsRow}>
            <Stat label="Setups" value={setupsCount} palette={palette} />
            <Sep palette={palette} />
            <Stat label="Likes" value={likesReceived} palette={palette} />
            <Sep palette={palette} />
            <Stat
              label="Tier"
              value={creatorTier ? (creatorTier === 'gold' ? '★' : '◆') : '—'}
              palette={palette}
            />
          </View>

          {!isSelf && (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  following && [styles.followBtnActive, { backgroundColor: palette.surface }],
                ]}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await toggleFollow();
                }}
                accessibilityLabel={following ? 'unfollow-creator' : 'follow-creator'}
              >
                <Text
                  style={[
                    styles.followText,
                    following && [styles.followTextActive, { color: palette.textSecondary }],
                  ]}
                >
                  {following ? '✓ Folgst du' : '+ Folgen'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.msgBtn, { backgroundColor: palette.surface }]}
                onPress={async () => {
                  if (!profile) return;
                  const cid = await openOrCreate(creatorId);
                  if (!cid) {
                    toast.show('Konnte Konversation nicht öffnen', 'error');
                    return;
                  }
                  navigation.navigate('Conversation', {
                    conversationId: cid,
                    otherUserId: creatorId,
                    otherUsername: profile.username,
                    otherDisplayName: profile.display_name,
                    otherAvatarUrl: profile.avatar_url,
                  });
                }}
                accessibilityLabel="message-creator"
              >
                <Text style={[styles.msgIcon, { color: palette.text }]}>✉</Text>
              </TouchableOpacity>
            </View>
          )}

          {joinedDateFull && (
            <Text style={[styles.fastlane, { color: palette.textSecondary }]}>
              Seit dem {joinedDateFull} auf der Überholspur
            </Text>
          )}
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Setups</Text>
          <Text
            style={[
              styles.sectionCount,
              { color: palette.textSecondary, backgroundColor: palette.surface },
            ]}
          >
            {setupsCount}
          </Text>
        </View>

        <View style={styles.tabContent}>
          <SetupGrid
            setups={setups}
            emptyText=""
            emptyView={
              <EmptyState
                icon="🪶"
                title="Noch keine Setups"
                subtitle={`${profile.display_name} hat noch nichts hochgeladen.`}
              />
            }
          />
        </View>
      </ScrollView>

      <ReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="profile"
        targetId={creatorId}
        targetLabel={`@${profile.username}`}
      />
    </SafeAreaView>
  );
}

type Palette = ReturnType<typeof useTheme>['palette'];

function Stat({
  label,
  value,
  palette,
}: {
  label: string;
  value: number | string;
  palette: Palette;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: palette.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{label}</Text>
    </View>
  );
}

function Sep({ palette }: { palette: Palette }) {
  return <View style={[styles.statSep, { backgroundColor: palette.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#cc0000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#111' },
  shareIcon: { fontSize: 22, color: '#111', fontWeight: '700', width: 30, textAlign: 'right' },

  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
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

  displayName: { fontSize: 22, fontWeight: '800', color: '#111' },
  username: { fontSize: 14, color: '#666', marginTop: 2 },
  followerLine: { fontSize: 14, marginTop: 6, fontWeight: '500', color: '#111' },
  followerCount: { fontWeight: '800' },
  followerLabel: { color: '#666' },
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

  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 12 },
  statSep: { width: 1, height: 24, backgroundColor: '#e5e5e5' },
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
  followBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.teal,
  },
  followBtnActive: {
    backgroundColor: '#f0f0f0',
  },
  followText: { color: '#0b3b35', fontWeight: '800', fontSize: 14 },
  followTextActive: { color: '#666' },
  msgBtn: {
    width: 46,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  msgIcon: { fontSize: 18, color: '#111' },

  fastlane: {
    fontSize: 11,
    marginTop: 14,
    fontStyle: 'italic',
    letterSpacing: 0.2,
    opacity: 0.65,
    color: '#666',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111', textTransform: 'uppercase' },
  sectionCount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '700',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabContent: { paddingTop: 2 },
});

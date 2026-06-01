import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { DbProfile } from '@/types/database';
import { getFollowerIds, getFollowingIds, useFollow, getFollowerCount } from '@/hooks/useFollow';
import { useAuth } from '@/auth/useAuth';
import { BRAND } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'UserList'>;
type RouteProps = NativeStackScreenProps<MainStackParamList, 'UserList'>['route'];

export function UserListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { session } = useAuth();
  const { userId, mode } = route.params;
  const isOwn = session?.user?.id === userId;

  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const ids = mode === 'followers' ? await getFollowerIds(userId) : await getFollowingIds(userId);
    if (ids.length === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').in('id', ids);
    setProfiles((data as DbProfile[] | null) ?? []);
    setLoading(false);
  }, [userId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) => p.username.toLowerCase().includes(q) || p.display_name.toLowerCase().includes(q),
    );
  }, [profiles, query]);

  const title = (() => {
    if (mode === 'followers') return isOwn ? 'Deine Follower' : 'Follower';
    return isOwn ? 'Du folgst' : 'Folgt';
  })();

  const emptyEmoji = mode === 'followers' ? '👋' : '👀';
  const emptyTitle =
    mode === 'followers'
      ? isOwn
        ? 'Noch keine Follower'
        : 'Noch keine Follower'
      : isOwn
        ? 'Du folgst noch niemandem'
        : 'Folgt noch niemandem';
  const emptySub =
    mode === 'followers'
      ? isOwn
        ? 'Lade Setups hoch und teile dein Profil — die ersten kommen.'
        : 'Niemand folgt diesem Creator bisher.'
      : isOwn
        ? 'Tippe „+ Folgen" auf Creators die du krass findest.'
        : 'Hier wird niemandem gefolgt.';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Suche nach Name oder @handle"
          style={styles.searchInput}
          selectionColor={BRAND.teal}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="userlist-search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : profiles.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>{emptyEmoji}</Text>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySub}>{emptySub}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Keine Treffer</Text>
          <Text style={styles.emptySub}>Keine Übereinstimmung mit {'„' + query + '"'}.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item }) => <Row profile={item} onChange={load} />}
        />
      )}
    </SafeAreaView>
  );
}

function Row({ profile, onChange }: { profile: DbProfile; onChange: () => void }) {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const myId = session?.user?.id;
  const isMe = myId === profile.id;
  const { following, toggle } = useFollow(profile.id);
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  useEffect(() => {
    getFollowerCount(profile.id).then(setFollowerCount);
  }, [profile.id]);

  const initials = profile.display_name.charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowTap}
        onPress={() => navigation.navigate('CreatorProfile', { creatorId: profile.id })}
        accessibilityLabel={`open-${profile.username}`}
      >
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{initials}</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.display_name}
          </Text>
          <Text style={styles.handle} numberOfLines={1}>
            @{profile.username}
            {followerCount !== null && followerCount > 0 ? ` · ${followerCount} Follower` : ''}
          </Text>
        </View>
      </TouchableOpacity>
      {!isMe && (
        <TouchableOpacity
          onPress={async () => {
            await toggle();
            onChange();
          }}
          style={[styles.btn, !following && styles.btnFollow]}
        >
          <Text style={[styles.btnText, !following && styles.btnFollowText]}>
            {following ? 'Folgst du' : '+ Folgen'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 18, color: '#888' },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  searchClear: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 50, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowTap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111' },
  handle: { fontSize: 12, color: '#888', marginTop: 2 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  btnFollow: { backgroundColor: BRAND.teal },
  btnText: { fontSize: 13, fontWeight: '700', color: '#666' },
  btnFollowText: { color: '#0b3b35' },
});

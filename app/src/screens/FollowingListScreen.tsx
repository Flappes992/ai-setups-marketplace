import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { DbProfile } from '@/types/database';
import { getFollowingIds, useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/auth/useAuth';
import { BRAND } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'FollowingList'>;

export function FollowingListScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user?.id) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    const ids = await getFollowingIds(session.user.id);
    if (ids.length === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').in('id', ids);
    setProfiles((data as DbProfile[] | null) ?? []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Folge ich</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : profiles.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👀</Text>
          <Text style={styles.emptyTitle}>Du folgst noch niemandem</Text>
          <Text style={styles.emptySub}>
            Tippe {'„+ Folgen"'} auf Creators die du krass findest — sie tauchen dann hier auf.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item }) => <CreatorRow profile={item} onReload={load} />}
        />
      )}
    </SafeAreaView>
  );
}

function CreatorRow({ profile, onReload }: { profile: DbProfile; onReload: () => void }) {
  const navigation = useNavigation<Nav>();
  const { following, toggle } = useFollow(profile.id);
  const initials = profile.display_name.charAt(0).toUpperCase();
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowTap}
        onPress={() => navigation.navigate('CreatorProfile', { creatorId: profile.id })}
        accessibilityLabel={`open-creator-${profile.username}`}
      >
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{initials}</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.name}>{profile.display_name}</Text>
          <Text style={styles.handle}>@{profile.username}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={async () => {
          await toggle();
          onReload();
        }}
        style={[styles.btn, !following && styles.btnFollow]}
      >
        <Text style={[styles.btnText, !following && styles.btnFollowText]}>
          {following ? 'Folgst du' : '+ Folgen'}
        </Text>
      </TouchableOpacity>
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
  handle: { fontSize: 13, color: '#888', marginTop: 2 },
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

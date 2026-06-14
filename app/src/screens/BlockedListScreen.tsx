import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { supabase } from '@/services/supabase';
import { DbProfile } from '@/types/database';
import { getBlockedIds, useBlock } from '@/hooks/useBlock';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/components/Toast';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BlockedList'>;

export function BlockedListScreen() {
  const navigation = useNavigation<Nav>();
  const { palette } = useTheme();
  const { session } = useAuth();
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user?.id) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    const set = await getBlockedIds(session.user.id);
    const ids = [...set];
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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="back" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Blockierte Accounts</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BRAND.teal} />
        </View>
      ) : profiles.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🚫</Text>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Keine blockierten Accounts</Text>
          <Text style={[styles.emptySub, { color: palette.textSecondary }]}>
            Long-press auf einen Kommentar oder einen Account um zu blockieren.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item }) => <Row profile={item} onChange={load} />}
        />
      )}
    </SafeAreaView>
  );
}

function Row({ profile, onChange }: { profile: DbProfile; onChange: () => void }) {
  const { palette } = useTheme();
  const { toggle } = useBlock(profile.id);
  const toast = useToast();
  const initials = profile.display_name.charAt(0).toUpperCase();

  function confirmUnblock() {
    Alert.alert(
      `@${profile.username} entsperren?`,
      'Du siehst wieder die Inhalte dieses Accounts. Folge-Beziehungen werden NICHT wiederhergestellt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entsperren',
          style: 'destructive',
          onPress: async () => {
            await toggle();
            toast.show('Entsperrt', 'success');
            onChange();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{initials}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: palette.text }]}>{profile.display_name}</Text>
        <Text style={[styles.handle, { color: palette.textSecondary }]}>@{profile.username}</Text>
      </View>
      <TouchableOpacity onPress={confirmUnblock} style={[styles.btn, { backgroundColor: palette.surface }]}>
        <Text style={[styles.btnText, { color: palette.textSecondary }]}>Entsperren</Text>
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
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111' },
  handle: { fontSize: 13, color: '#888', marginTop: 2 },
  btn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#f0f0f0' },
  btnText: { fontSize: 13, fontWeight: '700', color: '#666' },
});
